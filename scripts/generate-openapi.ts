import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { OpenAPIHono } from "@hono/zod-openapi"
import {
  HTTP_MAX_STATUS,
  HTTP_MIN_STATUS,
  NULL_BODY_STATUSES,
} from "../src/lib/constants"
import { reasonFor } from "../src/lib/status-codes"
import { basicAuthRoute } from "../src/routes/basic-auth"
import { delayRoute } from "../src/routes/delay"
import { getRoute } from "../src/routes/get"
import { randomRoute } from "../src/routes/random"
import { redirectRoute } from "../src/routes/redirect"
import { statusRoute } from "../src/routes/status"

const app = new OpenAPIHono()
app.openapi(statusRoute, async () => new Response())
app.openapi(randomRoute, async () => new Response())
app.openapi(getRoute, async () => new Response())
app.openapi(delayRoute, async () => new Response())
app.openapi(redirectRoute, async () => new Response())
app.openapi(basicAuthRoute, async () => new Response())

const doc = app.getOpenAPIDocument({
  openapi: "3.1.0",
  info: {
    title: "glowostat.us",
    version: "1.0.0",
    description:
      "Public dev utility for testing HTTP status codes. Point any client at a URL, get back the status code you ask for. Free, edge-served, open source.\n\nDeployed on Cloudflare Workers; the Fetch API forbids final responses with status < 200, so this service only supports codes 200–599.",
    license: {
      name: "MIT",
      url: "https://github.com/glowodev/glowostat.us/blob/main/LICENSE",
    },
  },
  servers: [{ url: "https://glowostat.us", description: "Production" }],
})

const cleanedPaths: typeof doc.paths = {}
for (const [path, ops] of Object.entries(doc.paths)) {
  cleanedPaths[path.replaceAll(/\/:(\w+)(\{[^}]*\})?/g, "/{$1}")] = ops
}
doc.paths = cleanedPaths

type ResponseShape = {
  description: string
  content?: Record<string, unknown>
}

const bodyContent = {
  "text/plain": { schema: { type: "string" } },
  "application/json": { schema: { $ref: "#/components/schemas/StatusBody" } },
} as const

const bad400Content = {
  "text/plain": { schema: { type: "string" } },
  "application/json": {
    schema: {
      oneOf: [
        { $ref: "#/components/schemas/StatusBody" },
        { $ref: "#/components/schemas/ValidationError" },
      ],
    },
  },
} as const

type OpKind = "status" | "random"

const triggerClause = (kind: OpKind, code: number): string =>
  kind === "status"
    ? `the caller requests \`/${code}\``
    : `\`/random/{codes}\` selects ${code}`

const badRequestDescription = (kind: OpKind): string =>
  kind === "status"
    ? "400 Bad Request. Returned either when the caller requests `/400` (body: StatusBody) or when the validation layer rejects the request — e.g. a path code below 200, `?sleep=` out of range, or a non-numeric `x-httpstatus-sleep` (body: ValidationError)."
    : "400 Bad Request. Returned either when `/random/{codes}` selects 400 (body: StatusBody) or when the path/query validation fails — malformed spec, codes outside 200–599, or `?sleep=` out of bounds (body: ValidationError)."

const buildResponses = (kind: OpKind): Record<string, ResponseShape> => {
  const responses: Record<string, ResponseShape> = {}
  for (let code = HTTP_MIN_STATUS; code <= HTTP_MAX_STATUS; code++) {
    const reason = reasonFor(code)
    if (reason === "Unknown Status Code") continue

    if (code === 400) {
      responses[code] = {
        description: badRequestDescription(kind),
        content: bad400Content,
      }
      continue
    }

    const trigger = triggerClause(kind, code)
    if (NULL_BODY_STATUSES.has(code)) {
      responses[code] = {
        description: `${code} ${reason}. Returned when ${trigger}. Per the Fetch spec, this status carries no body.`,
      }
      continue
    }

    responses[code] = {
      description: `${code} ${reason}. Returned when ${trigger}.`,
      content: bodyContent,
    }
  }
  return responses
}

doc.components = {
  ...doc.components,
  schemas: {
    ...doc.components?.schemas,
    ValidationError: {
      type: "object",
      description:
        "Returned by the validation layer when a request fails Zod parsing. The `error.message` field is a JSON-encoded string holding the array of Zod issues — parse it to inspect per-issue `code`, `path`, and `message`.",
      properties: {
        success: { type: "boolean", const: false },
        error: {
          type: "object",
          properties: {
            name: { type: "string", const: "ZodError" },
            message: {
              type: "string",
              description:
                "JSON-encoded string of Zod issues. Example after JSON.parse: `[{ code: 'too_big', path: ['sleep'], message: 'Too big: expected number to be <=65000', ... }]`.",
            },
          },
          required: ["name", "message"],
        },
      },
      required: ["success", "error"],
    },
  },
}

const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const

// Only the two dynamic-status routes fan out to every 200–599 response;
// the httpbin-style routes keep the responses they declare themselves.
const dynamicStatusPaths: Readonly<Record<string, OpKind>> = {
  "/{code}": "status",
  "/random/{codes}": "random",
}

for (const [path, pathItem] of Object.entries(doc.paths)) {
  if (!pathItem || typeof pathItem !== "object") continue
  const opKind = dynamicStatusPaths[path]
  if (!opKind) continue
  const responses = buildResponses(opKind)
  for (const method of HTTP_METHODS) {
    const op = (pathItem as Record<string, unknown>)[method]
    if (!op || typeof op !== "object" || !("responses" in op)) continue
    const existing = op as { responses: { default?: unknown } }
    existing.responses = {
      ...responses,
      ...(existing.responses.default
        ? { default: existing.responses.default }
        : {}),
    }
  }
}

const outDir = resolve("landing/public")
const outPath = resolve(outDir, "openapi.json")
await mkdir(outDir, { recursive: true })
await writeFile(outPath, JSON.stringify(doc, null, 2))
console.log(`generated ${outPath}`)
