import { SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import doc from "../landing/public/openapi.json"

describe("openapi.json (generated at build)", () => {
  it("is a valid OpenAPI 3.1 document", () => {
    expect(doc.openapi).toBe("3.1.0")
    expect(doc.info.title).toBe("glowostat.us")
  })

  it("describes both routes with OpenAPI-standard path syntax", () => {
    expect(Object.keys(doc.paths).sort()).toEqual([
      "/random/{codes}",
      "/{code}",
    ])
  })

  it("exposes the StatusBody schema in components", () => {
    expect(doc.components?.schemas?.StatusBody).toBeDefined()
  })
})

describe("CORS", () => {
  it("answers preflight with permissive headers", async () => {
    const res = await SELF.fetch("https://t.local/200", {
      method: "OPTIONS",
      headers: {
        Origin: "https://example.test",
        "Access-Control-Request-Method": "GET",
      },
    })
    expect(res.status).toBe(204)
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*")
  })
})
