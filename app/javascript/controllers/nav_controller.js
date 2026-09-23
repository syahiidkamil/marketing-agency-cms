import { Controller } from "@hotwired/stimulus"

// Sticky header: scrolled state, current-section highlight, and the mobile menu.
export default class extends Controller {
  static targets = ["links", "menu", "button"]

  connect() {
    this.onScroll = () => this.element.classList.toggle("is-scrolled", window.scrollY > 8)
    window.addEventListener("scroll", this.onScroll, { passive: true })
    this.onScroll()
    this.watchSections()
  }

  disconnect() {
    window.removeEventListener("scroll", this.onScroll)
    this.observer?.disconnect()
    document.body.classList.remove("menu-open")
  }

  toggle() {
    this.menuTarget.hidden ? this.open() : this.close()
  }

  open() {
    this.menuTarget.hidden = false
    this.buttonTarget.setAttribute("aria-expanded", "true")
    this.buttonTarget.setAttribute("aria-label", "Tutup menu")
    document.body.classList.add("menu-open")
  }

  close() {
    if (this.menuTarget.hidden) return
    this.menuTarget.hidden = true
    this.buttonTarget.setAttribute("aria-expanded", "false")
    this.buttonTarget.setAttribute("aria-label", "Buka menu")
    document.body.classList.remove("menu-open")
  }

  watchSections() {
    if (!("IntersectionObserver" in window)) return
    const links = [...this.linksTarget.querySelectorAll("a[href^='#']")]
    const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean)
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`))
      })
    }, { rootMargin: "-45% 0px -50% 0px" })
    sections.forEach((section) => this.observer.observe(section))
  }
}
