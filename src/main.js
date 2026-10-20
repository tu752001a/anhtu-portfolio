import './style.css';
import { toEmbed } from './embed.js';
import { SoundScape } from './audio.js';

const CHAPTERS = [
  { key: 'hero', label: 'Mở đầu' },
  { key: 'about', label: 'Về tôi' },
  { key: 'showreel', label: 'Showreel' },
  { key: 'projects', label: 'Dự án' },
  { key: 'skills', label: 'Kỹ năng' },
  { key: 'clients', label: 'Khách hàng' },
  { key: 'process', label: 'Quy trình' },
  { key: 'contact', label: 'Kết nối' },
];
const COUNT = CHAPTERS.length;
const $ = (s, r = document) => r.querySelector(s);
const esc = (s = '') => String(s ?? '').normalize('NFC').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// **chữ nhấn mạnh** trong nội dung → highlight vàng
const rich = (s = '') => esc(s).replace(/\*\*(.+?)\*\*/g, '<mark class="hl">$1</mark>');
const plain = (s = '') => String(s ?? '').replace(/\*\*/g, '');
// tách từng chữ để hiện ra dần dần (giữ nguyên dấu tiếng Việt vì tách theo khoảng trắng)
function words(text, cls = 'body', d = 0, tag = 'p') {
  let i = 0;
  const html = String(text ?? '').normalize('NFC').split(/(\*\*.+?\*\*)/g).map((part) => {
    const hl = /^\*\*.+\*\*$/.test(part);
    const seg = (hl ? part.slice(2, -2) : part).split(/(\s+)/).map((w) => (!w || /^\s+$/.test(w) ? w : `<span class="w" style="--w:${i++}">${esc(w)}</span>`)).join('');
    return hl ? `<mark class="hl">${seg}</mark>` : seg;
  }).join('');
  return `<${tag} class="${cls} words" style="--d:${d}">${html}</${tag}>`;
}
const get = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));
const pad = (n) => String(n).padStart(2, '0');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let content;
let world = null;
const sound = new SoundScape('/audio/lalalove.mp3');
const mod = (n) => ((n % COUNT) + COUNT) % COUNT;

/* ---------------- Màn chờ ---------------- */
const loader = {
  shown: 0,
  value: 0,
  start: performance.now(),
  set(v) { this.value = Math.max(this.value, v); },
  tick() {
    const minTime = Math.min((performance.now() - this.start) / 2600, 1);
    const goal = Math.min(this.value, minTime * 100);
    this.shown += (goal - this.shown) * 0.08;
    const v = Math.round(this.shown);
    $('#loaderCount').textContent = v;
    $('#loaderBar').style.transform = `scaleX(${this.shown / 100})`;
    if (v >= 100 && !this.done) {
      this.done = true;
      const btn = $('#enterBtn');
      btn.disabled = false;
      btn.classList.add('ready');
    }
  },
};

function splitName(el, text) {
  el.innerHTML = [...text].map((c, i) => (c === ' ' ? ' ' : `<span class="ch" style="--i:${i}">${esc(c)}</span>`)).join('');
}

/* ---------------- Nội dung từng chương ---------------- */
const r = (html, d = 0) => `<span class="r" style="--d:${d}"><span class="in">${html}</span></span>`;
const kicker = (i, text) => `<p class="kicker fade" style="--d:0">${pad(i + 1)} — ${esc(text)}</p>`;

function titleHTML(text, d = 1) {
  // từ cuối in nghiêng cho có nhịp
  const words = plain(text).normalize('NFC').split(' ');
  if (words.length > 1) words[words.length - 1] = `<em>${esc(words.pop())}</em>`;
  return `<h2 class="title">${r(words.map((w) => (w.startsWith('<em>') ? w : esc(plain(w)))).join(' '), d)}</h2>`;
}

const ICONS = {
  vinyl: '<svg viewBox="0 0 40 40"><g class="spin"><circle cx="20" cy="20" r="17" fill="#141217" stroke="#3a3540"/><circle cx="20" cy="20" r="11" fill="none" stroke="#2c2832"/><circle cx="20" cy="20" r="6" fill="#e3a95c"/><circle cx="20" cy="20" r="1.4" fill="#141217"/></g></svg>',
  bowl: '<svg viewBox="0 0 40 40"><path class="steam s1" d="M14 14c-2-3 2-4 0-8"/><path class="steam s2" d="M20 14c-2-3 2-4 0-8"/><path class="steam s3" d="M26 14c-2-3 2-4 0-8"/><path d="M5 18h30a15 13 0 0 1-30 0z" fill="#c8342b"/><path d="M5 18h30" stroke="#f2e6c8" stroke-width="2"/></svg>',
  phone: '<svg viewBox="0 0 40 40"><rect x="12" y="4" width="16" height="32" rx="3" fill="#1a1820" stroke="#555"/><rect class="scr" x="14" y="7" width="12" height="26" rx="1"/><path d="M18 16l5 4-5 4z" fill="#fff"/><path class="pop" d="M31 10c-2-2-5 1-2 4l2 2 2-2c3-3 0-6-2-4z" fill="#ff4f7b"/></svg>',
  cup: '<svg viewBox="0 0 40 40"><path d="M10 14h20l-3 22H13z" fill="#f7f1e6"/><path d="M11 20h18l-1 8H12z" fill="#d3302a"/><ellipse class="lid" cx="20" cy="13" rx="11" ry="2.5" fill="#e3a95c"/></svg>',
  beauty: '<svg viewBox="0 0 40 40"><g class="sway"><rect x="8" y="20" width="24" height="14" rx="3" fill="#5cc8f2"/><text x="20" y="29.5" font-size="5" font-weight="700" text-anchor="middle" fill="#fff" font-family="sans-serif">G.G.G</text><g class="lid"><rect x="7" y="13" width="26" height="7" rx="2.5" fill="#f4f6fa"/></g></g><circle class="bub b1" cx="6" cy="12" r="2"/><circle class="bub b2" cx="34" cy="10" r="1.6"/><circle class="bub b3" cx="31" cy="5" r="1.2"/></svg>',
};
const ANIM_LIST = Object.keys(ICONS);
const nameOf = (x) => (typeof x === 'string' ? { name: x, url: '' } : x || {});
const teaser = (i) => (i < COUNT - 1 ? `<button class="next-teaser fade" style="--d:9" data-goto="${i + 1}" data-hover><span>Tiếp theo</span> ${esc(CHAPTERS[i + 1].label)} <i>→</i></button>` : '');

// lời cam kết: nhãn "Cam kết" nổi bật, từng chữ hiện ra rồi một vệt sáng vàng quét qua
function promiseHTML(text, d) {
  const t = String(text).normalize('NFC');
  const m = t.match(/^([^:]{2,24}):\s*(.+)$/);
  const label = m ? m[1] : 'Cam kết';
  const body = m ? m[2] : t;
  return `<div class="promise fade" style="--d:${d}"><span class="promise-k">${esc(label)}</span>${words(body.includes('**') ? body : `**${body}**`, 'promise-t', d + 1, 'p')}</div>`;
}

function buildChapters(c) {
  const html = [];
  const h = c.hero || {};
  html.push(`
  <section class="chapter center hero" data-i="0"><div class="panel">
    <p class="kicker fade">${esc(h.eyebrow)}</p>
    <h1 class="sr-only">${esc(h.name)}</h1>
    <p class="rotator fade" style="--d:2" aria-live="polite">${(h.taglines || []).map((t, i) => `<span class="${i ? '' : 'on'}">${esc(t)}</span>`).join('')}</p>
    ${words(h.intro, 'body', 4)}
    <p class="tip fade" style="--d:6">✦ Di chuột qua tên để khuấy bụi sao, chạm vào tên hoặc nhân vật để xem điều bất ngờ</p>
    ${teaser(0)}
  </div></section>`);

  const a = c.about || {};
  const nPh = (a.photos || []).length;
  html.push(`
  <section class="chapter about" data-i="1"><div class="panel">
    ${kicker(1, a.heading)}
    ${titleHTML(a.lead || a.heading)}
    <div class="stagger">${(a.paragraphs || []).map((p, i) => words(p, 'body', i * 4 + 3)).join('')}</div>
    <dl class="facts fade" style="--d:9">${(a.facts || []).map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}</dl>
    ${nPh > 1 ? `<div class="photo-nav fade" style="--d:10"><button data-action="photo-prev" data-hover aria-label="Ảnh trước">‹</button><span><b id="photoIdx">01</b> / ${pad(nPh)}</span><button data-action="photo-next" data-hover aria-label="Ảnh sau">›</button><em>Vuốt ảnh sang trái, phải để đổi</em></div>` : ''}
    ${teaser(1)}
  </div></section>`);

  const s = c.showreel || {};
  html.push(`
  <section class="chapter showreel" data-i="2"><div class="panel">
    ${kicker(2, s.subheading)}
    ${titleHTML(s.heading)}
    ${s.video
      ? `<div class="reel fade" style="--d:3"><video class="reel-video" src="${esc(s.video)}" ${s.poster ? `poster="${esc(s.poster)}"` : ''} controls playsinline preload="metadata"></video></div>
         <p class="reel-meta fade" style="--d:4"><b>${rich(s.title || '')}</b> ${rich(s.note || '')}</p>`
      : words(s.note, 'body', 3)}
    ${teaser(2)}
  </div></section>`);

  const pr = c.projects || {};
  html.push(`
  <section class="chapter projects" data-i="3"><div class="panel">
    ${kicker(3, pr.subheading)}
    ${titleHTML(pr.heading)}
    <div class="player" id="player" hidden></div>
    <ul class="project-list">
      ${(pr.items || []).map((it, i) => { const k = ICONS[it.anim] ? it.anim : ANIM_LIST[i % ANIM_LIST.length]; return `<li class="fade" style="--d:${i + 3}"><button data-project="${i}" data-hover><span class="ico ico-${k}">${ICONS[k]}</span><span class="t">${esc(plain(it.title))}</span><span class="meta">${esc(it.client)}<em class="views" data-views="${i}" hidden></em></span></button></li>`; }).join('')}
    </ul>
    ${teaser(3)}
  </div></section>`);

  const sk = c.skills || {};
  html.push(`
  <section class="chapter wide skills" data-i="4"><div class="panel" style="max-width:640px">
    ${kicker(4, sk.heading)}
    ${titleHTML(sk.heading)}
    <div class="skill-groups">${(sk.groups || []).map((g, i) => `<div class="fade" style="--d:${i * 2 + 3}"><h3>${esc(g.name)}</h3><ul>${(g.items || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>
    <div class="services">${(sk.services || []).map((x, i) => `<span class="fade" style="--d:${i + 9}">${esc(x)}</span>`).join('')}</div>
    ${teaser(4)}
  </div></section>`);

  const cl = c.clients || {};
  html.push(`
  <section class="chapter right clients" data-i="5"><div class="panel">
    ${kicker(5, cl.heading)}
    ${titleHTML(cl.heading)}
    <div class="client-groups">${(cl.groups || []).map((g, i) => `<div class="fade" style="--d:${i * 2 + 3}"><h3>${esc(g.name)}</h3><p class="client-names">${(g.items || []).map(nameOf).map((x) => (x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener" data-hover>${esc(x.name)}<i>↗</i></a>` : `<span>${esc(x.name)}</span>`)).join('<span class="sep">✦</span>')}</p></div>`).join('')}</div>
    ${cl.note ? `<p class="tip fade" style="--d:9">${rich(cl.note)}</p>` : ''}
    ${teaser(5)}
  </div></section>`);

  const ps = c.process || {};
  html.push(`
  <section class="chapter center wide process" data-i="6"><div class="panel">
    ${kicker(6, ps.heading)}
    ${titleHTML(ps.heading)}
    ${ps.lead ? words(ps.lead, 'body lead', 2) : ''}
    <div class="steps">${(ps.steps || []).map((st, i) => `<div class="step fade" style="--d:${i * 3 + 4}"><span class="n">${pad(i + 1)}</span><h3>${rich(st.title)}</h3><p>${rich(st.text)}</p></div>`).join('')}</div>
    ${ps.promise ? promiseHTML(ps.promise, 20) : ''}
    ${teaser(6)}
  </div></section>`);

  const ct = c.contact || {};
  const f = c.footer || {};
  const keySvg = '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1c4"/><stop offset=".5" stop-color="#f2c062"/><stop offset="1" stop-color="#b07422"/></linearGradient></defs><circle cx="20" cy="20" r="13" fill="none" stroke="url(#kg)" stroke-width="5"/><path d="M20 12l2.4 5 5.4.6-4 3.6 1.2 5.3L20 23.8 15 26.5l1.2-5.3-4-3.6 5.4-.6z" fill="url(#kg)"/><path d="M29 29l25 25M44 44l6-6M50 50l5-5" stroke="url(#kg)" stroke-width="5" stroke-linecap="round"/></svg>';
  html.push(`
  <section class="chapter center contact" data-i="7"><div class="panel">
    ${kicker(7, ct.heading)}
    ${titleHTML(ct.heading)}
    ${words(ct.text, 'body thanks', 2)}
    <button class="key-btn fade" style="--d:4" data-action="key" data-hover>${keySvg}<span>${esc(ct.keyHint || 'Chạm vào chiếc chìa khóa')}</span></button>
    <div class="contact-reveal" id="contactReveal" hidden>
      <div class="contact-lines">
        ${ct.email ? `<a class="contact-big" href="mailto:${esc(ct.email)}" data-hover style="--k:0">${esc(ct.email)}</a>` : ''}
        ${ct.phone ? `<a class="contact-big phone" href="tel:${esc(ct.phone.replace(/\s/g, ''))}" data-hover style="--k:1">${esc(ct.phone)}</a>` : ''}
      </div>
      <div class="socials">${(ct.socials || []).map((s, i) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" data-hover style="--k:${i + 2}">${esc(s.label)}</a>`).join('')}</div>
      <button class="pill loop-btn" data-action="loop" data-hover data-magnetic style="--k:6">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.3.8 4.3 2.1M12.5 1.5v3.2H9.3" fill="none" stroke="currentColor"/></svg>
        ${esc(ct.loopLabel || 'Xuất phát điểm')}
      </button>
    </div>
    <p class="motto fade" style="--d:6">${esc(f.motto)}</p>
    <p class="copy fade" style="--d:7">${esc(f.copyright)}</p>
  </div></section>`);

  $('#chapters').innerHTML = html.join('');
  const hex = '<svg viewBox="0 0 26 28" aria-hidden="true"><polygon points="13,1 25,7.5 25,20.5 13,27 1,20.5 1,7.5"/></svg>';
  $('#hexbar').innerHTML = CHAPTERS.map((ch, i) => `<button data-goto="${i}" data-hover aria-label="${esc(ch.label)}">${hex}<b>${pad(i + 1)}</b><span>${esc(ch.label)}</span></button>`).join('');
  $('#chapTotal').textContent = pad(COUNT);
}

// câu mô tả ở mở đầu lần lượt hiện ra
function startRotator() {
  const spans = [...document.querySelectorAll('.rotator span')];
  if (spans.length < 2) return;
  let i = 0;
  setInterval(() => {
    if (nav.active !== 0) return;
    spans[i].classList.remove('on');
    i = (i + 1) % spans.length;
    spans[i].classList.add('on');
  }, 3200);
}

function openKey() {
  const r = $('#contactReveal');
  if (!r.hidden) return;
  r.hidden = false;
  requestAnimationFrame(() => r.classList.add('show'));
  $('.key-btn')?.classList.add('used');
  if (world && world.keyOpen === 0) world.unlockKey();
}

function setPhotoIdx(i) {
  const el = $('#photoIdx');
  if (el && i >= 0) { el.textContent = pad(i + 1); el.parentElement.classList.remove('tick'); void el.offsetWidth; el.parentElement.classList.add('tick'); }
}

/* ---------------- Điều hướng ---------------- */
const nav = {
  target: 0, // đơn vị: chương (liên tục, không giới hạn → vòng lặp)
  current: 0,
  vel: 0,
  station: 0,
  lastInput: 0,
  active: -1,
};

// từ chương cuối về trang đầu: không chạy lại cả đoạn đường mà bay một shot dolly out lên không trung
function flyHome() {
  const next = nav.station + (COUNT - mod(nav.station));
  nav.station = nav.target = nav.current = next;
  nav.vel = 0;
  nav.lastInput = 0;
  resetLook();
  if (world) { world.zoom.target = 0; world.startShot('home'); }
  sound.swoosh(1.8);
  setActive(-1);
}

// đặt trạm đích; nếu đi tiếp qua chương cuối thì bay về đầu
function setStation(next) {
  if (next > nav.station && Math.floor(next / COUNT) > Math.floor(nav.station / COUNT) && mod(nav.station) === COUNT - 1) return flyHome();
  nav.station = next;
  nav.target = next;
}

// nhìn quanh tự do; khi bắt đầu di chuyển thì quay về hướng đi (theo đường ngắn nhất)
function resetLook() {
  if (!world) return;
  const w = (x) => Math.atan2(Math.sin(x), Math.cos(x));
  world.look.x = w(world.look.x);
  world.look.tx = 0;
  world.look.ty = 0;
}

function input(delta) {
  if (Math.abs(delta) > 0.002) resetLook();
  nav.target += delta;
  nav.lastInput = performance.now();
  $('#hint').classList.add('hide');
}

function snap() {
  const s = nav.target;
  const diff = s - nav.station;
  let next = nav.station;
  if (diff > 0.12) next = Math.max(nav.station + 1, Math.round(s));
  else if (diff < -0.12) next = Math.min(nav.station - 1, Math.round(s));
  setStation(next);
}

function goTo(i, forward = false) {
  const base = nav.station - (((nav.station % COUNT) + COUNT) % COUNT);
  let t = base + i;
  if (forward) { if (t <= nav.station) t += COUNT; }
  else {
    // chọn hướng ngắn nhất trên vòng tròn
    if (t - nav.station > COUNT / 2) t -= COUNT;
    if (nav.station - t > COUNT / 2) t += COUNT;
  }
  nav.lastInput = 0;
  setStation(t);
  resetLook();
  $('#hint').classList.add('hide');
  document.body.classList.remove('menu-open');
}

function setActive(i) {
  if (i === nav.active) return;
  if (nav.active >= 0 && i < 0) sound.swoosh(1); // rời một chương: tiếng lướt rất khẽ
  const prev = document.querySelector('.chapter.active');
  if (prev) {
    prev.classList.add('leaving');
    prev.classList.remove('active');
    setTimeout(() => prev.classList.remove('leaving'), 600);
  }
  nav.active = i;
  if (i >= 0) {
    const el = document.querySelector(`.chapter[data-i="${i}"]`);
    el.classList.remove('leaving');
    el.classList.add('active');
    $('#chapNum').textContent = pad(i + 1);
    $('#chapLabel').textContent = CHAPTERS[i].label;
    document.querySelector(`.hexbar [data-goto="${i}"]`)?.classList.add('visited');
    document.querySelector(`#minimap [data-st="${i}"]`)?.classList.add('visited');
    document.querySelectorAll('[data-goto]').forEach((b) => b.classList.toggle('active', +b.dataset.goto === i));
    if (i === 3) refreshViews();
  }
  document.querySelectorAll('.chapter:not(.active) video').forEach((v) => v.pause());
  if (i !== 3) closePlayer();
}

function scrollablePanel(target) {
  const p = target.closest?.('.panel, .modal');
  return p && p.scrollHeight > p.clientHeight + 2 ? p : null;
}

function bindControls() {
  const modalOpen = () => !$('#modal').hidden;
  addEventListener('wheel', (e) => {
    if (!document.body.classList.contains('entered') || modalOpen()) return;
    if (scrollablePanel(e.target)) return;
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
    // giữ Ctrl (hoặc chụm hai ngón trên touchpad) để phóng to / thu nhỏ
    if (e.ctrlKey || e.metaKey) return zoomBy(-Math.max(-60, Math.min(60, d)) * 0.05);
    if (world?.shot) return;
    input(Math.max(-60, Math.min(60, d)) * 0.0022);
  }, { passive: false });

  // chạm / kéo
  let drag = null;
  const touches = new Map();
  let pinch = null;
  addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') touches.set(e.pointerId, e); }, true);
  addEventListener('pointermove', (e) => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, e);
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      const dd = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (pinch) zoomBy((dd - pinch) * 0.03);
      pinch = dd;
      drag = null;
    }
  }, true);
  const tEnd = (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinch = null; };
  addEventListener('pointerup', tEnd, true);
  addEventListener('pointercancel', tEnd, true);
  addEventListener('pointerdown', (e) => {
    if (!document.body.classList.contains('entered') || modalOpen()) return;
    if (touches.size > 1) return;
    if (e.target.closest('button, a, video, iframe, .player, .reel, .minimap')) return;
    if (e.pointerType === 'touch' && scrollablePanel(e.target)) return; // để cuộn nội dung dài
    const hit = world?.pick(e.clientX, e.clientY);
    drag = { x: e.clientX, y: e.clientY, lx: world?.look.tx || 0, ly: world?.look.ty || 0, axis: null, moved: 0, type: e.pointerType, photo: hit?.userData.kind === 'photo' };
    $('#cursor').classList.add('drag');
  });
  addEventListener('pointermove', (e) => {
    const cur = $('#cursor');
    cur.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    if (world) {
      world.pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      if (!drag && e.pointerType === 'mouse') world.hover(e.clientX, e.clientY);
    }
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    if (drag.photo) return; // vuốt ảnh: xử lý khi thả tay
    if (drag.type === 'touch') {
      if (!drag.axis && drag.moved > 8) drag.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
      if (drag.axis === 'y') {
        input(-(e.clientY - (drag.py ?? drag.y)) * 0.0045);
        drag.py = e.clientY;
        return;
      }
    }
    if (world) {
      // xoay tự do 720°: không giới hạn ngang, ngửa lên ngắm thiên hà
      world.look.tx = drag.lx + dx * 0.0055;
      world.look.ty = Math.max(-0.6, Math.min(1.25, drag.ly + dy * 0.004));
    }
  });
  const end = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (drag.photo && Math.abs(dx) > 40 && world) setPhotoIdx(world.cyclePhoto(dx < 0 ? 1 : -1));
    else if (drag.moved < 6 && world) world.click(e.clientX, e.clientY);
    drag = null;
    $('#cursor').classList.remove('drag');
  };
  addEventListener('pointerup', end);
  addEventListener('pointercancel', end);

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return closeModal();
    if (!document.body.classList.contains('entered') || modalOpen()) return;
    if (['ArrowDown', 'PageDown', ' ', 'ArrowRight'].includes(e.key)) { e.preventDefault(); goTo((((nav.station + 1) % COUNT) + COUNT) % COUNT, true); }
    if (['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); nav.station -= 1; nav.target = nav.station; }
    if (e.key === '+' || e.key === '=') zoomBy(2);
    if (e.key === '-' || e.key === '_') zoomBy(-2);
  });

  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-goto]');
    if (g) { e.preventDefault(); goTo(+g.dataset.goto); return; }
    const p = e.target.closest('[data-project]');
    if (p) return openProject(+p.dataset.project);
    const a = e.target.closest('[data-action]');
    const act = a?.dataset.action;
    if (act === 'photo-next' && world) setPhotoIdx(world.cyclePhoto(1));
    if (act === 'photo-prev' && world) setPhotoIdx(world.cyclePhoto(-1));
    if (act === 'key') openKey();
    if (act === 'player-close') closePlayer();
    if (act === 'zoom-in') zoomBy(2.5);
    if (act === 'zoom-out') zoomBy(-2.5);
    if (act === 'zoom-reset') { if (world) world.zoom.target = 0; }
    if (act === 'sound') sound.toggle();
    if (act === 'loop') {
      goTo(0, true);
      setTimeout(() => { const r = $('#contactReveal'); if (r) { r.hidden = true; r.classList.remove('show'); } $('.key-btn')?.classList.remove('used'); if (world) world.keyOpen = 0; }, 1500);
    }
    if (e.target.closest('[data-close]')) closeModal();
  });

  // nút "nam châm" hút nhẹ theo con trỏ
  document.addEventListener('pointermove', (e) => {
    document.querySelectorAll('.chapter.active [data-magnetic]').forEach((b) => {
      const r = b.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const near = Math.hypot(dx, dy) < Math.max(r.width, 120);
      b.style.transform = near ? `translate(${dx * 0.25}px, ${dy * 0.35}px)` : '';
    });
  });

  // con trỏ tuỳ chỉnh
  if (matchMedia('(pointer: fine)').matches) {
    document.body.classList.add('has-cursor');
    document.addEventListener('mouseover', (e) => {
      $('#cursor').classList.toggle('hover', !!e.target.closest('[data-hover], a, button'));
    });
  }
}

function zoomBy(d) {
  if (!world) return;
  world.zoom.target = Math.max(-6, Math.min(10, world.zoom.target + d));
  $('#zoomCtl')?.style.setProperty('--z', ((world.zoom.target + 6) / 16).toFixed(3));
}

/* ---------------- Bản đồ nhỏ ---------------- */
let mapMarker = null, mapTrail = null, mapNear = -1;
function buildMinimap() {
  const P = (u) => world.mapPoint(u).map((v) => v * 88 + 6);
  const d = Array.from({ length: 121 }, (_, i) => P(i / 120)).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const dots = CHAPTERS.map((ch, i) => { const [x, y] = P(i / COUNT); return `<g data-st="${i}" data-goto="${i}"><circle class="halo" cx="${x}" cy="${y}" r="7"/><circle class="dot" cx="${x}" cy="${y}" r="3.6"/><text x="${x}" y="${y + 1.4}">${i + 1}</text></g>`; }).join('');
  $('#minimap').innerHTML = `<path class="route" d="${d}"/><path class="trail" id="mapTrail" d="${d}" pathLength="1"/>${dots}<g id="mapMarker"><path d="M0 0 L16 -9 A18 18 0 0 1 16 9 Z" class="cone"/><circle r="5" class="pulse"/><circle r="2.6" class="me"/></g>`;
  mapMarker = $('#mapMarker');
  mapTrail = $('#mapTrail');
}

// đồng bộ bản đồ với vị trí nhân vật: vệt sáng đã đi qua, trạm gần nhất sáng lên
function syncMinimap() {
  if (!world || !mapMarker) return;
  const u = nav.current / COUNT;
  const [x, y] = world.mapPoint(u);
  const [x2, y2] = world.mapPoint(u + 0.01);
  mapMarker.setAttribute('transform', `translate(${(x * 88 + 6).toFixed(2)} ${(y * 88 + 6).toFixed(2)}) rotate(${(Math.atan2(y2 - y, x2 - x) * 180 / Math.PI).toFixed(1)})`);
  const frac = (((u % 1) + 1) % 1);
  mapTrail.style.strokeDasharray = `${frac.toFixed(4)} 1`;
  const near = mod(Math.round(nav.current));
  if (near !== mapNear) {
    mapNear = near;
    document.querySelectorAll('#minimap [data-st]').forEach((g) => g.classList.toggle('near', +g.dataset.st === near));
  }
  $('.minimap')?.classList.toggle('moving', Math.abs(nav.target - nav.current) > 0.02);
}

/* ---------------- Lượt xem thời gian thực ---------------- */
const fmtViews = (n) => new Intl.NumberFormat('vi-VN').format(n);
let viewsT = 0, viewsData = {};
async function refreshViews(force = false) {
  if (window.__PREVIEW__ || !content?.projects?.items) return;
  if (!force && performance.now() - viewsT < 55000) return;
  viewsT = performance.now();
  const urls = content.projects.items.map((it) => it.video).filter(Boolean);
  if (!urls.length) return;
  try {
    const r = await fetch(`/api/views?u=${encodeURIComponent(urls.join('|'))}`);
    if (!r.ok) return;
    const { views } = await r.json();
    viewsData = views || {};
    content.projects.items.forEach((it, i) => {
      const n = viewsData[it.video];
      document.querySelectorAll(`[data-views="${i}"]`).forEach((el) => showViews(el, n));
    });
  } catch {}
}
function showViews(el, n) {
  if (typeof n !== 'number') { el.hidden = true; return; }
  el.hidden = false;
  const from = +(el.dataset.n || 0);
  el.dataset.n = n;
  const t0 = performance.now();
  const step = () => {
    const k = Math.min((performance.now() - t0) / 1400, 1);
    const v = Math.round(from + (n - from) * (1 - Math.pow(1 - k, 3)));
    el.innerHTML = `<i class="live"></i>${fmtViews(v)} lượt xem`;
    if (k < 1) requestAnimationFrame(step);
  };
  step();
}

/* ---------------- Trình phát video ---------------- */
function mediaHTML(it) {
  const em = toEmbed(it.video);
  if (!em) return `<div class="empty">Video đang được cập nhật</div>`;
  if (em.kind === 'video') return `<video src="${esc(em.src)}" controls autoplay playsinline></video>`;
  // bản xem thử (artifact) không cho nhúng YouTube/TikTok; trên website thật video phát ngay tại đây
  if (window.__PREVIEW__) return `<div class="empty"><b>▶</b>Bản xem thử không nhúng được ${/tiktok/.test(it.video) ? 'TikTok' : 'YouTube'}.<br>Trên website chính thức, video phát ngay tại đây.</div>`;
  return `<iframe src="${esc(em.src)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen title="${esc(it.title)}"></iframe>`;
}

function openProject(i) {
  const it = content.projects.items[i];
  if (!it) return;
  const player = $('#player');
  // xem ngay trong khung chương Dự án; nguồn gốc chỉ mở khi bấm link riêng
  if (player && nav.active === 3) {
    const em = toEmbed(it.video);
    player.className = 'player' + (em?.vertical ? ' vertical' : '');
    player.innerHTML = `
      <div class="player-media">${mediaHTML(it)}</div>
      <div class="player-info">
        <p class="meta">${[it.client, it.type].filter(Boolean).map(esc).join(' · ')}</p>
        <h3>${esc(it.title)}</h3>
        <div class="player-actions">
          ${it.video ? `<a href="${esc(it.video)}" target="_blank" rel="noopener" data-hover>Mở nguồn gốc ↗</a>` : ''}
          <button data-action="player-close" data-hover>Đóng ✕</button>
        </div>
      </div>`;
    player.hidden = false;
    duckFor(player, 'player');
    const pv = player.querySelector('.player-info .meta');
    if (pv && typeof viewsData[it.video] === 'number') { const em = document.createElement('em'); em.className = 'views'; pv.append(em); showViews(em, viewsData[it.video]); }
    document.querySelectorAll('[data-project]').forEach((b) => b.classList.toggle('on', +b.dataset.project === i));
    player.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return;
  }
  openMedia(it);
}

function closePlayer() {
  const player = $('#player');
  if (!player) return;
  player.hidden = true;
  player.innerHTML = '';
  sound.duck('player', false);
  document.querySelectorAll('[data-project].on').forEach((b) => b.classList.remove('on'));
}

function openMedia(it) {
  const media = $('#modalMedia');
  const em = toEmbed(it.video);
  media.className = 'modal-media' + (em?.vertical ? ' vertical' : '');
  media.innerHTML = mediaHTML(it).replace('<video ', '<video style="position:absolute;inset:0;width:100%;height:100%" ');
  $('#modalInfo').innerHTML = `
    <p class="meta">${[it.client, it.type, it.date].filter(Boolean).map(esc).join(' · ')}</p>
    <h2>${esc(it.title)}</h2>
    <p>${esc(it.description)}</p>
    ${it.video ? `<a href="${esc(it.video)}" target="_blank" rel="noopener" data-hover>Mở nguồn gốc ↗</a>` : ''}`;
  $('#modal').hidden = false;
  duckFor(media, 'modal');
}

// nguồn âm thanh khác đang phát: iframe (YouTube/TikTok) thì hạ nhạc suốt lúc mở; video thì theo play / pause
function duckFor(root, id) {
  const v = root.querySelector('video');
  if (v) {
    const on = () => sound.duck(id, true), off = () => sound.duck(id, false);
    v.addEventListener('play', on); v.addEventListener('pause', off); v.addEventListener('ended', off);
    if (!v.paused || v.autoplay) on();
  } else if (root.querySelector('iframe')) sound.duck(id, true);
}

function closeModal() {
  if ($('#modal').hidden) return;
  $('#modal').hidden = true;
  $('#modalMedia').innerHTML = '';
  sound.duck('modal', false);
}

/* ---------------- Khởi động ---------------- */
// Màn chờ: kéo để xoay quanh nhân vật, cuộn để lại gần / ra xa
function bindLoaderOrbit() {
  const el = $('#loader');
  let d = null;
  el.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || !world || el.classList.contains('open')) return;
    d = { x: e.clientX, y: e.clientY, t: performance.now(), v: 0 };
    el.classList.add('grab');
  });
  addEventListener('pointermove', (e) => {
    if (!d || !world) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    const now = performance.now();
    world.introAngle -= dx * 0.009;
    world.introPitch = Math.max(-0.25, Math.min(0.9, world.introPitch + dy * 0.004));
    d.v = (-dx * 0.009) / Math.max((now - d.t) / 1000, 0.008);
    d.x = e.clientX; d.y = e.clientY; d.t = now;
  });
  const up = () => { if (!d) return; if (world) world.introSpin = Math.max(-6, Math.min(6, d.v * 0.6)); d = null; el.classList.remove('grab'); };
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  el.addEventListener('wheel', (e) => { if (!world) return; e.preventDefault(); world.zoom.target = Math.max(-4, Math.min(8, world.zoom.target - e.deltaY * 0.01)); }, { passive: false });
}

async function boot() {
  const scenePromise = import('./scene.js'); // tải song song với nội dung và font
  const name = $('#loaderName');
  splitName(name, 'Anh Tú');
  const parts = { content: 0, fonts: 0, scene: 0, prep: 0, audio: 0 };
  const W = { content: 6, fonts: 10, scene: 10, prep: 56, audio: 18 };
  const progress = () => loader.set(Object.keys(W).reduce((a, k) => a + W[k] * parts[k], 0) - 0.5);
  progress();
  const t0 = performance.now();
  const raf = () => {
    if (loader.finished) return;
    loader.tick();
    const f = Math.floor((performance.now() - t0) / (1000 / 24));
    const p2 = (n) => String(n).padStart(2, '0');
    $('#timecode').textContent = `00:${p2(Math.floor(f / 1440) % 60)}:${p2(Math.floor(f / 24) % 60)}:${p2(f % 24)}`;
    requestAnimationFrame(raf);
  };
  raf();
  scenePromise.then(() => { parts.scene = 1; progress(); });

  content = window.__CONTENT__ || (await fetch('/content.json', { cache: 'no-store' }).then((r) => r.json()));
  parts.content = 1; progress();
  document.title = content.site?.title || document.title;
  document.querySelectorAll('[data-bind]').forEach((el) => { const v = get(content, el.dataset.bind); if (v) el.textContent = plain(v).normalize('NFC'); });
  if (matchMedia('(pointer: coarse)').matches) $('#hint').textContent = 'Vuốt dọc để du hành · Kéo ngang để nhìn quanh 720° · Chụm hai ngón để phóng to';
  const shortName = (content.hero?.name || 'Anh Tú').split(' ').slice(-2).join(' ');
  splitName(name, shortName);
  buildChapters(content);
  bindControls();
  bindLoaderOrbit();
  startRotator();
  if ('music' in content) sound.src = content.music || null;
  const audioP = sound.preload((k) => { parts.audio = k; progress(); }).then(() => { parts.audio = 1; progress(); });

  // nạp đủ bộ chữ tiếng Việt (Google Fonts chia theo dải ký tự) trước khi vẽ chữ lên 3D
  const VI = 'Trần Thanh Anh Tú ăâđêôơư ẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ ạảãáàặẳẵắằậẩẫấầẹẻẽéèệểễếềịỉĩíìọỏõóòộổỗốồợởỡớờụủũúùựửữứừỵỷỹýỳ';
  await Promise.race([
    Promise.all([
      document.fonts.load('300 80px "Cormorant Garamond"', VI),
      document.fonts.load('400 80px "Cormorant Garamond"', VI),
      document.fonts.load('italic 300 80px "Cormorant Garamond"', VI),
      document.fonts.load('italic 400 80px "Cormorant Garamond"', VI),
      document.fonts.load('300 30px "Be Vietnam Pro"', VI),
      document.fonts.load('400 30px "Be Vietnam Pro"', VI),
      document.fonts.load('italic 400 40px "Playfair Display"', VI),
    ]),
    new Promise((res) => setTimeout(res, 6000)),
  ]);
  parts.fonts = 1; progress();

  try {
    const { World } = await scenePromise;
    world = new World($('#scene'), content, COUNT);
    world.onProjectClick = openProject;
    world.onHotspot = (i) => goTo(i);
    if (location.search.includes('debug')) window.__world = world;
    world.onPhoto = setPhotoIdx;
    world.onKey = openKey;
    world.onPick = (kind, ud) => {
      if (kind === 'client' && ud.url) window.open(ud.url, '_blank', 'noopener');
      if (kind === 'screen') { goTo(2); setTimeout(() => $('.reel-video')?.play().catch(() => {}), 900); }
    };
    // xem showreel có tiếng thì tạm dừng bản chiếu trên màn 3D, rạp vẫn tối, nhạc nền nhỏ dần
    const rv = $('.reel-video');
    if (rv) {
      rv.addEventListener('play', () => { world.reelPaused = true; world.reelHtmlPlaying = true; sound.duck('reel', true); });
      const stop = () => { world.reelPaused = false; world.reelHtmlPlaying = false; sound.duck('reel', false); };
      rv.addEventListener('pause', stop);
      rv.addEventListener('ended', stop);
    }
    buildMinimap();
    world.onHoverChange = (h) => $('#cursor').classList.toggle('hover', h);
    world.resize();
    await world.prepare((k) => { parts.prep = k; progress(); });
  } catch (err) {
    console.warn('WebGL không khả dụng, dùng nền tĩnh.', err);
    document.body.classList.add('no-webgl');
    world = null;
  }
  parts.prep = 1; parts.scene = 1; progress();
  await Promise.race([audioP, new Promise((res) => setTimeout(res, 15000))]);
  parts.audio = 1;
  loader.set(100);
  // mọi thứ đã sẵn sàng: mở màn chờ ra cảnh 3D (không còn khung hình đen hay giật)
  $('#loader')?.classList.add('cine');

  sound.onChange((sd) => {
    const b = $('#soundBtn');
    if (!b) return;
    b.classList.toggle('off', !sd.enabled);
    b.setAttribute('aria-label', sd.enabled ? 'Tắt nhạc nền' : 'Bật nhạc nền');
  });
  document.addEventListener('visibilitychange', () => sound.duck('hidden', document.hidden));

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (nav.lastInput && now - nav.lastInput > 520) { nav.lastInput = 0; snap(); }
    const prev = nav.current;
    // nhân vật đi chậm rãi từng chặng: tăng tốc mềm, tốc độ giới hạn, chậm lại khi tới nơi
    const diff = nav.target - nav.current;
    const maxV = (reduced ? 1.6 : 0.5) + 0.35 * Math.max(0, Math.abs(diff) - 1);
    const want = Math.max(-maxV, Math.min(maxV, diff * 1.7));
    nav.vel = damp(nav.vel, want, 3.2, dt);
    nav.current += nav.vel * dt;
    // không bao giờ chạy lố qua đích rồi quay lại (tránh nhân vật nhảy sang phương tiện chặng sau)
    if (Math.sign(nav.target - nav.current) !== Math.sign(diff) || (Math.abs(nav.target - nav.current) < 0.0006 && Math.abs(nav.vel) < 0.01)) { nav.current = nav.target; nav.vel = 0; }
    const speed = (nav.current - prev) / COUNT;
    const near = Math.round(nav.current);
    const idx = Math.abs(nav.current - near) < 0.22 ? mod(near) : -1;
    // chỉ hiện nội dung ở chương đích, các chương đi ngang qua thì lướt qua (không nhấp nháy chữ)
    const dest = mod(Math.round(nav.target));
    if (document.body.classList.contains('entered')) setActive(world?.shotBusy() || idx !== dest ? -1 : idx);
    if (world) {
      const moving = Math.abs(nav.target - nav.current) > 0.02 || Math.abs(nav.vel) > 0.03;
      const back = nav.target < nav.current;
      world.travel = { active: moving, leg: back ? Math.ceil(nav.current - 1e-4) - 1 : Math.floor(nav.current + 1e-4) };
    }
    const frac = mod(nav.current) / COUNT;
    document.querySelector('.counter i').style.setProperty('--p', frac.toFixed(4));
    if (!document.hidden) world?.update(nav.current / COUNT, speed);
    syncMinimap();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  setInterval(() => { if (nav.active === 3 && !document.hidden) refreshViews(); }, 60000);

  $('#enterBtn').addEventListener('click', () => {
    loader.finished = true;
    sound.start();
    $('#loader').classList.add('open');
    if (world) { world.introTarget = 1; world.zoom.target = 0; world.startShot('in'); }
    sound.swoosh(1.4);
    setTimeout(() => document.body.classList.add('entered'), 1400);
    setTimeout(() => $('#loader')?.remove(), 2600);
  }, { once: true });
}

boot();
