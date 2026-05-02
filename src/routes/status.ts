import { createRoute, z } from "@hono/zod-openapi"
import { statusCodeParam } from "../lib/schemas"
import { baseRequest, dynamicStatusResponse } from "./shared"

export const statusRoute = createRoute({
  method: "get",
  path: "/:code{[1-5][0-9][0-9]}",
  summary: "Return a response with the given HTTP status code",
  request: { ...baseRequest, params: z.object({ code: statusCodeParam }) },
  responses: dynamicStatusResponse(
    "The requested HTTP status. Format negotiated via Accept.",
  ),
})
