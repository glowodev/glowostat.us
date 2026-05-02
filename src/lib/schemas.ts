import { z } from "@hono/zod-openapi"
import {
  HTTP_MAX_STATUS,
  HTTP_MIN_STATUS,
  MAX_EXPANDED,
  MAX_SLEEP_MS,
  MIN_SLEEP_MS,
} from "./constants"

const sleepBound = z.coerce
  .number()
  .int()
  .min(MIN_SLEEP_MS)
  .max(MAX_SLEEP_MS)
  .optional()

export const statusCodeParam = z.coerce
  .number()
  .int()
  .min(HTTP_MIN_STATUS)
  .max(HTTP_MAX_STATUS)
  .openapi({ param: { name: "code", in: "path" }, example: 500 })

export const sleepQuery = sleepBound.openapi({
  param: { name: "sleep", in: "query" },
  example: 2000,
})

export const sleepHeaders = z.object({
  "x-httpstatus-sleep": sleepBound,
})

export const randomSpec = z
  .string()
  .regex(
    /^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/,
    "expected comma-separated codes/ranges, e.g. 200,201,500-504",
  )
  .transform((spec, ctx) => {
    const codes: number[] = []
    for (const seg of spec.split(",")) {
      const [from, to = from] = seg.split("-").map(Number) as [number, number]
      if (from < HTTP_MIN_STATUS || to > HTTP_MAX_STATUS || from > to) {
        ctx.addIssue({ code: "custom", message: `bad segment "${seg}"` })
        return z.NEVER
      }
      for (let code = from; code <= to; code++) codes.push(code)
      if (codes.length > MAX_EXPANDED) {
        ctx.addIssue({ code: "custom", message: "spec expands too far" })
        return z.NEVER
      }
    }
    return codes
  })
  .openapi({ param: { name: "codes", in: "path" }, example: "200,201,500-504" })

export const statusBodySchema = z
  .object({
    code: z.number().int().openapi({ example: 500 }),
    description: z.string().openapi({ example: "Internal Server Error" }),
  })
  .openapi("StatusBody")
