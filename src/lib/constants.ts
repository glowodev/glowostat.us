export const HTTP_MIN_STATUS = 200
export const HTTP_MAX_STATUS = 599

export const NULL_BODY_STATUSES: ReadonlySet<number> = new Set([204, 205, 304])

// 65s, not 60: lets clients validate "my 60s timeout fires before the server
// replies" without racing the response. Lowered from 5min (abuse surface).
export const MAX_SLEEP_MS = 65 * 1000
export const MIN_SLEEP_MS = 0
export const MAX_EXPANDED = 10_000

export const MAX_DELAY_SECONDS = 10
export const MAX_REDIRECT_HOPS = 10
export const BASIC_AUTH_REALM = "glowostat.us"
export const MAX_CREDENTIAL_LENGTH = 128

export const WS_MAX_LIFETIME_MS = 60 * 1000
export const WS_MAX_MESSAGE_BYTES = 64 * 1024
export const WS_MAX_MESSAGES = 100
export const WS_MAX_TOTAL_BYTES = 1024 * 1024

export const CORS_MAX_AGE_SECONDS = 24 * 60 * 60
