export type StatusClass = "1xx" | "2xx" | "3xx" | "4xx" | "5xx"

export type StatusCode = Readonly<{
  code: number
  name: string
  shortName: string
  class: StatusClass
  popular?: boolean
  emoji?: string
}>

export const statusCodes: readonly StatusCode[] = [
  { code: 100, name: "Continue", shortName: "Continue", class: "1xx" },
  {
    code: 101,
    name: "Switching Protocols",
    shortName: "Switching",
    class: "1xx",
  },
  { code: 102, name: "Processing", shortName: "Processing", class: "1xx" },
  { code: 103, name: "Early Hints", shortName: "Early Hints", class: "1xx" },

  { code: 200, name: "OK", shortName: "OK", class: "2xx", popular: true },
  { code: 201, name: "Created", shortName: "Created", class: "2xx" },
  { code: 202, name: "Accepted", shortName: "Accepted", class: "2xx" },
  {
    code: 203,
    name: "Non-Authoritative Information",
    shortName: "Non-Auth",
    class: "2xx",
  },
  { code: 204, name: "No Content", shortName: "No Content", class: "2xx" },
  { code: 205, name: "Reset Content", shortName: "Reset", class: "2xx" },
  { code: 206, name: "Partial Content", shortName: "Partial", class: "2xx" },
  { code: 207, name: "Multi-Status", shortName: "Multi", class: "2xx" },
  { code: 208, name: "Already Reported", shortName: "Reported", class: "2xx" },
  { code: 226, name: "IM Used", shortName: "IM Used", class: "2xx" },

  { code: 300, name: "Multiple Choices", shortName: "Multiple", class: "3xx" },
  { code: 301, name: "Moved Permanently", shortName: "Moved", class: "3xx" },
  { code: 302, name: "Found", shortName: "Found", class: "3xx" },
  { code: 303, name: "See Other", shortName: "See Other", class: "3xx" },
  { code: 304, name: "Not Modified", shortName: "Not Modified", class: "3xx" },
  { code: 305, name: "Use Proxy", shortName: "Use Proxy", class: "3xx" },
  {
    code: 307,
    name: "Temporary Redirect",
    shortName: "Temp Redir",
    class: "3xx",
  },
  {
    code: 308,
    name: "Permanent Redirect",
    shortName: "Perm Redir",
    class: "3xx",
  },

  { code: 400, name: "Bad Request", shortName: "Bad Request", class: "4xx" },
  { code: 401, name: "Unauthorized", shortName: "Unauthorized", class: "4xx" },
  { code: 402, name: "Payment Required", shortName: "Payment", class: "4xx" },
  { code: 403, name: "Forbidden", shortName: "Forbidden", class: "4xx" },
  {
    code: 404,
    name: "Not Found",
    shortName: "Not Found",
    class: "4xx",
    popular: true,
  },
  { code: 405, name: "Method Not Allowed", shortName: "Method", class: "4xx" },
  { code: 406, name: "Not Acceptable", shortName: "Not Accept", class: "4xx" },
  {
    code: 407,
    name: "Proxy Authentication Required",
    shortName: "Proxy Auth",
    class: "4xx",
  },
  { code: 408, name: "Request Timeout", shortName: "Timeout", class: "4xx" },
  { code: 409, name: "Conflict", shortName: "Conflict", class: "4xx" },
  { code: 410, name: "Gone", shortName: "Gone", class: "4xx" },
  { code: 411, name: "Length Required", shortName: "Length", class: "4xx" },
  {
    code: 412,
    name: "Precondition Failed",
    shortName: "Precondition",
    class: "4xx",
  },
  {
    code: 413,
    name: "Payload Too Large",
    shortName: "Too Large",
    class: "4xx",
  },
  { code: 414, name: "URI Too Long", shortName: "URI Long", class: "4xx" },
  {
    code: 415,
    name: "Unsupported Media Type",
    shortName: "Media Type",
    class: "4xx",
  },
  {
    code: 416,
    name: "Range Not Satisfiable",
    shortName: "Range",
    class: "4xx",
  },
  {
    code: 417,
    name: "Expectation Failed",
    shortName: "Expectation",
    class: "4xx",
  },
  {
    code: 418,
    name: "I'm a Teapot",
    shortName: "Teapot",
    class: "4xx",
    emoji: "🫖",
  },
  {
    code: 421,
    name: "Misdirected Request",
    shortName: "Misdirected",
    class: "4xx",
  },
  {
    code: 422,
    name: "Unprocessable Content",
    shortName: "Unprocessable",
    class: "4xx",
  },
  { code: 423, name: "Locked", shortName: "Locked", class: "4xx" },
  {
    code: 424,
    name: "Failed Dependency",
    shortName: "Failed Dep",
    class: "4xx",
  },
  { code: 425, name: "Too Early", shortName: "Too Early", class: "4xx" },
  { code: 426, name: "Upgrade Required", shortName: "Upgrade", class: "4xx" },
  {
    code: 428,
    name: "Precondition Required",
    shortName: "Need Precon",
    class: "4xx",
  },
  { code: 429, name: "Too Many Requests", shortName: "Too Many", class: "4xx" },
  {
    code: 431,
    name: "Request Header Fields Too Large",
    shortName: "Hdr Large",
    class: "4xx",
  },
  {
    code: 451,
    name: "Unavailable For Legal Reasons",
    shortName: "Legal",
    class: "4xx",
  },
  { code: 444, name: "No Response", shortName: "No Resp", class: "4xx" },
  {
    code: 494,
    name: "Request Header Too Large",
    shortName: "Hdr Big",
    class: "4xx",
  },
  {
    code: 495,
    name: "SSL Certificate Error",
    shortName: "SSL Err",
    class: "4xx",
  },
  {
    code: 496,
    name: "SSL Certificate Required",
    shortName: "SSL Req",
    class: "4xx",
  },
  {
    code: 497,
    name: "HTTP Request Sent to HTTPS Port",
    shortName: "HTTP→HTTPS",
    class: "4xx",
  },
  {
    code: 499,
    name: "Client Closed Request",
    shortName: "Client Closed",
    class: "4xx",
  },

  {
    code: 500,
    name: "Internal Server Error",
    shortName: "Server Err",
    class: "5xx",
    popular: true,
  },
  { code: 501, name: "Not Implemented", shortName: "Not Impl", class: "5xx" },
  { code: 502, name: "Bad Gateway", shortName: "Bad Gateway", class: "5xx" },
  {
    code: 503,
    name: "Service Unavailable",
    shortName: "Unavailable",
    class: "5xx",
  },
  { code: 504, name: "Gateway Timeout", shortName: "Gateway TO", class: "5xx" },
  {
    code: 505,
    name: "HTTP Version Not Supported",
    shortName: "HTTP Ver",
    class: "5xx",
  },
  {
    code: 506,
    name: "Variant Also Negotiates",
    shortName: "Variant",
    class: "5xx",
  },
  {
    code: 507,
    name: "Insufficient Storage",
    shortName: "Storage",
    class: "5xx",
  },
  { code: 508, name: "Loop Detected", shortName: "Loop", class: "5xx" },
  { code: 510, name: "Not Extended", shortName: "Not Ext", class: "5xx" },
  {
    code: 511,
    name: "Network Authentication Required",
    shortName: "Net Auth",
    class: "5xx",
  },
  {
    code: 520,
    name: "Web Server Returned an Unknown Error",
    shortName: "Unknown Err",
    class: "5xx",
  },
  { code: 521, name: "Web Server Is Down", shortName: "Down", class: "5xx" },
  {
    code: 522,
    name: "Connection Timed Out",
    shortName: "Conn TO",
    class: "5xx",
  },
  {
    code: 523,
    name: "Origin Is Unreachable",
    shortName: "Unreachable",
    class: "5xx",
  },
  {
    code: 524,
    name: "A Timeout Occurred",
    shortName: "Timeout",
    class: "5xx",
  },
  {
    code: 525,
    name: "SSL Handshake Failed",
    shortName: "SSL Hand",
    class: "5xx",
  },
  {
    code: 526,
    name: "Invalid SSL Certificate",
    shortName: "Bad SSL",
    class: "5xx",
  },
]

export const classLabels: Record<StatusClass, string> = {
  "1xx": "Informational",
  "2xx": "Success",
  "3xx": "Redirection",
  "4xx": "Client Error",
  "5xx": "Server Error",
}

export const classOrder: readonly StatusClass[] = [
  "1xx",
  "2xx",
  "3xx",
  "4xx",
  "5xx",
]

export const codesByClass = (cls: StatusClass): readonly StatusCode[] =>
  statusCodes.filter((c) => c.class === cls)

export const codeByNumber = (n: number): StatusCode | undefined =>
  statusCodes.find((c) => c.code === n)

export const classOf = (code: number): StatusClass => {
  if (code < 200) return "1xx"
  if (code < 300) return "2xx"
  if (code < 400) return "3xx"
  if (code < 500) return "4xx"
  return "5xx"
}
