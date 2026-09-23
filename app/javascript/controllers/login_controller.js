import { Controller } from "@hotwired/stimulus"
import { isAdmin, setAdmin } from "lib/content_store"

// Demo login. The deployed site is static, so the credential check runs in the
// browser; "Login as admin" types the demo credentials in for the visitor.
export default class extends Controller {
  static targets = ["form", "username", "password", "error", "submit", "demo", "toggle"]
  static values = { username: String, password: String }

  connect() {
    if (isAdmin()) location.replace("/admin")
  }

  async autofill() {
    if (this.filling) return
    this.filling = true
    this.demoTarget.disabled = true
    this.hideError()
    await this.type(this.usernameTarget, this.usernameValue)
    await this.type(this.passwordTarget, this.passwordValue)
    this.demoTarget.disabled = false
    this.filling = false
    this.submitTarget.classList.add("is-ready")
    this.submitTarget.focus()
  }

  async type(input, text) {
    const instant = matchMedia("(prefers-reduced-motion: reduce)").matches
    input.value = ""
    input.focus()
    for (const char of text) {
      input.value += char
      if (!instant) await new Promise((resolve) => setTimeout(resolve, 45))
    }
  }

  submit(event) {
    event.preventDefault()
    const username = this.usernameTarget.value.trim()
    const password = this.passwordTarget.value

    if (!username || !password) return this.showError("Isi username dan password, atau pakai tombol Login as admin.")
    if (username !== this.usernameValue || password !== this.passwordValue) return this.showError("Username atau password salah.")

    setAdmin(true)
    this.submitTarget.disabled = true
    this.submitTarget.textContent = "Masuk…"
    location.assign("/admin")
  }

  togglePassword() {
    const show = this.passwordTarget.type === "password"
    this.passwordTarget.type = show ? "text" : "password"
    this.toggleTarget.textContent = show ? "Sembunyikan" : "Lihat"
    this.toggleTarget.setAttribute("aria-label", show ? "Sembunyikan password" : "Tampilkan password")
  }

  showError(message) {
    this.errorTarget.textContent = message
    this.errorTarget.hidden = false
    this.formTarget.classList.remove("shake")
    void this.formTarget.offsetWidth
    this.formTarget.classList.add("shake")
  }

  hideError() {
    this.errorTarget.hidden = true
  }
}
