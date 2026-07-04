import { createRoute, z } from "@hono/zod-openapi"
import { delaySecondsParam, requestEchoSchema } from "../lib/schemas"
import { baseRequest } from "./shared"

export const delayRoute = createRoute({
  method: "get",
  path: "/delay/:seconds{[0-9]+}",
  summary: "Respond after the given delay in seconds (max 10)",
  request: { ...baseRequest, params: z.object({ seconds: delaySecondsParam }) },
  responses: {
    200: {
      description:
        "httpbin-style request echo, sent after the delay. If `?sleep=` (ms) is also given, the longer wait wins.",
      content: { "application/json": { schema: requestEchoSchema } },
    },
  },
})
