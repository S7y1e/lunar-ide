use super::lex_util::{
    is_ident_part, is_ident_start, long_bracket_level, read_quoted, skip_long_bracket,
};

#[derive(Debug, Clone, PartialEq)]
pub(super) enum Tok {
    Ident(String),
    Str(String),
    Local,
    Dot,
    Colon,
    LParen,
    RParen,
    Comma,
    Equal,
    Other,
}

pub(super) enum ChainArg {
    Path(Vec<String>),
    Str(String),
}

fn alias_chain(s: &str) -> Option<ChainArg> {
    let rest = s.strip_prefix("@game/")?;
    let mut segs = vec!["game".to_string()];
    segs.extend(rest.split('/').map(str::to_string));
    Some(ChainArg::Path(segs))
}

pub(super) fn lex(src: &str) -> Vec<Tok> {
    let b = src.as_bytes();
    let n = b.len();
    let mut i = 0;
    let mut out = Vec::new();

    while i < n {
        let c = b[i];
        match c {
            b' ' | b'\t' | b'\r' | b'\n' => i += 1,
            b'-' if b.get(i + 1) == Some(&b'-') => {
                i += 2;
                if let Some(level) = long_bracket_level(b, i) {
                    i = skip_long_bracket(b, i, level);
                } else {
                    while i < n && b[i] != b'\n' {
                        i += 1;
                    }
                }
            }
            b'"' | b'\'' => {
                let (s, ni) = read_quoted(b, i, c);
                out.push(Tok::Str(s));
                i = ni;
            }
            b'[' if long_bracket_level(b, i).is_some() => {
                let level = long_bracket_level(b, i).unwrap();
                let start = i + 2 + level;
                let end = skip_long_bracket(b, i, level);
                let inner_end = end.saturating_sub(level + 2).max(start);
                out.push(Tok::Str(
                    String::from_utf8_lossy(&b[start..inner_end]).into_owned(),
                ));
                i = end;
            }
            b'.' => {
                out.push(Tok::Dot);
                i += 1;
            }
            b':' => {
                out.push(Tok::Colon);
                i += 1;
            }
            b'(' => {
                out.push(Tok::LParen);
                i += 1;
            }
            b')' => {
                out.push(Tok::RParen);
                i += 1;
            }
            b',' => {
                out.push(Tok::Comma);
                i += 1;
            }
            b'=' => {
                if b.get(i + 1) == Some(&b'=') {
                    out.push(Tok::Other);
                    i += 2;
                } else {
                    out.push(Tok::Equal);
                    i += 1;
                }
            }
            _ if is_ident_start(c) => {
                let start = i;
                i += 1;
                while i < n && is_ident_part(b[i]) {
                    i += 1;
                }
                let s = &src[start..i];
                out.push(if s == "local" {
                    Tok::Local
                } else {
                    Tok::Ident(s.to_string())
                });
            }
            _ => {
                out.push(Tok::Other);
                i += 1;
            }
        }
    }
    out
}

pub(super) fn parse_chain(tokens: &[Tok], mut i: usize) -> Option<ChainArg> {
    match tokens.get(i)? {
        Tok::Str(s) => Some(alias_chain(s).unwrap_or_else(|| ChainArg::Str(s.clone()))),
        Tok::Ident(name) => {
            let mut segs = vec![name.clone()];
            i += 1;
            loop {
                match tokens.get(i) {
                    Some(Tok::Dot) => match tokens.get(i + 1) {
                        Some(Tok::Ident(n)) => {
                            segs.push(n.clone());
                            i += 2;
                        }
                        _ => break,
                    },
                    Some(Tok::Colon) => {
                        if let (
                            Some(Tok::Ident(m)),
                            Some(Tok::LParen),
                            Some(Tok::Str(svc)),
                            Some(Tok::RParen),
                        ) = (
                            tokens.get(i + 1),
                            tokens.get(i + 2),
                            tokens.get(i + 3),
                            tokens.get(i + 4),
                        ) {
                            if m == "GetService" {
                                segs = vec!["game".to_string(), svc.clone()];
                                i += 5;
                                continue;
                            }
                        }
                        break;
                    }
                    _ => break,
                }
            }
            Some(ChainArg::Path(segs))
        }
        _ => None,
    }
}
