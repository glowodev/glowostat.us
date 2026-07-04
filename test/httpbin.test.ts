import { SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import type { RequestEcho } from "../src/lib/response"

describe("GET /get", () => {
  it("returns a JSON echo with args, headers, origin, url", async () => {
    const res = await SELF.fetch("https://t.local/get?foo=bar")
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toMatch(/application\/json/)
    const body = (await res.json()) as RequestEcho
    expect(body.args).toEqual({ foo: "bar" })
    expect(body.url).toBe("https://t.local/get?foo=bar")
    expect(typeof body.headers).toBe("object")
    expect(typeof body.origin).toBe("string")
  })

  it("echoes the full https URL in the body (regex-assertable)", async () => {
    const res = await SELF.fetch("https://t.local/get")
    const text = await res.text()
    expect(text).toContain('"url"')
    expect(text).toMatch(/https:\/\/[a-z0-9.-]+/)
  })

  it("collects repeated query params into an array", async () => {
    const res = await SELF.fetch("https://t.local/get?a=1&a=2&b=3")
    const body = (await res.json()) as RequestEcho
    expect(body.args).toEqual({ a: ["1", "2"], b: "3" })
  })

  it("canonicalizes echoed header names", async () => {
    const res = await SELF.fetch("https://t.local/get", {
      headers: { "x-custom-probe": "42" },
    })
    const body = (await res.json()) as RequestEcho
    expect(body.headers["X-Custom-Probe"]).toBe("42")
  })

  it("echoes __proto__ as an own JSON field instead of dropping it", async () => {
    const res = await SELF.fetch("https://t.local/get?__proto__=x")
    const text = await res.text()
    expect(text).toContain('"__proto__":"x"')
  })

  it("sends X-Content-Type-Options: nosniff", async () => {
    const res = await SELF.fetch("https://t.local/get")
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff")
  })

  it("honors ?sleep=", async () => {
    const start = Date.now()
    const res = await SELF.fetch("https://t.local/get?sleep=200")
    expect(res.status).toBe(200)
    expect(Date.now() - start).toBeGreaterThanOrEqual(180)
  })
})

describe("GET /delay/:seconds", () => {
  it("delays the echo by the given seconds", async () => {
    const start = Date.now()
    const res = await SELF.fetch("https://t.local/delay/1")
    const elapsed = Date.now() - start
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toMatch(/application\/json/)
    expect(elapsed).toBeGreaterThanOrEqual(950)
  }, 10000)

  it("responds immediately for /delay/0", async () => {
    const res = await SELF.fetch("https://t.local/delay/0")
    expect(res.status).toBe(200)
  })

  it("rejects delays above the 10s cap", async () => {
    const res = await SELF.fetch("https://t.local/delay/11")
    expect(res.status).toBe(400)
  })

  it("uses the longer of path delay and ?sleep=", async () => {
    const start = Date.now()
    const res = await SELF.fetch("https://t.local/delay/0?sleep=300")
    expect(res.status).toBe(200)
    expect(Date.now() - start).toBeGreaterThanOrEqual(280)
  })
})

describe("GET /redirect/:hops", () => {
  it("counts down through relative redirects", async () => {
    const res = await SELF.fetch("https://t.local/redirect/3", {
      redirect: "manual",
    })
    expect(res.status).toBe(302)
    expect(res.headers.get("Location")).toBe("/redirect/2")
  })

  it("points the final hop at /get", async () => {
    const res = await SELF.fetch("https://t.local/redirect/1", {
      redirect: "manual",
    })
    expect(res.status).toBe(302)
    expect(res.headers.get("Location")).toBe("/get")
  })

  it("walks the whole chain to a 200", async () => {
    let url = "https://t.local/redirect/3"
    let res = await SELF.fetch(url, { redirect: "manual" })
    let hops = 0
    while (res.status === 302 && hops < 10) {
      url = new URL(res.headers.get("Location") ?? "", url).toString()
      res = await SELF.fetch(url, { redirect: "manual" })
      hops++
    }
    expect(hops).toBe(3)
    expect(res.status).toBe(200)
    expect(url).toBe("https://t.local/get")
  })

  it("rejects hop counts above the cap", async () => {
    const res = await SELF.fetch("https://t.local/redirect/11", {
      redirect: "manual",
    })
    expect(res.status).toBe(400)
  })

  it("rejects zero hops", async () => {
    const res = await SELF.fetch("https://t.local/redirect/0", {
      redirect: "manual",
    })
    expect(res.status).toBe(400)
  })
})

describe("GET /basic-auth/:user/:passwd", () => {
  const authHeader = (user: string, passwd: string): string =>
    `Basic ${btoa(`${user}:${passwd}`)}`

  it("challenges with 401 + WWW-Authenticate when no credentials", async () => {
    const res = await SELF.fetch("https://t.local/basic-auth/user/pass")
    expect(res.status).toBe(401)
    expect(res.headers.get("WWW-Authenticate")).toMatch(/^Basic realm=/)
    expect(await res.text()).toBe("")
  })

  it("returns 200 with the authenticated user on match", async () => {
    const res = await SELF.fetch("https://t.local/basic-auth/user/pass", {
      headers: { Authorization: authHeader("user", "pass") },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ authenticated: true, user: "user" })
  })

  it("rejects wrong credentials with 401", async () => {
    const res = await SELF.fetch("https://t.local/basic-auth/user/pass", {
      headers: { Authorization: authHeader("user", "wrong") },
    })
    expect(res.status).toBe(401)
  })

  it("rejects malformed base64 without crashing", async () => {
    const res = await SELF.fetch("https://t.local/basic-auth/user/pass", {
      headers: { Authorization: "Basic not-base64!!!" },
    })
    expect(res.status).toBe(401)
  })

  it("accepts a lowercase basic scheme (RFC 7235 case-insensitive)", async () => {
    const res = await SELF.fetch("https://t.local/basic-auth/user/pass", {
      headers: { Authorization: `basic ${btoa("user:pass")}` },
    })
    expect(res.status).toBe(200)
  })

  it("matches UTF-8 credentials against UTF-8 path params", async () => {
    const bytes = new TextEncoder().encode("usér:päss")
    const encoded = btoa(String.fromCharCode(...bytes))
    const res = await SELF.fetch(
      `https://t.local/basic-auth/${encodeURIComponent("usér")}/${encodeURIComponent("päss")}`,
      { headers: { Authorization: `Basic ${encoded}` } },
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ authenticated: true, user: "usér" })
  })

  it("advertises the UTF-8 charset in the challenge", async () => {
    const res = await SELF.fetch("https://t.local/basic-auth/user/pass")
    expect(res.headers.get("WWW-Authenticate")).toBe(
      'Basic realm="glowostat.us", charset="UTF-8"',
    )
  })
})
