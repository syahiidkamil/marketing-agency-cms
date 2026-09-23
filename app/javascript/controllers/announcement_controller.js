import { Controller } from "@hotwired/stimulus"

const KEY = "rakit.announce-dismissed.v1"

export default class extends Controller {
  static targets = ["bar"]

  connect() {
    try { if (localStorage.getItem(KEY)) this.barTarget.hidden = true } catch {}
  }

  dismiss() {
    this.barTarget.hidden = true
    try { localStorage.setItem(KEY, "1") } catch {}
  }
}
