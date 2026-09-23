import { Controller } from "@hotwired/stimulus"
import { activeContent } from "lib/content_store"

// Growth-framework tabs. Tab buttons come from the CMS list; the panel is
// filled from the active content so edits and live previews show up here too.
export default class extends Controller {
  static targets = ["list", "meta", "title", "lead", "items", "close", "progress"]

  connect() {
    this.index = 0
    this.onRendered = () => this.render()
    window.addEventListener("cms:rendered", this.onRendered)
    this.render()
  }

  disconnect() {
    window.removeEventListener("cms:rendered", this.onRendered)
  }

  get tabs() {
    return [...this.listTarget.querySelectorAll(".fw-tab")]
  }

  select(event) {
    this.index = this.tabs.indexOf(event.currentTarget)
    this.render()
  }

  key(event) {
    const moves = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1, Home: -Infinity, End: Infinity }
    if (!(event.key in moves)) return
    event.preventDefault()
    const last = this.tabs.length - 1
    const step = moves[event.key]
    this.index = Number.isFinite(step) ? (this.index + step + last + 1) % (last + 1) : step < 0 ? 0 : last
    this.render()
    this.tabs[this.index].focus()
  }

  render() {
    const steps = activeContent().framework.steps
    if (!steps.length) return
    this.index = Math.min(this.index, steps.length - 1)
    const step = steps[this.index]

    this.tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === this.index))
      tab.tabIndex = i === this.index ? 0 : -1
    })
    this.metaTarget.textContent = `TAHAP ${String(this.index + 1).padStart(2, "0")} · ${step.when}`
    this.titleTarget.textContent = step.title
    this.leadTarget.textContent = step.lead
    this.closeTarget.textContent = step.close
    this.itemsTarget.replaceChildren(...(step.items || []).map((text) => {
      const li = document.createElement("li")
      li.innerHTML = '<span class="check" aria-hidden="true"></span>'
      li.append(text)
      return li
    }))
    this.progressTarget.style.width = `${((this.index + 1) / steps.length) * 100}%`

    this.element.querySelector(".fw-copy").animate?.(
      [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
      { duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 280, easing: "ease-out" }
    )
  }
}
