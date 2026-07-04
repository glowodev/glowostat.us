import type { Context } from "hono"
import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status"
import { NULL_BODY_STATUSES } from "./constants"
import type { WorkerEnv } from "./env"
import { reasonFor } from "./status-codes"

const expectJson = (req: Request): boolean =>
  (req.headers.get("Accept") ?? "").includes("application/json")

export const resolveWait = (
  query: { sleep?: number },
  headers: { "x-httpstatus-sleep"?: number },
): number => Math.max(query.sleep ?? 0, headers["x-httpstatus-sleep"] ?? 0)

const canonicalHeaderName = (name: string): string =>
  name.replaceAll(
    /(^|-)([a-z])/g,
    (_, sep: string, ch: string) => sep + ch.toUpperCase(),
  )

export type RequestEcho = {
  args: Record<string, string | string[]>
  headers: Record<string, string>
  origin: string
  url: string
}

export const requestEcho = (req: Request): RequestEcho => {
  const url = new URL(req.url)
  // Null prototypes: a "__proto__" query param or header must become an own
  // JSON field, not a prototype assignment that silently drops the key.
  const args: Record<string, string | string[]> = Object.create(null)
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key)
    args[key] = values.length === 1 ? values[0]! : values
  }
  const headers: Record<string, string> = Object.create(null)
  for (const [name, value] of req.headers) {
    headers[canonicalHeaderName(name)] = value
  }
  return {
    args,
    headers,
    origin: req.headers.get("CF-Connecting-IP") ?? "",
    url: url.toString(),
  }
}

const basicSchemeRe = /^basic +(.+)$/i

export const decodeBasicAuth = (header: string | undefined): string | null => {
  const encoded = header?.match(basicSchemeRe)?.[1]
  if (!encoded) {
    return null
  }
  // BOUNDARY: atob throws on malformed base64 from the client
  try {
    const bytes = Uint8Array.from(atob(encoded), (ch) => ch.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

export const respondWithStatus = (
  c: Context<{ Bindings: WorkerEnv }>,
  code: number,
) => {
  if (NULL_BODY_STATUSES.has(code)) {
    return c.body(null, code as StatusCode)
  }
  const reason = reasonFor(code)
  return expectJson(c.req.raw)
    ? c.json({ code, description: reason }, code as ContentfulStatusCode)
    : c.text(`${code} ${reason}`, code as ContentfulStatusCode)
}
