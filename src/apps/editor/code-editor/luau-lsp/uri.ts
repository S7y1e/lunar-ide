export function pathToUri(path: string): string {
    let normalized = path.replace(/\\/g, "/");
    if (!normalized.startsWith("/")) normalized = "/" + normalized;
    return "file://" + encodeURI(normalized);
}

export function uriToPath(uri: string): string {
    let path = uri.replace(/^file:\/\//, "");
    try {
        path = decodeURI(path);
    } catch {}
    if (/^\/[A-Za-z]:/.test(path)) path = path.slice(1);
    return path.replace(/\//g, "\\");
}
