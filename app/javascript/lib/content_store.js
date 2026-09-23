// Client-side "database" for the demo CMS.
//
// Default copy is rendered by Rails from db/content.json and embedded in every
// page as <script id="default-content">. Admin edits are saved to this
// browser's localStorage and deep-merged over the defaults, so each visitor
// only ever changes their own view of the site.

const CONTENT_KEY = "rakit.content.v1"
const META_KEY = "rakit.content-meta.v1"
const LEADS_KEY = "rakit.leads.v1"
export const ADMIN_KEY = "rakit.admin"
export { CONTENT_KEY, LEADS_KEY }

let defaults
let active

function read(storage, key, fallback) {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export const clone = (value) => JSON.parse(JSON.stringify(value))

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value)

// Objects merge key by key; arrays and scalars from `override` replace the default.
export function deepMerge(base, override) {
  if (!isObject(base) || !isObject(override)) return override === undefined ? base : override
  const out = { ...base }
  for (const [key, value] of Object.entries(override)) out[key] = deepMerge(base[key], value)
  return out
}

export function get(object, path) {
  if (path === ".") return object
  return path.split(".").reduce((node, key) => (node == null ? undefined : node[key]), object)
}

export function defaultContent() {
  if (!defaults) {
    const el = document.getElementById("default-content")
    defaults = el ? JSON.parse(el.textContent) : {}
  }
  return clone(defaults)
}

export function hasCustomContent() {
  return read(localStorage, CONTENT_KEY, null) !== null
}

export function currentContent() {
  return deepMerge(defaultContent(), read(localStorage, CONTENT_KEY, {}))
}

export function saveContent(content) {
  const ok = write(localStorage, CONTENT_KEY, content)
  if (ok) write(localStorage, META_KEY, { savedAt: new Date().toISOString() })
  return ok
}

export function resetContent() {
  try {
    localStorage.removeItem(CONTENT_KEY)
    localStorage.removeItem(META_KEY)
  } catch {}
}

export function contentMeta() {
  return read(localStorage, META_KEY, {})
}

// The content most recently painted on this page (saved edits or a live preview).
export function activeContent() {
  return active || currentContent()
}

export function setActiveContent(content) {
  active = content
}

// Leads captured by the landing-page contact form.
export function getLeads() {
  return read(localStorage, LEADS_KEY, [])
}

export function addLead(lead) {
  const leads = getLeads()
  const record = { id: crypto.randomUUID?.() || String(Date.now()), status: "new", createdAt: new Date().toISOString(), ...lead }
  leads.unshift(record)
  write(localStorage, LEADS_KEY, leads)
  return record
}

export function updateLead(id, changes) {
  write(localStorage, LEADS_KEY, getLeads().map((lead) => (lead.id === id ? { ...lead, ...changes } : lead)))
}

export function deleteLead(id) {
  write(localStorage, LEADS_KEY, getLeads().filter((lead) => lead.id !== id))
}

export function isAdmin() {
  return read(sessionStorage, ADMIN_KEY, false) === true
}

export function setAdmin(value) {
  if (value) write(sessionStorage, ADMIN_KEY, true)
  else sessionStorage.removeItem(ADMIN_KEY)
}

// "Dimas Pratama" → "DP"; "Andika Rahman · Founder rakit." → "AR"
export function initials(name) {
  return String(name ?? "").split("·")[0].trim().split(/\s+/).slice(0, 2).map((word) => word[0] || "").join("").toUpperCase()
}

export function whatsappUrl(content, text) {
  const url = `https://wa.me/${content.contact.whatsapp}`
  return text ? `${url}?text=${encodeURIComponent(text)}` : url
}
