// Describes which parts of db/content.json the CMS edits and how.
//
// fields: { path, label, type?: "text" | "textarea" | "numbers" | "image", hint? }
// lists:  { path, label, fields: [{ key, type? }], title(item), min?, blank }
// `type: "lines"` on a list field edits an array of strings, one per line.

const f = (path, label, type = "text", hint) => ({ path, label, type, hint })

export const SECTIONS = [
  { id: "overview", label: "Ringkasan", icon: "◎", group: "Dashboard" },

  {
    id: "hero", label: "Hero & Pengumuman", icon: "✦", group: "Konten", anchor: "#top",
    fields: [
      f("announcement.primary", "Pengumuman — kiri"),
      f("announcement.secondary", "Pengumuman — kanan"),
      f("nav.cta", "Tombol di navigasi"),
      f("hero.badge", "Badge kepercayaan"),
      f("hero.titleLead", "Judul"),
      f("hero.titleHighlight", "Judul — bagian emas", "text", "Ditampilkan setelah judul dengan warna emas."),
      f("hero.subtitle", "Subjudul", "textarea"),
      f("hero.primaryCta", "Tombol utama"),
      f("hero.secondaryCta", "Tombol WhatsApp"),
    ],
    lists: [
      { path: "reels", label: "Reel iklan", title: (i) => `${i.brand || "Reel"} · ${i.kpi || ""}`, blank: { image: "", alt: "", brand: "Brand baru", kpi: "ROAS 0x" },
        fields: [
          { key: "image", label: "Gambar (9:16)", type: "image", hint: "Path di /images/… (pilih dari daftar) atau URL gambar." },
          { key: "alt", label: "Deskripsi gambar (alt)" },
          { key: "brand", label: "Brand" }, { key: "kpi", label: "KPI" },
        ] },
    ],
  },

  {
    id: "logos", label: "Logo klien", icon: "◇", group: "Konten", anchor: "#main",
    fields: [f("logos.heading", "Judul strip logo")],
    lists: [
      { path: "logos.items", label: "Logo", title: (i) => i.name || "Logo", blank: { name: "BRAND BARU", logo: "" },
        fields: [
          { key: "name", label: "Nama brand", hint: "Ditampilkan sebagai teks jika tidak ada logo." },
          { key: "logo", label: "Logo (SVG terang, latar gelap)", type: "image", hint: "Path di /images/… (pilih dari daftar) atau URL gambar." },
        ] },
    ],
  },

  {
    id: "story", label: "Masalah & Janji", icon: "❝", group: "Konten", anchor: "#tentang",
    fields: [
      f("problem.eyebrow", "Eyebrow"),
      f("problem.lead", "Kalimat pembuka", "textarea"),
      f("problem.muted", "Kalimat abu-abu", "textarea"),
      f("problem.close", "Kalimat penutup", "textarea"),
      f("promise.label", "Label kartu janji"),
      f("promise.titleLead", "Judul janji"),
      f("promise.titleHighlight", "Judul janji — bagian emas"),
      f("promise.body", "Isi janji", "textarea"),
      f("promise.signature", "Tanda tangan"),
    ],
  },

  {
    id: "framework", label: "Growth framework", icon: "▤", group: "Konten", anchor: "#framework",
    fields: [f("framework.eyebrow", "Eyebrow"), f("framework.title", "Judul"), f("framework.note", "Catatan kanan")],
    lists: [
      { path: "framework.steps", label: "Tahap", min: 1, title: (i, n) => `Tahap ${String(n + 1).padStart(2, "0")} · ${i.title || ""}`,
        blank: { title: "Tahap baru", when: "BULAN 4", image: "", lead: "", items: [], close: "" },
        fields: [
          { key: "title", label: "Nama tahap" },
          { key: "when", label: "Waktu", hint: "mis. MINGGU 1" },
          { key: "image", label: "Visual tahap", type: "image", hint: "Path di /images/… (pilih dari daftar) atau URL gambar." },
          { key: "lead", label: "Kalimat pembuka", type: "textarea" },
          { key: "items", label: "Checklist", type: "lines", hint: "Satu poin per baris." },
          { key: "close", label: "Kalimat penutup", type: "textarea" },
        ] },
    ],
  },

  {
    id: "results", label: "Hasil & Statistik", icon: "▲", group: "Konten", anchor: "#hasil",
    fields: [
      f("results.eyebrow", "Eyebrow"),
      f("results.title", "Judul", "textarea"),
      f("results.body", "Deskripsi", "textarea"),
      f("results.chartLabel", "Label grafik"),
      f("results.chartValue", "Angka utama"),
      f("results.chartDelta", "Pertumbuhan"),
      f("results.chartStart", "Sumbu — awal"),
      f("results.chartMid", "Sumbu — tengah"),
      f("results.chartEnd", "Sumbu — akhir"),
      f("results.bars", "Tinggi batang grafik (%)", "numbers", "Angka 0–100 dipisah koma. Batang terakhir berwarna emas."),
    ],
    lists: [
      { path: "results.stats", label: "Kartu statistik", title: (i) => `${i.label || "Statistik"} — ${i.value || ""}`, blank: { label: "BRAND · METRIK", value: "0%", note: "" },
        fields: [{ key: "label", label: "Label" }, { key: "value", label: "Angka" }, { key: "note", label: "Catatan" }] },
    ],
  },

  {
    id: "testimonials", label: "Testimoni", icon: "☺", group: "Konten", anchor: "#testimoni",
    fields: [f("testimonials.eyebrow", "Eyebrow"), f("testimonials.title", "Judul")],
    lists: [
      { path: "testimonials.items", label: "Testimoni", title: (i) => `${i.name || "Nama"} · ${i.role || ""}`,
        blank: { kpi: "+0%", kpiLabel: "METRIK", quote: "", name: "Nama klien", role: "Jabatan, Brand" },
        fields: [
          { key: "kpi", label: "Angka" }, { key: "kpiLabel", label: "Label angka" },
          { key: "quote", label: "Kutipan", type: "textarea" },
          { key: "name", label: "Nama" }, { key: "role", label: "Jabatan" },
        ] },
    ],
  },

  {
    id: "comparison", label: "Perbandingan", icon: "⇄", group: "Konten", anchor: "#perbedaan",
    fields: [f("comparison.eyebrow", "Eyebrow"), f("comparison.titleLead", "Judul (sebelum “vs rakit.”)"), f("comparison.oldTitle", "Judul kolom kiri")],
    lists: [
      { path: "comparison.old", label: "Agensi lain", title: (i) => i.text || "Poin", blank: { text: "Poin baru" }, fields: [{ key: "text", label: "Poin" }] },
      { path: "comparison.new", label: "rakit.", title: (i) => i.text || "Poin", blank: { text: "Poin baru" }, fields: [{ key: "text", label: "Poin" }] },
    ],
  },

  {
    id: "faq", label: "FAQ", icon: "?", group: "Konten", anchor: "#faq",
    fields: [f("faq.eyebrow", "Eyebrow"), f("faq.title", "Judul")],
    lists: [
      { path: "faq.items", label: "Pertanyaan", title: (i) => i.q || "Pertanyaan", blank: { q: "Pertanyaan baru?", a: "" },
        fields: [{ key: "q", label: "Pertanyaan" }, { key: "a", label: "Jawaban", type: "textarea" }] },
    ],
  },

  {
    id: "cta", label: "CTA & Form", icon: "✉", group: "Konten", anchor: "#kontak",
    fields: [
      f("cta.title", "Judul"),
      f("cta.body", "Deskripsi", "textarea"),
      f("cta.formTitle", "Judul form"),
      f("cta.omzetLabel", "Label pilihan omzet"),
      f("cta.submit", "Tombol kirim"),
      f("cta.note", "Catatan di bawah tombol"),
      f("cta.successTitle", "Judul setelah terkirim"),
      f("cta.successBody", "Pesan setelah terkirim", "textarea"),
    ],
    lists: [
      { path: "cta.points", label: "Poin audit", title: (i) => i.text || "Poin", blank: { text: "Poin baru" }, fields: [{ key: "text", label: "Poin" }] },
      { path: "cta.omzetOptions", label: "Pilihan omzet", min: 1, title: (i) => i.label || "Pilihan", blank: { label: "Rp0 jt" }, fields: [{ key: "label", label: "Label" }] },
    ],
  },

  {
    id: "general", label: "Kontak & SEO", icon: "⚙", group: "Konten", anchor: "#kontak",
    fields: [
      f("meta.title", "Judul halaman (SEO)"),
      f("meta.description", "Deskripsi (SEO)", "textarea"),
      f("contact.whatsapp", "Nomor WhatsApp", "text", "Format internasional tanpa + atau spasi, mis. 6281234567890."),
      f("contact.phone", "Nomor yang ditampilkan"),
      f("contact.email", "Email"),
      f("contact.address", "Alamat kantor", "textarea"),
      f("footer.tagline", "Tagline footer"),
      f("footer.copyright", "Copyright"),
    ],
  },

  { id: "leads", label: "Leads", icon: "✆", group: "Data" },
  { id: "data", label: "Backup & Reset", icon: "⤓", group: "Data" },
]
