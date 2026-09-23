import { Controller } from "@hotwired/stimulus"

// Duplicates the logo track so the -50% translate loops seamlessly.
export default class extends Controller {
  static targets = ["track"]

  connect() {
    this.onRendered = () => this.duplicate()
    window.addEventListener("cms:rendered", this.onRendered)
    this.duplicate()
  }

  disconnect() {
    window.removeEventListener("cms:rendered", this.onRendered)
  }

  duplicate() {
    const track = this.trackTarget
    track.querySelectorAll("[data-clone]").forEach((el) => el.remove())
    ;[...track.children].filter((el) => el.tagName !== "TEMPLATE").forEach((item) => {
      const copy = item.cloneNode(true)
      copy.dataset.clone = ""
      copy.setAttribute("aria-hidden", "true")
      track.append(copy)
    })
  }
}
