<div align="center">

# glowostat.us

[![License: MIT](https://img.shields.io/badge/license-MIT-10b981)](./LICENSE)
[![Status](https://img.shields.io/website?url=https%3A%2F%2Fglowostat.us&label=glowostat.us&up_color=10b981&up_message=up&down_color=ef4444&down_message=down)](https://status.glowostat.us)
[![GitHub stars](https://img.shields.io/github/stars/glowodev/glowostat.us?style=flat&color=10b981)](https://github.com/glowodev/glowostat.us/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/glowodev/glowostat.us?color=10b981)](https://github.com/glowodev/glowostat.us/commits/main)

<img src="./.github/banner.png" alt="glowostat.us" width="800"/>

A public dev utility for testing HTTP status codes. Point any client at a URL,
get back the status code you ask for. Free, open source, edge-served.

**Live:** [glowostat.us](https://glowostat.us) · **Status:** [status.glowostat.us](https://status.glowostat.us) · **Spec:** [OpenAPI 3.1](https://glowostat.us/openapi.json)

</div>

## Quick reference

```bash
curl -i https://glowostat.us/500
curl -i https://glowostat.us/random/200,500-504
curl -i 'https://glowostat.us/500?sleep=2000'
curl -i -H 'Accept: application/json' https://glowostat.us/404
curl -i https://glowostat.us/get                      # httpbin-style request echo
curl -i https://glowostat.us/delay/2                  # respond after 2s (max 10)
curl -iL https://glowostat.us/redirect/3              # 3-hop 302 chain → /get
curl -iu user:pass https://glowostat.us/basic-auth/user/pass
npx wscat -c wss://glowostat.us/ws                    # WebSocket echo (60s max)
```

## Stack

- **Cloudflare Workers** runtime (`workerd`) — global edge, no cold starts
- **Hono** for the API
- **Astro 6 + Tailwind v4** for the landing page (static, served via Workers Static Assets)
- **TypeScript** strict
- **pnpm** for the dev toolchain
- **Wrangler** for local dev + deploy

## Develop

```bash
pnpm install
pnpm run dev          # wrangler dev — Worker + landing on http://127.0.0.1:8787
pnpm run dev:landing  # Astro dev only — fast hot reload at http://127.0.0.1:4321
pnpm run build        # build landing → landing/dist
pnpm run test         # vitest in workers pool
pnpm run lint         # oxlint
pnpm run deploy       # wrangler deploy (CI / authorized only)
```

## Privacy

The Worker itself doesn't log, store, or analyze your requests — Workers
observability is disabled in [`wrangler.jsonc`](./wrangler.jsonc), no
app-level analytics, no error telemetry tied to request content.

Cloudflare's edge platform aggregates request metadata (IP, path, status,
latency) for analytics, DDoS protection, and WAF. That's platform-level
for any service hosted on Cloudflare Workers and is governed by
[Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/) —
we can't opt out of it on your behalf.

The deployed code matches the commit shown in the landing footer.

## Credits

Inspired by [httpstat.us](https://httpstat.us) by Aaron Powell and Tatham
Oddie. The request-echo endpoints (`/get`, `/delay`, `/redirect`,
`/basic-auth`) follow the API shape of
[httpbin](https://github.com/postmanlabs/httpbin) by Kenneth Reitz.

## License

MIT — see [LICENSE](./LICENSE).
