import { createRoute, z } from "@hono/zod-openapi"
import { randomSpec } from "../lib/schemas"
import { baseRequest, dynamicStatusResponse } from "./shared"

export const randomRoute = createRoute({
  method: "get",
  path: "/random/:codes",
  summary: "Return a random code from the given spec",
  request: { ...baseRequest, params: z.object({ codes: randomSpec }) },
  responses: dynamicStatusResponse(
    "A random code from the expanded spec. Format negotiated via Accept.",
  ),
})
