import { Controller } from "@hotwired/stimulus"
import {
  clone, contentMeta, currentContent, deepMerge, defaultContent, deleteLead, getLeads,
  hasCustomContent, resetContent, saveContent, setAdmin, updateLead, addLead, LEADS_KEY,
} from "lib/content_store"
import { SECTIONS } from "lib/cms_schema"

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
const keys = (path) => path.split(".").map((k) => (/^\d+$/.test(k) ? Number(k) : k))
const getAt = (object, path) => keys(path).reduce((node, key) => node?.[key], object)
function setAt(object, path, value) {
  const parts = keys(path)
  const last = parts.pop()
  parts.reduce((node, key) => node[key], object)[last] = value
}

const SAMPLE_LEADS = [
  { name: "Ayu Lestari", brand: "Sambal Ibu", whatsapp: "0812 7788 1122", omzet: "Rp100–500 jt" },
  { name: "Bima Saputra", brand: "Ombak Surfwear", whatsapp: "0813 4455 6677", omzet: "Rp500 jt – 2 M" },
  { name: "Citra Maharani", brand: "tenun.co", whatsapp: "0857 2211 3344", omzet: "< Rp100 jt" },
]

// The admin CMS: section navigation, schema-driven forms, list editing,
// a live preview iframe, leads inbox, and JSON backup/restore. Everything is
// stored in this browser's localStorage (see lib/content_store.js).
export default class extends Controller {
  static targets = [
    "sidebar", "nav", "crumb", "title", "status", "editor", "workarea", "preview", "previewToggle",
    "stage", "frame", "save", "discard", "modal", "modalTitle", "modalBody", "modalConfirm", "toasts",
  ]

  connect() {
    this.draft = currentContent()
    this.savedSnapshot = JSON.stringify(this.draft)
    this.openItems = new Set()
    this.previewDevice = "desktop"
    this.section = SECTIONS.find((s) => s.id === location.hash.slice(1)) || SECTIONS[0]

    this.onMessage = (event) => {
      if (event.origin === location.origin && event.data?.type === "rakit:preview-ready") this.pushPreview()
    }
    this.onStorage = (event) => { if (event.key === LEADS_KEY) { this.renderNav(); if (this.section.id === "leads" || this.section.id === "overview") this.renderSection() } }
    window.addEventListener("message", this.onMessage)
    window.addEventListener("storage", this.onStorage)

    this.editorTarget.addEventListener("input", (event) => this.edit(event))
    this.editorTarget.addEventListener("toggle", (event) => this.trackToggle(event), true)
    this.resizeObserver = new ResizeObserver(() => this.fitPreview())
    this.resizeObserver.observe(this.stageTarget)

    this.renderNav()
    this.renderSection()
    this.updateStatus()
  }

  disconnect() {
    window.removeEventListener("message", this.onMessage)
    window.removeEventListener("storage", this.onStorage)
    this.resizeObserver?.disconnect()
  }

  // ---------- Navigation ----------

  go(event) {
    const section = SECTIONS.find((s) => s.id === event.currentTarget.dataset.section)
    if (!section) return
    this.section = section
    history.replaceState(null, "", `#${section.id}`)
    this.renderNav()
    this.renderSection()
    this.closeSidebar()
    this.editorTarget.scrollTop = 0
    if (section.anchor) this.postToFrame({ type: "rakit:scroll", anchor: section.anchor })
  }

  openSidebar() { this.element.classList.add("sidebar-open") }
  closeSidebar() { this.element.classList.remove("sidebar-open") }

  renderNav() {
    const newLeads = getLeads().filter((lead) => lead.status === "new").length
    const groups = [...new Set(SECTIONS.map((s) => s.group))]
    this.navTarget.innerHTML = groups.map((group) => `
      <p class="nav-group">${esc(group)}</p>
      ${SECTIONS.filter((s) => s.group === group).map((s) => `
        <button type="button" class="nav-item" data-action="cms#go" data-section="${s.id}" ${s.id === this.section.id ? 'aria-current="page"' : ""}>
          <span class="nav-icon" aria-hidden="true">${esc(s.icon)}</span>${esc(s.label)}
          ${s.id === "leads" && newLeads ? `<span class="nav-badge">${newLeads}</span>` : ""}
        </button>`).join("")}
    `).join("")
  }

  renderSection() {
    const s = this.section
    this.crumbTarget.textContent = s.group
    this.titleTarget.textContent = s.label
    if (s.id === "overview") this.editorTarget.innerHTML = this.overviewHTML()
    else if (s.id === "leads") this.editorTarget.innerHTML = this.leadsHTML()
    else if (s.id === "data") this.editorTarget.innerHTML = this.dataHTML()
    else this.editorTarget.innerHTML = this.formHTML(s)
  }

  // ---------- Content forms ----------

  formHTML(section) {
    const fields = section.fields?.length ? `
      <div class="panel">
        <div class="panel-head"><h2>Teks</h2>${section.anchor ? `<button type="button" class="link-btn" data-action="cms#scrollPreview">Lihat di pratinjau →</button>` : ""}</div>
        <div class="fields">${section.fields.map((field) => this.fieldHTML(field.path, field.label, field.type, getAt(this.draft, field.path), field.hint)).join("")}</div>
      </div>` : ""
    return fields + (section.lists || []).map((list) => this.listHTML(list)).join("")
  }

  fieldHTML(path, label, type = "text", value, hint) {
    const id = `f-${path.replace(/\./g, "-")}`
    let display = value ?? ""
    if (type === "lines") display = (value || []).join("\n")
    if (type === "numbers") display = (value || []).join(", ")
    const multiline = type === "textarea" || type === "lines"
    const rows = type === "lines" ? Math.max(3, (value || []).length + 1) : 3
    const control = multiline
      ? `<textarea id="${id}" data-path="${esc(path)}" data-type="${type}" rows="${rows}">${esc(display)}</textarea>`
      : `<input id="${id}" type="text" data-path="${esc(path)}" data-type="${type}" value="${esc(display)}"${type === "numbers" ? ' inputmode="decimal"' : ""}>`
    return `
      <div class="cf ${multiline ? "cf-wide" : ""}">
        <label for="${id}">${esc(label)}</label>
        ${control}
        ${hint ? `<p class="cf-hint">${esc(hint)}</p>` : ""}
      </div>`
  }

  listHTML(list) {
    const items = getAt(this.draft, list.path) || []
    return `
      <div class="panel">
        <div class="panel-head">
          <h2>${esc(list.label)} <span class="count">${items.length}</span></h2>
          <button type="button" class="ghost-btn small" data-action="cms#addItem" data-list="${list.path}">+ Tambah</button>
        </div>
        ${items.length ? `<ol class="items">${items.map((item, index) => this.itemHTML(list, item, index, items.length)).join("")}</ol>`
          : `<p class="empty">Belum ada ${esc(list.label.toLowerCase())}. Klik “Tambah” untuk membuat.</p>`}
      </div>`
  }

  itemHTML(list, item, index, total) {
    const key = `${list.path}.${index}`
    const atMin = total <= (list.min || 0)
    return `
      <li class="item">
        <details ${this.openItems.has(key) ? "open" : ""} data-key="${key}">
          <summary>
            <span class="item-idx">${index + 1}</span>
            <span class="item-title" data-title-for="${key}">${esc(list.title(item, index))}</span>
            <span class="item-actions">
              <button type="button" class="icon-btn" data-action="cms#moveItem" data-list="${list.path}" data-index="${index}" data-dir="-1" aria-label="Pindah ke atas" ${index === 0 ? "disabled" : ""}>↑</button>
              <button type="button" class="icon-btn" data-action="cms#moveItem" data-list="${list.path}" data-index="${index}" data-dir="1" aria-label="Pindah ke bawah" ${index === total - 1 ? "disabled" : ""}>↓</button>
              <button type="button" class="icon-btn danger" data-action="cms#removeItem" data-list="${list.path}" data-index="${index}" aria-label="Hapus" ${atMin ? "disabled" : ""}>✕</button>
            </span>
          </summary>
          <div class="fields item-fields">
            ${list.fields.map((field) => this.fieldHTML(`${key}.${field.key}`, field.label, field.type, item[field.key], field.hint)).join("")}
          </div>
        </details>
      </li>`
  }

  listFor(path) {
    for (const section of SECTIONS) {
      const list = section.lists?.find((l) => l.path === path)
      if (list) return list
    }
  }

  edit(event) {
    const el = event.target
    const path = el.dataset?.path
    if (!path) return
    let value = el.value
    if (el.dataset.type === "lines") value = value.split("\n").map((line) => line.trim()).filter(Boolean)
    if (el.dataset.type === "numbers") value = value.split(/[,\s]+/).filter(Boolean).map(Number).filter(Number.isFinite).map((n) => Math.max(0, Math.min(100, n)))
    setAt(this.draft, path, value)

    const match = path.match(/^(.*)\.(\d+)\.[^.]+$/)
    if (match) {
      const list = this.listFor(match[1])
      const title = this.editorTarget.querySelector(`[data-title-for="${match[1]}.${match[2]}"]`)
      if (list && title) title.textContent = list.title(getAt(this.draft, `${match[1]}.${match[2]}`), Number(match[2]))
    }
    this.changed()
  }

  trackToggle(event) {
    const key = event.target.dataset?.key
    if (!key) return
    event.target.open ? this.openItems.add(key) : this.openItems.delete(key)
  }

  addItem(event) {
    const path = event.currentTarget.dataset.list
    const list = this.listFor(path)
    const items = getAt(this.draft, path)
    items.push(clone(list.blank))
    this.openItems.add(`${path}.${items.length - 1}`)
    this.renderSection()
    this.changed()
    const added = this.editorTarget.querySelector(`details[data-key="${path}.${items.length - 1}"]`)
    added?.scrollIntoView({ behavior: "smooth", block: "center" })
    added?.querySelector("input, textarea")?.focus({ preventScroll: true })
  }

  moveItem(event) {
    event.preventDefault()
    const { list: path, index, dir } = event.currentTarget.dataset
    const items = getAt(this.draft, path)
    const from = Number(index)
    const to = from + Number(dir)
    if (to < 0 || to >= items.length) return
    ;[items[from], items[to]] = [items[to], items[from]]
    const fromOpen = this.openItems.has(`${path}.${from}`)
    const toOpen = this.openItems.has(`${path}.${to}`)
    this.openItems[toOpen ? "add" : "delete"](`${path}.${from}`)
    this.openItems[fromOpen ? "add" : "delete"](`${path}.${to}`)
    this.renderSection()
    this.changed()
    this.editorTarget.querySelector(`[data-list="${path}"][data-index="${to}"][data-dir="${dir}"]`)?.focus()
  }

  removeItem(event) {
    event.preventDefault()
    const { list: path, index } = event.currentTarget.dataset
    const list = this.listFor(path)
    const items = getAt(this.draft, path)
    if (items.length <= (list.min || 0)) return
    const [removed] = items.splice(Number(index), 1)
    this.openItems.clear()
    this.renderSection()
    this.changed()
    this.toast(`${list.label} dihapus.`, {
      action: "Urungkan",
      onAction: () => {
        getAt(this.draft, path).splice(Number(index), 0, removed)
        this.renderSection()
        this.changed()
      },
    })
  }

  scrollPreview() {
    if (this.section.anchor) this.postToFrame({ type: "rakit:scroll", anchor: this.section.anchor })
    if (matchMedia("(max-width: 1100px)").matches && !this.workareaTarget.classList.contains("preview-open")) this.togglePreview()
  }

  // ---------- Save / discard / status ----------

  get dirty() {
    return JSON.stringify(this.draft) !== this.savedSnapshot
  }

  changed() {
    this.updateStatus()
    this.schedulePreview()
  }

  save() {
    if (!this.dirty) return
    if (!saveContent(this.draft)) return this.toast("Gagal menyimpan: penyimpanan browser penuh atau diblokir.", { tone: "error" })
    this.savedSnapshot = JSON.stringify(this.draft)
    this.updateStatus()
    this.toast("Perubahan tersimpan. Buka situs untuk melihat hasilnya.", { tone: "success" })
  }

  discard() {
    if (!this.dirty) return
    this.draft = JSON.parse(this.savedSnapshot)
    this.renderSection()
    this.changed()
    this.toast("Perubahan dibuang.")
  }

  updateStatus() {
    const dirty = this.dirty
    this.saveTarget.disabled = !dirty
    this.discardTarget.disabled = !dirty
    const meta = contentMeta()
    let label = "Konten default"
    let tone = "neutral"
    if (dirty) { label = "Belum disimpan"; tone = "warn" }
    else if (hasCustomContent()) { label = meta.savedAt ? `Tersimpan · ${this.time(meta.savedAt)}` : "Tersimpan"; tone = "ok" }
    this.statusTarget.textContent = label
    this.statusTarget.dataset.tone = tone
  }

  warn(event) {
    if (!this.dirty) return
    event.preventDefault()
    event.returnValue = ""
  }

  shortcut(event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault()
      this.save()
    }
    if (event.key === "Escape") {
      if (!this.modalTarget.hidden) this.closeModal()
      else this.closeSidebar()
    }
  }

  logout() {
    if (this.dirty && !this.leaving) {
      this.leaving = true
      return this.openModal({
        title: "Keluar tanpa menyimpan?",
        body: "Ada perubahan yang belum disimpan. Perubahan itu akan hilang.",
        confirm: "Keluar",
        onConfirm: () => this.logoutNow(),
        onCancel: () => { this.leaving = false },
      })
    }
    this.logoutNow()
  }

  logoutNow() {
    this.savedSnapshot = JSON.stringify(this.draft) // skip the unload warning
    setAdmin(false)
    location.assign("/admin/login")
  }

  // ---------- Preview ----------

  frameLoaded() {
    this.fitPreview()
    this.pushPreview()
  }

  schedulePreview() {
    clearTimeout(this.previewTimer)
    this.previewTimer = setTimeout(() => this.pushPreview(), 120)
  }

  pushPreview() {
    this.postToFrame({ type: "rakit:preview", content: this.draft })
  }

  postToFrame(message) {
    this.frameTarget.contentWindow?.postMessage(message, location.origin)
  }

  setDevice(event) {
    this.previewDevice = event.currentTarget.dataset.device
    this.element.querySelectorAll("button[data-device]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.device === this.previewDevice)))
    this.fitPreview()
  }

  fitPreview() {
    const stage = this.stageTarget
    const width = this.previewDevice === "mobile" ? 390 : 1440
    const scale = Math.min(1, (stage.clientWidth - 24) / width)
    const frame = this.frameTarget
    frame.style.width = `${width}px`
    frame.style.height = `${(stage.clientHeight - 24) / scale}px`
    frame.style.transform = `scale(${scale})`
    stage.dataset.device = this.previewDevice
  }

  togglePreview() {
    const small = matchMedia("(max-width: 1100px)").matches
    const cls = small ? "preview-open" : "preview-closed"
    const on = this.workareaTarget.classList.toggle(cls)
    const visible = small ? on : !on
    this.previewToggleTarget.setAttribute("aria-pressed", String(visible))
    if (visible) requestAnimationFrame(() => this.fitPreview())
  }

  // ---------- Overview ----------

  overviewHTML() {
    const leads = getLeads()
    const newLeads = leads.filter((l) => l.status === "new").length
    const defaults = defaultContent()
    const changedSections = SECTIONS.filter((s) => (s.fields || []).some((f) => JSON.stringify(getAt(this.draft, f.path)) !== JSON.stringify(getAt(defaults, f.path)))
      || (s.lists || []).some((l) => JSON.stringify(getAt(this.draft, l.path)) !== JSON.stringify(getAt(defaults, l.path))))
    const meta = contentMeta()

    return `
      <div class="welcome">
        <div>
          <p class="welcome-kicker">Selamat datang, admin 👋</p>
          <h2>Kelola landing page rakit. dari sini.</h2>
          <p>Pilih bagian di sidebar untuk mengubah teks. Pratinjau di kanan berubah saat kamu mengetik; tekan <kbd>⌘/Ctrl</kbd> + <kbd>S</kbd> untuk menyimpan.</p>
        </div>
        <a href="/" target="_blank" rel="noopener" class="btn-primary">Buka situs ↗</a>
      </div>

      <div class="stats">
        <div class="stat-card">
          <span class="stat-label">Status konten</span>
          <strong>${hasCustomContent() ? "Kustom" : "Default"}</strong>
          <span class="stat-sub">${meta.savedAt ? `Disimpan ${this.time(meta.savedAt, true)}` : "Belum ada perubahan tersimpan"}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Bagian diubah</span>
          <strong>${changedSections.length}<small> / ${SECTIONS.filter((s) => s.fields || s.lists).length}</small></strong>
          <span class="stat-sub">${changedSections.length ? esc(changedSections.map((s) => s.label).join(", ")) : "Semua masih default"}</span>
        </div>
        <button type="button" class="stat-card stat-link" data-action="cms#go" data-section="leads">
          <span class="stat-label">Leads baru</span>
          <strong>${newLeads}<small> / ${leads.length}</small></strong>
          <span class="stat-sub">Dari form audit gratis →</span>
        </button>
      </div>

      <div class="panel">
        <div class="panel-head"><h2>Bagian halaman</h2></div>
        <div class="section-grid">
          ${SECTIONS.filter((s) => s.fields || s.lists).map((s) => `
            <button type="button" class="section-card" data-action="cms#go" data-section="${s.id}">
              <span class="nav-icon" aria-hidden="true">${esc(s.icon)}</span>
              <span><strong>${esc(s.label)}</strong><small>${changedSections.includes(s) ? "Diubah" : "Default"}</small></span>
            </button>`).join("")}
        </div>
      </div>

      <div class="callout">
        <strong>Cara kerja demo ini</strong>
        <p>Situs di-render oleh Ruby on Rails dan diekspor sebagai HTML statis ke Vercel. Karena tidak ada server, perubahan CMS dan leads disimpan di <code>localStorage</code> browser kamu: pengunjung lain tetap melihat konten default.</p>
      </div>`
  }

  // ---------- Leads ----------

  leadsHTML() {
    const leads = getLeads()
    const counts = { all: leads.length, new: leads.filter((l) => l.status === "new").length }
    counts.contacted = counts.all - counts.new
    const head = `
      <div class="panel-head spaced">
        <div class="chips">
          <span class="chip">Total <b>${counts.all}</b></span>
          <span class="chip chip-new">Baru <b>${counts.new}</b></span>
          <span class="chip chip-done">Dihubungi <b>${counts.contacted}</b></span>
        </div>
        <div class="row-actions">
          <button type="button" class="ghost-btn small" data-action="cms#seedLeads">+ Data contoh</button>
          ${leads.length ? `<button type="button" class="ghost-btn small danger" data-action="cms#clearLeads">Hapus semua</button>` : ""}
        </div>
      </div>`

    if (!leads.length) {
      return `<div class="panel">${head}
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true">✆</span>
          <h3>Belum ada leads</h3>
          <p>Leads muncul di sini saat pengunjung mengisi form “Audit growth gratis” di landing page.</p>
          <div class="row-actions center">
            <a class="btn-primary" href="/#kontak" target="_blank" rel="noopener">Coba isi form ↗</a>
            <button type="button" class="ghost-btn" data-action="cms#seedLeads">Isi data contoh</button>
          </div>
        </div></div>`
    }

    return `<div class="panel">${head}
      <div class="table-wrap">
        <table class="leads">
          <thead><tr><th>Nama & brand</th><th>WhatsApp</th><th>Omzet / bulan</th><th>Masuk</th><th>Status</th><th><span class="sr-only">Aksi</span></th></tr></thead>
          <tbody>
            ${leads.map((lead) => `
              <tr>
                <td><strong>${esc(lead.name)}</strong><small>${esc(lead.brand)}</small></td>
                <td><a href="https://wa.me/${esc(this.waNumber(lead.whatsapp))}" target="_blank" rel="noopener" class="wa-link">${esc(lead.whatsapp)}</a></td>
                <td>${esc(lead.omzet)}</td>
                <td>${esc(this.time(lead.createdAt, true))}</td>
                <td><button type="button" class="status-pill" data-status="${lead.status}" data-action="cms#toggleLead" data-id="${esc(lead.id)}">${lead.status === "new" ? "Baru" : "Dihubungi"}</button></td>
                <td><button type="button" class="icon-btn danger" data-action="cms#removeLead" data-id="${esc(lead.id)}" aria-label="Hapus lead ${esc(lead.name)}">✕</button></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div></div>`
  }

  waNumber(raw) {
    const digits = String(raw).replace(/\D/g, "")
    return digits.startsWith("0") ? `62${digits.slice(1)}` : digits
  }

  toggleLead(event) {
    const id = event.currentTarget.dataset.id
    const lead = getLeads().find((l) => l.id === id)
    if (!lead) return
    updateLead(id, { status: lead.status === "new" ? "contacted" : "new" })
    this.renderNav()
    this.renderSection()
  }

  removeLead(event) {
    const id = event.currentTarget.dataset.id
    const lead = getLeads().find((l) => l.id === id)
    deleteLead(id)
    this.renderNav()
    this.renderSection()
    this.toast(`Lead ${lead?.name || ""} dihapus.`)
  }

  seedLeads() {
    SAMPLE_LEADS.slice().reverse().forEach((lead) => addLead(lead))
    this.renderNav()
    this.renderSection()
    this.toast("3 leads contoh ditambahkan.", { tone: "success" })
  }

  clearLeads() {
    this.openModal({
      title: "Hapus semua leads?",
      body: "Semua leads di browser ini akan dihapus permanen.",
      confirm: "Hapus semua",
      onConfirm: () => {
        getLeads().forEach((lead) => deleteLead(lead.id))
        this.renderNav()
        this.renderSection()
        this.toast("Semua leads dihapus.")
      },
    })
  }

  // ---------- Backup & reset ----------

  dataHTML() {
    return `
      <div class="panel">
        <div class="panel-head"><h2>Export konten</h2></div>
        <p class="panel-text">Unduh seluruh konten (termasuk perubahan yang belum disimpan) sebagai file JSON. Formatnya sama dengan <code>db/content.json</code>, jadi bisa langsung dipakai sebagai konten default di repo.</p>
        <button type="button" class="btn-primary" data-action="cms#exportJSON">Unduh JSON</button>
      </div>
      <div class="panel">
        <div class="panel-head"><h2>Import konten</h2></div>
        <p class="panel-text">Muat file JSON hasil export. Konten akan masuk sebagai draf; klik Simpan untuk menerapkannya.</p>
        <label class="file-drop">
          <input type="file" accept="application/json,.json" data-action="change->cms#importJSON">
          <span><strong>Pilih file JSON</strong><small>atau seret ke sini</small></span>
        </label>
      </div>
      <div class="panel panel-danger">
        <div class="panel-head"><h2>Reset ke default</h2></div>
        <p class="panel-text">Hapus semua perubahan konten di browser ini dan kembalikan ke isi <code>db/content.json</code>. Leads tidak ikut terhapus.</p>
        <button type="button" class="btn-danger" data-action="cms#resetAll">Reset konten</button>
      </div>`
  }

  exportJSON() {
    const blob = new Blob([JSON.stringify(this.draft, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement("a"), { href: url, download: `rakit-content-${new Date().toISOString().slice(0, 10)}.json` })
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    this.toast("File JSON diunduh.", { tone: "success" })
  }

  async importJSON(event) {
    const file = event.target.files[0]
    event.target.value = ""
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!data || typeof data !== "object" || !data.hero || !data.framework) throw new Error("shape")
      this.draft = deepMerge(defaultContent(), data)
      this.changed()
      this.toast("Konten diimpor sebagai draf. Klik Simpan untuk menerapkan.", { tone: "success" })
    } catch {
      this.toast("File tidak valid. Pastikan ini hasil export dari CMS rakit.", { tone: "error" })
    }
  }

  resetAll() {
    this.openModal({
      title: "Reset konten ke default?",
      body: "Semua perubahan yang tersimpan maupun belum akan hilang dari browser ini.",
      confirm: "Reset konten",
      onConfirm: () => {
        resetContent()
        this.draft = defaultContent()
        this.savedSnapshot = JSON.stringify(this.draft)
        this.openItems.clear()
        this.updateStatus()
        this.pushPreview()
        this.toast("Konten dikembalikan ke default.", { tone: "success" })
      },
    })
  }

  // ---------- Modal & toasts ----------

  openModal({ title, body, confirm, onConfirm, onCancel }) {
    this.modal = { onConfirm, onCancel }
    this.modalTitleTarget.textContent = title
    this.modalBodyTarget.textContent = body
    this.modalConfirmTarget.textContent = confirm
    this.lastFocus = document.activeElement
    this.modalTarget.hidden = false
    this.modalConfirmTarget.focus()
  }

  closeModal() {
    this.modal?.onCancel?.()
    this.hideModal()
  }

  confirmModal() {
    const action = this.modal?.onConfirm
    this.hideModal()
    action?.()
  }

  hideModal() {
    this.modal = null
    this.modalTarget.hidden = true
    this.lastFocus?.focus?.()
  }

  toast(message, { tone = "neutral", action, onAction } = {}) {
    const el = document.createElement("div")
    el.className = "toast"
    el.dataset.tone = tone
    el.append(message)
    if (action) {
      const button = Object.assign(document.createElement("button"), { type: "button", textContent: action })
      button.addEventListener("click", () => { onAction(); el.remove() })
      el.append(button)
    }
    this.toastsTarget.append(el)
    setTimeout(() => el.classList.add("leaving"), action ? 5500 : 3200)
    setTimeout(() => el.remove(), action ? 5900 : 3600)
  }

  time(iso, withDate = false) {
    const date = new Date(iso)
    const options = withDate ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" } : { hour: "2-digit", minute: "2-digit" }
    return date.toLocaleString("id-ID", options)
  }
}
