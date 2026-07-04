import { createRoute, z } from "@hono/zod-openapi"
import { redirectHopsParam } from "../lib/schemas"
import { baseRequest } from "./shared"

export const redirectRoute = createRoute({
  method: "get",
  path: "/redirect/:hops{[0-9]+}",
  summary: "302-redirect n times (max 10), ending at /get",
  request: { ...baseRequest, params: z.object({ hops: redirectHopsParam }) },
  responses: {
    302: {
      description:
        "Relative Location to /redirect/{hops-1}, or /get when one hop remains.",
      headers: z.object({
        Location: z.string().openapi({ example: "/redirect/2" }),
      }),
    },
  },
})
