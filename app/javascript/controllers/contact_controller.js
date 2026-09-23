import { Controller } from "@hotwired/stimulus"
import { activeContent, addLead, whatsappUrl } from "lib/content_store"

// Audit booking form: validates, stores the lead for the admin inbox, then
// offers a WhatsApp handoff with the details pre-filled.
export default class extends Controller {
  static targets = ["form", "note", "success", "whatsapp"]

  connect() {
    this.onRendered = () => { if (!this.noteTarget.classList.contains("is-error")) this.showDefaultNote() }
    window.addEventListener("cms:rendered", this.onRendered)
  }

  disconnect() {
    window.removeEventListener("cms:rendered", this.onRendered)
  }

  showDefaultNote() {
    this.noteTarget.textContent = activeContent().cta.note
    this.noteTarget.classList.remove("is-error")
  }

  submit(event) {
    event.preventDefault()
    const form = this.formTarget
    const fields = [...form.querySelectorAll("input[required]")]
    const missing = fields.filter((input) => !input.value.trim())
    fields.forEach((input) => input.toggleAttribute("aria-invalid", missing.includes(input)))

    const checked = form.querySelector("input[name=omzet]:checked")
    form.querySelector(".options").classList.toggle("is-invalid", !checked)

    if (missing.length || !checked) {
      this.noteTarget.textContent = missing.length
        ? "Lengkapi nama, brand, dan nomor WhatsApp dulu ya."
        : "Pilih kisaran omzet online per bulan."
      this.noteTarget.classList.add("is-error")
      ;(missing[0] || form.querySelector("input[name=omzet]")).focus()
      return
    }

    const data = new FormData(form)
    const lead = {
      name: data.get("name").trim(),
      brand: data.get("brand").trim(),
      whatsapp: data.get("whatsapp").trim(),
      omzet: checked.closest("label").textContent.trim(),
    }
    addLead(lead)

    const message = [
      "Halo rakit., saya mau audit growth gratis.",
      `Nama: ${lead.name}`,
      `Brand: ${lead.brand}`,
      `WhatsApp: ${lead.whatsapp}`,
      `Omzet online / bulan: ${lead.omzet}`,
    ].join("\n")
    this.whatsappTarget.href = whatsappUrl(activeContent(), message)

    form.hidden = true
    this.successTarget.hidden = false
    this.successTarget.focus()
  }

  clearError(event) {
    if (event.target.matches("input[required]") && event.target.value.trim()) event.target.removeAttribute("aria-invalid")
    if (event.target.name === "omzet") this.formTarget.querySelector(".options").classList.remove("is-invalid")
    if (!this.formTarget.querySelector("[aria-invalid], .options.is-invalid")) {
      this.showDefaultNote()
    }
  }

  reset() {
    this.formTarget.reset()
    this.successTarget.hidden = true
    this.formTarget.hidden = false
    this.formTarget.querySelector("input").focus()
  }
}
