import { Controller } from "@hotwired/stimulus"
import { CONTENT_KEY, currentContent, get, hasCustomContent, initials, setActiveContent, whatsappUrl } from "lib/content_store"

// Paints saved CMS edits (or a live preview from the admin) over the
// server-rendered defaults. Text is only ever set via textContent, so stored
// values can't inject markup.
export default class extends Controller {
  connect() {
    this.onStorage = (event) => { if (event.key === CONTENT_KEY) this.apply(currentContent()) }
    this.onMessage = (event) => {
      if (event.origin !== location.origin) return
      if (event.data?.type === "rakit:preview") this.apply(event.data.content)
      if (event.data?.type === "rakit:scroll") document.querySelector(event.data.anchor)?.scrollIntoView({ behavior: "smooth" })
    }
    window.addEventListener("storage", this.onStorage)
    window.addEventListener("message", this.onMessage)

    if (hasCustomContent()) this.apply(currentContent())
    if (window.parent !== window) window.parent.postMessage({ type: "rakit:preview-ready" }, location.origin)
  }

  disconnect() {
    window.removeEventListener("storage", this.onStorage)
    window.removeEventListener("message", this.onMessage)
  }

  apply(content) {
    setActiveContent(content)

    this.element.querySelectorAll("[data-cms]").forEach((el) => {
      el.textContent = String(get(content, el.dataset.cms) ?? "")
    })
    this.element.querySelectorAll("[data-cms-initials]").forEach((el) => {
      el.textContent = initials(get(content, el.dataset.cmsInitials))
    })
    this.element.querySelectorAll("[data-cms-list]").forEach((list) => {
      this.renderList(list, get(content, list.dataset.cmsList) || [])
    })
    this.element.querySelectorAll("[data-wa-link]").forEach((a) => { a.href = whatsappUrl(content) })
    this.element.querySelectorAll("[data-mail-link]").forEach((a) => { a.href = `mailto:${content.contact.email}` })

    document.title = content.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute("content", content.meta.description)

    window.dispatchEvent(new CustomEvent("cms:rendered", { detail: content }))
  }

  renderList(list, items) {
    const template = list.querySelector(":scope > template")
    if (!template) return
    ;[...list.children].forEach((child) => { if (child !== template) child.remove() })
    items.forEach((item) => {
      const fragment = template.content.cloneNode(true)
      fragment.querySelectorAll("[data-cms-field]").forEach((el) => {
        el.textContent = String(get(item, el.dataset.cmsField) ?? "")
      })
      fragment.querySelectorAll("[data-cms-src]").forEach((img) => {
        const src = get(item, img.dataset.cmsSrc)
        if (src) img.setAttribute("src", src)
        else img.removeAttribute("src")
        img.alt = img.dataset.cmsAlt ? String(get(item, img.dataset.cmsAlt) ?? "") : ""
      })
      fragment.querySelectorAll("[data-cms-field-initials]").forEach((el) => {
        el.textContent = initials(get(item, el.dataset.cmsFieldInitials))
      })
      fragment.querySelectorAll("[data-cms-height]").forEach((el) => {
        el.style.height = `${Math.max(0, Math.min(100, Number(get(item, el.dataset.cmsHeight)) || 0))}%`
      })
      list.append(fragment)
    })
  }
}
