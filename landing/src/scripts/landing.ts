import {
  classOf,
  codeByNumber,
  statusCodes,
  type StatusClass,
} from "../data/status-codes"
import {
  highlightSnippet,
  renderSnippet,
  snippetLabels,
  snippetLangs,
  type SnippetLang,
} from "../lib/snippets"

const SNIPPET_PREF_KEY = "glowostat:snippet-lang:v1"

// Single source of truth for current selection.
type Selection = {
  code: number
  name: string
  cls: StatusClass
}

let selection: Selection = {
  code: 500,
  name: "Internal Server Error",
  cls: "5xx",
}
let currentLang: SnippetLang = "curl"

const onReady = (fn: () => void) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true })
  } else {
    fn()
  }
}

const showToast = (text: string) => {
  const toast = document.getElementById("toast")
  const textEl = document.getElementById("toast-text")
  if (!toast || !textEl) return
  textEl.textContent = text
  toast.dataset.state = "visible"
  const tracked = toast as HTMLElement & { _t?: ReturnType<typeof setTimeout> }
  globalThis.clearTimeout(tracked._t)
  tracked._t = globalThis.setTimeout(() => {
    toast.dataset.state = "hidden"
  }, 2000)
}

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

const truncate = (s: string, n: number): string =>
  s.length > n ? s.slice(0, n - 1) + "…" : s

// ============== Copy delegation ==============
const initCopy = () => {
  document.addEventListener("click", (e) => {
    // Let modifier-clicks on real links pass through (open in new tab, etc.).
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return
    }
    const target = e.target as Element
    const trigger = target.closest<HTMLElement>("[data-copy]")
    if (!trigger) return
    e.preventDefault()
    const text = trigger.dataset.copy
    if (!text) return
    void copyToClipboard(text).then((ok) => {
      if (ok) showToast(`Copied: ${truncate(text, 48)}`)
    })
  })
}

// ============== Mini-playground ==============
const renderPlayground = () => {
  const url = `https://glowostat.us/${selection.code}`
  const colorVar = `var(--color-class-${selection.cls})`

  const pg = document.getElementById("mini-playground")
  if (pg) pg.dataset.selected = String(selection.code)

  const dot = document.getElementById("mp-dot")
  if (dot) dot.style.background = colorVar

  const labelEl = document.getElementById("mp-label")
  if (labelEl) {
    labelEl.replaceChildren()
    const codeSpan = document.createElement("span")
    codeSpan.id = "mp-code"
    codeSpan.className = "text-foreground"
    codeSpan.textContent = String(selection.code)
    labelEl.append(codeSpan, ` ${selection.name}`)
  }

  const urlCode = document.getElementById("mp-url-code")
  if (urlCode) {
    urlCode.textContent = String(selection.code)
    urlCode.style.color = colorVar
  }

  // Primary copy button: label + content follow snippet preference
  const copyBtn = document.getElementById("mp-copy") as HTMLButtonElement | null
  if (copyBtn) {
    const snippet = renderSnippet(currentLang, url)
    copyBtn.dataset.copy = snippet
    const labelSpan = copyBtn.querySelector<HTMLSpanElement>(
      "[data-mp-copy-label]",
    )
    if (labelSpan) labelSpan.textContent = `Copy ${snippetLabels[currentLang]}`
  }

  const openBtn = document.getElementById("mp-open") as HTMLAnchorElement | null
  if (openBtn) openBtn.href = url
}

// ============== Snippet block ==============
const renderSnippetBlock = () => {
  const block = document.getElementById("snippet-block")
  if (!block) return

  const url = `https://glowostat.us/${selection.code}`
  block.dataset.url = url
  block.dataset.lang = currentLang

  const text = renderSnippet(currentLang, url)
  const html = highlightSnippet(text, selection.code, selection.cls)

  const codeEl = document.getElementById("snippet-code")
  if (codeEl) codeEl.innerHTML = html

  const copyEl = document.getElementById("snippet-copy")
  if (copyEl) copyEl.dataset.copy = text

  // Tab visuals
  const tabs = document.querySelectorAll<HTMLButtonElement>("[data-lang-tab]")
  tabs.forEach((tab) => {
    const active = tab.dataset.langTab === currentLang
    tab.setAttribute("aria-pressed", active ? "true" : "false")
    tab.classList.toggle("text-foreground", active)
    tab.classList.toggle("text-muted", !active)

    const existingInd = tab.querySelector<HTMLSpanElement>(
      "span[data-tab-indicator]",
    )
    if (active && !existingInd) {
      const span = document.createElement("span")
      span.dataset.tabIndicator = "true"
      span.className = "absolute inset-x-2 -bottom-px h-0.5 bg-emerald"
      span.setAttribute("aria-hidden", "true")
      tab.appendChild(span)
    } else if (!active && existingInd) {
      existingInd.remove()
    }
  })
}

// ============== Public state setters ==============
const select = (next: Selection) => {
  selection = next
  renderPlayground()
  renderSnippetBlock()
}

const selectLang = (lang: SnippetLang, persist: boolean) => {
  currentLang = lang
  renderPlayground()
  renderSnippetBlock()
  if (persist) {
    try {
      localStorage.setItem(SNIPPET_PREF_KEY, lang)
    } catch {
      // storage unavailable — ignore
    }
  }
}

// ============== Wiring ==============
const isPlaygroundVisible = (): boolean => {
  const pg = document.getElementById("mini-playground")
  if (!pg) return false
  return getComputedStyle(pg).display !== "none"
}

const initTiles = () => {
  document.addEventListener("click", (e) => {
    // Modifier/middle clicks open the deep page in a new tab — let them through.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    const target = e.target as Element
    if (target.closest("[data-copy]")) return
    const tile = target.closest<HTMLElement>("[data-tile]")
    if (!tile) return
    e.preventDefault()
    const code = Number(tile.dataset.tile)
    const name = tile.dataset.name || ""
    const cls = (tile.dataset.class || classOf(code)) as StatusClass

    // Mobile (no playground visible): tap = copy curl + toast.
    if (!isPlaygroundVisible()) {
      const text = `curl -i https://glowostat.us/${code}`
      void copyToClipboard(text).then((ok) => {
        if (ok) showToast(`Copied: ${truncate(text, 48)}`)
      })
      return
    }

    select({ code, name, cls })
  })
}

const initTabs = () => {
  document.addEventListener("click", (e) => {
    const target = e.target as Element
    const tab = target.closest<HTMLElement>("[data-lang-tab]")
    if (!tab) return
    const lang = tab.dataset.langTab as SnippetLang
    selectLang(lang, true)
  })
}

const restoreSnippetPref = () => {
  let stored: string | null = null
  try {
    stored = localStorage.getItem(SNIPPET_PREF_KEY)
  } catch {
    return
  }
  if (!stored) return
  if ((snippetLangs as readonly string[]).includes(stored)) {
    selectLang(stored as SnippetLang, false)
  }
}

const sanity = () => {
  const total = statusCodes.length
  const found = codeByNumber(418)
  if (!found?.emoji) {
    console.warn("[glowostat] teapot escaped the table")
  }
  if (total < 60) {
    console.warn("[glowostat] expected 60+ codes, got", total)
  }
}

onReady(() => {
  initCopy()
  initTiles()
  initTabs()
  restoreSnippetPref()
  // Initial render once handlers are wired (covers the no-pref path)
  renderPlayground()
  renderSnippetBlock()
  sanity()
})
