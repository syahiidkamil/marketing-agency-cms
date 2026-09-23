// 1a Malam — growth framework tabs
const STEPS = [
  { title: 'Strategi Growth & Rekayasa Offer', when: 'MINGGU 1', lead: 'Kami tidak mulai dari konten. Kami mulai dari hitungan.', items: ['Target omzet', 'AOV & margin', 'Positioning offer', 'Celah di funnel'], close: 'Lalu kami susun struktur offer yang siap dikonversi oleh iklan.' },
  { title: 'Arsitektur Audiens & Funnel', when: 'MINGGU 2', lead: 'Sebelum satu rupiah dibelanjakan, kami petakan:', items: ['Perjalanan cold → warm → hot', 'Segmentasi traffic', 'Jalur landing & konversi', 'Integrasi WhatsApp & email'], close: 'Di sinilah kebanyakan brand gagal. Kami bangun mesinnya dulu.' },
  { title: 'Sistem Kreatif Performa', when: 'MINGGU 3–4', lead: 'Aset yang jualan, bukan sekadar "video cantik".', items: ['Testing kreatif volume tinggi', 'Matriks hook & angle', 'Kreatif berbasis offer', 'Iterasi tiap minggu'], close: 'Kreatif diperlakukan sebagai data, bukan seni.' },
  { title: 'Media Buying & Eksekusi Skala', when: 'BULAN 2', lead: 'Begitu sinyal muncul, kami scale dengan struktur.', items: ['Pacing & ekspansi budget', 'Arsitektur kampanye', 'Kontrol CPA & ROAS', 'Scale tanpa merusak performa'], close: 'Di sinilah growth mulai berlipat.' },
  { title: 'Optimasi, Retensi & Compounding', when: 'BULAN 3+', lead: 'Omzet yang bisa diprediksi, bulan demi bulan.', items: ['Testing offer berkala', 'Optimasi funnel', 'Omzet backend via WhatsApp/CRM', 'Sesi strategi bulanan', 'Dashboard real-time'], close: 'Kami bangun omzet yang berulang, bukan lonjakan sesaat.' },
];

const tabs = document.getElementById('fw-tabs');
const $ = (id) => document.getElementById(id);
const num = (i) => '0' + (i + 1);

STEPS.forEach((s, i) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'fw-tab';
  btn.setAttribute('role', 'tab');
  btn.setAttribute('aria-controls', 'fw-panel');
  btn.innerHTML = `<span class="fw-num">${num(i)}</span><span class="fw-name"></span>`;
  btn.querySelector('.fw-name').textContent = s.title;
  btn.addEventListener('click', () => select(i));
  btn.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (i + d + STEPS.length) % STEPS.length;
    select(next);
    tabs.children[next].focus();
  });
  tabs.appendChild(btn);
});

function select(i) {
  const s = STEPS[i];
  [...tabs.children].forEach((b, j) => {
    b.setAttribute('aria-selected', String(i === j));
    b.tabIndex = i === j ? 0 : -1;
  });
  $('fw-meta').textContent = `TAHAP ${num(i)} · ${s.when}`;
  $('fw-title').textContent = s.title;
  $('fw-lead').textContent = s.lead;
  $('fw-close').textContent = s.close;
  $('fw-items').replaceChildren(...s.items.map((it) => {
    const row = document.createElement('div');
    row.innerHTML = '<span class="check"></span>';
    row.append(it);
    return row;
  }));
}

select(0);
