import type { Context } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import type { WorkerEnv } from "./env"
import { reasonFor } from "./status-codes"

const expectJson = (req: Request): boolean =>
  (req.headers.get("Accept") ?? "").includes("application/json")

export const resolveWait = (
  query: { sleep?: number },
  headers: { "x-httpstatus-sleep"?: number },
): number => Math.max(query.sleep ?? 0, headers["x-httpstatus-sleep"] ?? 0)

export const respondWithStatus = (
  c: Context<{ Bindings: WorkerEnv }>,
  code: number,
) => {
  const reason = reasonFor(code)
  return expectJson(c.req.raw)
    ? c.json({ code, description: reason }, code as ContentfulStatusCode)
    : c.text(`${code} ${reason}`, code as ContentfulStatusCode)
}
