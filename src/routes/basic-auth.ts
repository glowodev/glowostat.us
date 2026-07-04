import { createRoute } from "@hono/zod-openapi"
import { basicAuthBodySchema, basicAuthParams } from "../lib/schemas"
import { baseRequest } from "./shared"

export const basicAuthRoute = createRoute({
  method: "get",
  path: "/basic-auth/:user/:passwd",
  summary: "Challenge HTTP Basic Auth against the credentials in the path",
  request: { ...baseRequest, params: basicAuthParams },
  responses: {
    200: {
      description: "Credentials matched.",
      content: { "application/json": { schema: basicAuthBodySchema } },
    },
    401: {
      description:
        "Missing or wrong credentials. Carries a WWW-Authenticate: Basic challenge, no body.",
    },
  },
})
