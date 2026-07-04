import type { StatusClass } from "../data/status-codes"

export type SnippetLang = "curl" | "fetch" | "python" | "go" | "node"

export const snippetLangs: readonly SnippetLang[] = [
  "curl",
  "fetch",
  "python",
  "go",
  "node",
]

export const snippetLabels: Record<SnippetLang, string> = {
  curl: "curl",
  fetch: "fetch",
  python: "Python",
  go: "Go",
  node: "Node",
}

export const renderSnippet = (lang: SnippetLang, url: string): string => {
  switch (lang) {
    case "curl":
      return `curl -i ${url}`
    case "fetch":
      return `const res = await fetch("${url}");\nconsole.log(res.status, await res.text());`
    case "python":
      return `import requests\n\nres = requests.get("${url}")\nprint(res.status_code, res.text)`
    case "go":
      return `package main\n\nimport (\n  "fmt"\n  "io"\n  "net/http"\n)\n\nfunc main() {\n  res, _ := http.Get("${url}")\n  defer res.Body.Close()\n  body, _ := io.ReadAll(res.Body)\n  fmt.Println(res.StatusCode, string(body))\n}`
    case "node":
      return `import http from "node:https";\n\nhttp.get("${url}", (res) => {\n  let body = "";\n  res.on("data", (c) => (body += c));\n  res.on("end", () => console.log(res.statusCode, body));\n});`
  }
}

const escapeHtml = (s: string): string =>
  s.replaceAll(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return map[c] ?? c
  })

// Highlight only the status code number inside the URL.
// Everything else stays plain. Path stays muted, code in class color.
export const highlightSnippet = (
  text: string,
  code: number,
  cls: StatusClass,
): string => {
  const codeStr = String(code)
  const url = `https://glowostat.us/${codeStr}`
  const parts = text.split(url)
  const colorVar = `var(--color-class-${cls})`
  const highlightedUrl = `<span class="text-muted">https://glowostat.us/</span><span style="color: ${colorVar}">${codeStr}</span>`
  return parts.map(escapeHtml).join(highlightedUrl)
}
