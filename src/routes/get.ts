import { createRoute } from "@hono/zod-openapi"
import { requestEchoSchema } from "../lib/schemas"
import { baseRequest } from "./shared"

export const getRoute = createRoute({
  method: "get",
  path: "/get",
  summary: "Echo the request (args, headers, origin, url) as JSON",
  request: baseRequest,
  responses: {
    200: {
      description:
        "httpbin-style request echo. Always application/json; `url` always carries the full https URL.",
      content: { "application/json": { schema: requestEchoSchema } },
    },
  },
})
