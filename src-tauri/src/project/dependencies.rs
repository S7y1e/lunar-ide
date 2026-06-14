//! The module dependency graph — which Luau module `require`s which.
//!
//! This is a query on the owned model, not a text grep: a small Luau lexer skips
//! comments and string literals before looking for `require(...)`, and each
//! require is resolved to a target file against the sourcemap we own (so
//! `script.Parent.Foo`, `game.ReplicatedStorage.Shared.Bar`, a service name, or
//! a `GetService`-bound local all resolve to the right module). Anything it
//! can't resolve is reported as unresolved rather than guessed — the foundation
//! for event topography in Phase 2.

use std::collections::{HashMap, HashSet};
use std::path::Path;

use serde::Serialize;
use tauri::State;

use super::{DataModelNode, ProjectStore};

const SOURCEMAP_FILE: &str = "sourcemap.json";
const SCRIPT_EXT: [&str; 2] = [".luau", ".lua"];

#[derive(Debug, Clone, Serialize)]
pub struct DependencyEdge {
    /// Relative file path of the requiring module.
    pub from: String,
    /// Relative file path of the required module.
    pub to: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct UnresolvedRequire {
    pub from: String,
    /// The require expression as written, e.g. `script.Parent.Missing`.
    pub expr: String,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct DependencyGraph {
    pub edges: Vec<DependencyEdge>,
    pub unresolved: Vec<UnresolvedRequire>,
}

/// The whole-project dependency graph, or `null` when no project/sourcemap.
#[tauri::command]
pub fn project_dependencies(store: State<'_, ProjectStore>) -> Option<DependencyGraph> {
    let root = store.0.lock().unwrap().as_ref().map(|m| m.root.clone())?;
    let text = std::fs::read_to_string(root.join(SOURCEMAP_FILE)).ok()?;
    let tree: DataModelNode = serde_json::from_str(&text).ok()?;
    Some(build(&root, &tree))
}

fn script_file(node: &DataModelNode) -> Option<String> {
    node.file_paths
        .iter()
        .map(|p| p.replace('\\', "/"))
        .find(|p| SCRIPT_EXT.iter().any(|e| p.ends_with(e)))
}

/// Walk the sourcemap collecting, for every script instance, its instance chain
/// (names from the root) and the file that backs it.
fn collect(
    node: &DataModelNode,
    chain: &mut Vec<String>,
    by_chain: &mut HashMap<Vec<String>, String>,
    file_to_chain: &mut HashMap<String, Vec<String>>,
) {
    chain.push(node.name.clone());
    if let Some(file) = script_file(node) {
        by_chain.insert(chain.clone(), file.clone());
        file_to_chain.insert(file, chain.clone());
    }
    for child in &node.children {
        collect(child, chain, by_chain, file_to_chain);
    }
    chain.pop();
}

pub fn build(root: &Path, tree: &DataModelNode) -> DependencyGraph {
    let root_name = tree.name.clone();
    let services: HashSet<String> = tree.children.iter().map(|c| c.name.clone()).collect();

    let mut by_chain = HashMap::new();
    let mut file_to_chain = HashMap::new();
    collect(tree, &mut Vec::new(), &mut by_chain, &mut file_to_chain);

    let mut seen: HashSet<(String, String)> = HashSet::new();
    let mut edges = Vec::new();
    let mut unresolved = Vec::new();

    for (file, chain) in &file_to_chain {
        let content = match std::fs::read_to_string(root.join(file)) {
            Ok(c) => c,
            Err(_) => continue,
        };
        let tokens = lex(&content);
        let locals = collect_locals(&tokens, chain, &root_name, &services);

        for require in find_requires(&tokens) {
            match require {
                ChainArg::Str(s) => unresolved.push(UnresolvedRequire {
                    from: file.clone(),
                    expr: format!("\"{s}\""),
                }),
                ChainArg::Path(segs) => {
                    let target =
                        resolve(&segs, Some(chain), &root_name, &services, &locals);
                    match target.and_then(|c| by_chain.get(&c).cloned()) {
                        Some(to) if &to != file => {
                            if seen.insert((file.clone(), to.clone())) {
                                edges.push(DependencyEdge {
                                    from: file.clone(),
                                    to,
                                });
                            }
                        }
                        Some(_) => {} // self-require, ignore
                        None => unresolved.push(UnresolvedRequire {
                            from: file.clone(),
                            expr: segs.join("."),
                        }),
                    }
                }
            }
        }
    }

    DependencyGraph { edges, unresolved }
}

/// Resolve a require's name chain to a target instance chain, or None when it
/// can't be resolved from static information.
fn resolve(
    segs: &[String],
    current: Option<&Vec<String>>,
    root_name: &str,
    services: &HashSet<String>,
    locals: &HashMap<String, Vec<String>>,
) -> Option<Vec<String>> {
    let head = segs.first()?;
    let mut chain = match head.as_str() {
        "script" => current?.clone(),
        "game" => vec![root_name.to_string()],
        name if services.contains(name) => vec![root_name.to_string(), name.to_string()],
        name if locals.contains_key(name) => locals[name].clone(),
        _ => return None,
    };

    for seg in &segs[1..] {
        if seg == "Parent" {
            chain.pop();
            if chain.is_empty() {
                return None;
            }
        } else {
            chain.push(seg.clone());
        }
    }
    Some(chain)
}

/// `local NAME = <service expr>` bindings, so `require(NAME.Foo)` resolves.
fn collect_locals(
    tokens: &[Tok],
    current: &Vec<String>,
    root_name: &str,
    services: &HashSet<String>,
) -> HashMap<String, Vec<String>> {
    let mut locals: HashMap<String, Vec<String>> = HashMap::new();
    for i in 0..tokens.len() {
        if tokens[i] != Tok::Local {
            continue;
        }
        let (Some(Tok::Ident(name)), Some(Tok::Equal)) =
            (tokens.get(i + 1), tokens.get(i + 2))
        else {
            continue;
        };
        if let Some(ChainArg::Path(segs)) = parse_chain(tokens, i + 3) {
            if let Some(chain) = resolve(&segs, Some(current), root_name, services, &locals) {
                locals.insert(name.clone(), chain);
            }
        }
    }
    locals
}

/// Every `require(...)` argument in the token stream.
fn find_requires(tokens: &[Tok]) -> Vec<ChainArg> {
    let mut out = Vec::new();
    for i in 0..tokens.len() {
        if let Tok::Ident(name) = &tokens[i] {
            if name == "require" && matches!(tokens.get(i + 1), Some(Tok::LParen)) {
                if let Some(arg) = parse_chain(tokens, i + 2) {
                    out.push(arg);
                }
            }
        }
    }
    out
}

enum ChainArg {
    Path(Vec<String>),
    Str(String),
}

/// Parse the dotted instance path that starts at `i` (the first token inside a
/// `require(` or after a `local x =`). `game:GetService("X")` collapses to the
/// service; other method calls or complex expressions stop the chain.
fn parse_chain(tokens: &[Tok], mut i: usize) -> Option<ChainArg> {
    match tokens.get(i)? {
        Tok::Str(s) => Some(ChainArg::Str(s.clone())),
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

// --- A tiny Luau lexer: enough to find requires while ignoring comments and
// strings. Not a full parser; it only emits the token kinds the resolver needs.

#[derive(Debug, Clone, PartialEq)]
enum Tok {
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

fn is_ident_start(c: u8) -> bool {
    c.is_ascii_alphabetic() || c == b'_'
}
fn is_ident_part(c: u8) -> bool {
    c.is_ascii_alphanumeric() || c == b'_'
}

/// `[`, optional `=`*, `[` opens a long bracket of that level. Returns the level.
fn long_bracket_level(b: &[u8], i: usize) -> Option<usize> {
    if b.get(i) != Some(&b'[') {
        return None;
    }
    let mut j = i + 1;
    let mut eq = 0;
    while b.get(j) == Some(&b'=') {
        eq += 1;
        j += 1;
    }
    if b.get(j) == Some(&b'[') {
        Some(eq)
    } else {
        None
    }
}

fn closes_long_bracket(b: &[u8], j: usize, level: usize) -> bool {
    if b.get(j) != Some(&b']') {
        return false;
    }
    for k in 0..level {
        if b.get(j + 1 + k) != Some(&b'=') {
            return false;
        }
    }
    b.get(j + 1 + level) == Some(&b']')
}

/// Read a long-bracket span (string or comment) starting at the opening `[`.
/// Returns the index just past the closing bracket.
fn skip_long_bracket(b: &[u8], i: usize, level: usize) -> usize {
    let mut j = i + 2 + level;
    while j < b.len() {
        if closes_long_bracket(b, j, level) {
            return j + level + 2;
        }
        j += 1;
    }
    b.len()
}

fn read_quoted(b: &[u8], start: usize, quote: u8) -> (String, usize) {
    let mut i = start + 1;
    let mut bytes = Vec::new();
    while i < b.len() {
        let c = b[i];
        if c == b'\\' {
            if i + 1 < b.len() {
                bytes.push(b[i + 1]);
                i += 2;
            } else {
                i += 1;
            }
            continue;
        }
        if c == quote {
            i += 1;
            break;
        }
        bytes.push(c);
        i += 1;
    }
    (String::from_utf8_lossy(&bytes).into_owned(), i)
}

fn lex(src: &str) -> Vec<Tok> {
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
