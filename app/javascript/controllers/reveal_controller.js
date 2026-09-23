import { Controller } from "@hotwired/stimulus"

// Fades [data-reveal] blocks in as they scroll into view and counts up
// [data-countup] numbers ("Rp1,84 M", "−41%", "3,4x") inside them.
export default class extends Controller {
  connect() {
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!this.reduced && "IntersectionObserver" in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          this.show(entry.target)
          this.observer.unobserve(entry.target)
        })
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 })
    }
    this.onRendered = () => this.scan()
    window.addEventListener("cms:rendered", this.onRendered)
    this.scan()
  }

  disconnect() {
    this.observer?.disconnect()
    window.removeEventListener("cms:rendered", this.onRendered)
  }

  scan() {
    this.element.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => {
      this.observer ? this.observer.observe(el) : this.show(el, false)
    })
  }

  show(el, animate = true) {
    el.classList.add("is-visible")
    if (!animate) return
    const counters = el.matches("[data-countup]") ? [el] : el.querySelectorAll("[data-countup]")
    counters.forEach((counter) => this.countUp(counter))
  }

  countUp(el) {
    const text = el.textContent
    const match = text.match(/\d+(?:[.,]\d+)?/)
    if (!match) return
    const [number] = match
    const decimals = (number.split(/[.,]/)[1] || "").length
    const separator = number.includes(".") ? "." : ","
    const target = parseFloat(number.replace(",", "."))
    const before = text.slice(0, match.index)
    const after = text.slice(match.index + number.length)
    const start = performance.now()
    const duration = 1100

    const frame = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const value = target * (1 - Math.pow(1 - t, 3))
      el.textContent = before + value.toFixed(decimals).replace(".", separator) + after
      if (t < 1) requestAnimationFrame(frame)
      else el.textContent = text
    }
    requestAnimationFrame(frame)
  }
}
