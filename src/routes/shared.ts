import { z } from "@hono/zod-openapi"
import { sleepHeaders, sleepQuery, statusBodySchema } from "../lib/schemas"

export const baseRequest = {
  query: z.object({ sleep: sleepQuery }),
  headers: sleepHeaders,
}

export const dynamicStatusResponse = (description: string) => ({
  default: {
    description,
    content: {
      "text/plain": { schema: z.string() },
      "application/json": { schema: statusBodySchema },
    },
  },
})
