import { STATUS_CODES } from "node:http"

const nonIana: Readonly<Record<number, string>> = {
  444: "No Response",
  494: "Request Header Too Large",
  495: "SSL Certificate Error",
  496: "SSL Certificate Required",
  497: "HTTP Request Sent to HTTPS Port",
  499: "Client Closed Request",
  520: "Web Server Returned an Unknown Error",
  521: "Web Server Is Down",
  522: "Connection Timed Out",
  523: "Origin Is Unreachable",
  524: "A Timeout Occurred",
  525: "SSL Handshake Failed",
  526: "Invalid SSL Certificate",
}

export const reasonFor = (code: number): string =>
  nonIana[code] ?? STATUS_CODES[code] ?? "Unknown Status Code"
