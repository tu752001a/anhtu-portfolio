/* PHƯƠNG ANH TÚ · PAT — galaxy journey engine (three.js r128)
   Nội dung lấy từ content.js. File này không cần sửa khi đổi thông tin. */
(function () {
  "use strict";

  /* ======================================================================
     0. UTILS
     ====================================================================== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const ease = {
    io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    elastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => (n == null || isNaN(n) ? "—" : Math.round(n).toLocaleString("vi-VN"));
  const pad2 = (n) => String(n).padStart(2, "0");
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => window.innerWidth <= 820;
  const store = {
    get(k, d) { try { const v = localStorage.getItem("pat:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("pat:" + k, JSON.stringify(v)); } catch (e) {} },
  };

  const tweens = [];
  function tween(dur, fn, done) {
    return new Promise((res) => {
      tweens.push({ t0: performance.now(), dur: reduced ? Math.min(dur, 300) : dur, fn, done: () => { done && done(); res(); } });
    });
  }
  function runTweens(now) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      const p = clamp((now - tw.t0) / tw.dur, 0, 1);
      tw.fn(p);
      if (p >= 1) { tweens.splice(i, 1); tw.done(); }
    }
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("on"), 2200);
  }

  /* ======================================================================
     1. CONTENT (with safe defaults)
     ====================================================================== */
  const C = window.PAT_CONTENT || {};
  C.artist = C.artist || { stageName: "Phương Anh Tú", rapName: "PAT", roles: [] };
  C.tracks = (C.tracks || []).map((t, i) => Object.assign({ fx: "notes", views: {} }, t, { _i: i }));
  C.eps = C.eps || [];
  C.ads = C.ads || [];
  C.photos = (C.photos || []).filter((p) => p && p.src);
  C.socials = C.socials || [];
  C.bgMusic = Object.assign({ src: "", youtubeId: "", volume: 0.5, duckVolume: 0.08 }, C.bgMusic || {});
  if (C.bgMusic.volume > 1) C.bgMusic.volume /= 100;
  if (C.bgMusic.duckVolume > 1) C.bgMusic.duckVolume /= 100;
  C.spotify = Object.assign({ api: "/api/spotify", autoTracks: true }, C.spotify || {});
  const PENDING = "Đang cập nhật";
  const trackTitle = (t, i) => (t.title && t.title.trim()) || "Track " + pad2(i + 1);
  const hasYT = (id) => !!(id && /^[\w-]{6,}$/.test(id));

  /* ======================================================================
     2. TEXT EFFECTS (Vietnamese-safe: split by grapheme, never inside a cluster)
     ====================================================================== */
  const seg = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("vi", { granularity: "grapheme" }) : null;
  const graphemes = (s) => (seg ? Array.from(seg.segment(s.normalize("NFC")), (x) => x.segment) : Array.from(s.normalize("NFC")));
  const SCRAMBLE = "AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXYáàảãạấầẩẫậéèẻẽẹếềểễệóòỏõọốồổỗộớờởỡợúùủũụứừửữự♪♫★✦";
  const FX = ["rise", "blur", "scramble", "type", "wave", "glitch", "flip"];

  function prepText(el) {
    if (el._tx) return;
    const src = el.textContent.replace(/\s+/g, " ").trim();
    el._tx = src;
    el.setAttribute("aria-label", src);
    let i = 0;
    const words = src.split(" ");
    el.innerHTML = words
      .map((w) => '<span class="w" aria-hidden="true">' + graphemes(w).map((g) => '<span class="c" style="--i:' + i++ + '">' + esc(g) + "</span>").join("") + "</span>")
      .join(" ");
    el.classList.add("tx", "pre");
  }
  function playText(el, kind) {
    prepText(el);
    const fx = kind && kind !== "random" ? kind : pick(FX);
    el.classList.remove("go", "pre", ...FX.map((f) => "fx-" + f));
    const chars = $$(".c", el);
    clearInterval(el._iv);
    if (fx === "scramble") {
      const finals = chars.map((c) => c.textContent);
      const total = chars.length;
      let n = 0;
      chars.forEach((c) => (c.style.opacity = 1));
      el._iv = setInterval(() => {
        n += Math.max(1, total / 28);
        chars.forEach((c, k) => (c.textContent = k < n ? finals[k] : finals[k] === " " ? " " : pick(SCRAMBLE)));
        if (n >= total) { clearInterval(el._iv); chars.forEach((c, k) => (c.textContent = finals[k])); }
      }, 34);
      return;
    }
    if (fx === "type") {
      chars.forEach((c) => (c.style.opacity = 0));
      let k = 0;
      const speed = Math.max(8, Math.min(32, 1400 / chars.length));
      el._iv = setInterval(() => {
        if (k < chars.length) chars[k++].style.opacity = 1;
        else clearInterval(el._iv);
      }, speed);
      return;
    }
    chars.forEach((c) => (c.style.opacity = ""));
    el.classList.add("fx-" + fx);
    void el.offsetWidth;
    requestAnimationFrame(() => el.classList.add("go"));
  }
  function resetText(el) {
    if (!el._tx) return;
    clearInterval(el._iv);
    el.classList.remove("go", ...FX.map((f) => "fx-" + f));
    el.classList.add("pre");
    $$(".c", el).forEach((c) => (c.style.opacity = ""));
  }
  // Typewriter with a caret that tracks the text (used on the ticket)
  function typeInto(el, text, speed = 18) {
    clearInterval(el._iv);
    const g = graphemes(text);
    el.textContent = "";
    const caret = document.createElement("span");
    caret.className = "caret";
    const span = document.createElement("span");
    el.append(span, caret);
    let k = 0;
    return new Promise((res) => {
      el._iv = setInterval(() => {
        span.textContent += g[k++] || "";
        if (k >= g.length) { clearInterval(el._iv); setTimeout(() => caret.remove(), 900); res(); }
      }, reduced ? 1 : speed);
    });
  }

  /* ======================================================================
     3. AUDIO — WebAudio SFX + YouTube players driven by postMessage
     ====================================================================== */
  const SFX_GAIN = 0.32;
  const Audio = {
    ctx: null, master: null, muted: store.get("muted", false),
    init() {
      if (this.ctx) { this.ctx.resume && this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : SFX_GAIN;
      // SFX sit below every music file (songs ~-14 LUFS, bed ~-25 LUFS): low gain + a soft limiter
      const lim = this.ctx.createDynamicsCompressor(); lim.threshold.value = -30; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.002; lim.release.value = 0.2;
      this.master.connect(lim); lim.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 1.5;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    },
    setMuted(m) {
      this.muted = m;
      store.set("muted", m);
      if (this.master) this.master.gain.setTargetAtTime(m ? 0 : SFX_GAIN, this.ctx.currentTime, 0.1);
    },
    swoosh(strength = 1) {
      if (!this.ctx || this.muted) return;
      const c = this.ctx, t = c.currentTime;
      const src = c.createBufferSource(); src.buffer = this.noise;
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(320, t);
      bp.frequency.exponentialRampToValueAtTime(2600, t + 0.45);
      bp.frequency.exponentialRampToValueAtTime(500, t + 1.1);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09 * strength, t + 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
      let node = g;
      if (c.createStereoPanner) {
        const p = c.createStereoPanner();
        p.pan.setValueAtTime(-0.7, t); p.pan.linearRampToValueAtTime(0.7, t + 1.1);
        g.connect(p); node = p;
      }
      src.connect(bp); bp.connect(g); node.connect(this.master);
      src.start(t); src.stop(t + 1.2);
    },
    tone(freq, { type = "sine", dur = 1.2, vol = 0.12, attack = 0.005, when = 0, detune = 0 } = {}) {
      if (!this.ctx || this.muted) return;
      const c = this.ctx, t = c.currentTime + when;
      const o = c.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.05);
    },
    chime(n = 0) {
      const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
      const f = scale[((n % scale.length) + scale.length) % scale.length];
      this.tone(f, { type: "sine", dur: 1.6, vol: 0.08 });
      this.tone(f * 2, { type: "sine", dur: 0.8, vol: 0.025 });
    },
    piano(f) {
      this.tone(f, { type: "triangle", dur: 1.4, vol: 0.12 });
      this.tone(f * 2, { type: "sine", dur: 0.7, vol: 0.04 });
      this.tone(f * 3, { type: "sine", dur: 0.35, vol: 0.015 });
    },
    pluck(f) {
      this.tone(f, { type: "sawtooth", dur: 0.9, vol: 0.05 });
      this.tone(f * 1.005, { type: "triangle", dur: 1.4, vol: 0.08 });
    },
    unlock() { [0, 2, 4, 7].forEach((n, k) => setTimeout(() => this.chime(n), k * 110)); },
    pop() { this.tone(880, { type: "sine", dur: 0.18, vol: 0.06 }); this.tone(1320, { type: "sine", dur: 0.12, vol: 0.03, when: 0.04 }); },
    tick() { this.tone(2200, { type: "sine", dur: 0.05, vol: 0.02 }); },
  };

  // Minimal YouTube IFrame control over postMessage (no external API script needed)
  const ytPlayers = new Set();
  window.addEventListener("message", (e) => {
    if (typeof e.data !== "string" || e.data[0] !== "{") return;
    let d; try { d = JSON.parse(e.data); } catch (_) { return; }
    for (const p of ytPlayers) if (p.iframe && e.source === p.iframe.contentWindow) p._onMsg(d);
  });
  class YT {
    constructor(id, { parent, loop = false, autoplay = false, controls = 0, onState, visible = false } = {}) {
      this.id = id; this.state = -1; this.time = 0; this.dur = 0; this.onState = onState; this.ready = false;
      const origin = location.origin && location.origin !== "null" ? "&origin=" + encodeURIComponent(location.origin) : "";
      const f = document.createElement("iframe");
      f.src = "https://www.youtube.com/embed/" + id + "?enablejsapi=1&playsinline=1&rel=0&modestbranding=1&controls=" + controls +
        (loop ? "&loop=1&playlist=" + id : "") + (autoplay ? "&autoplay=1" : "") + origin;
      f.allow = "autoplay; encrypted-media; picture-in-picture";
      f.title = "YouTube";
      f.setAttribute("allowfullscreen", "");
      if (!visible) f.tabIndex = -1;
      f.addEventListener("load", () => {
        this._listen();
        let n = 0;
        this._ping = setInterval(() => { if (this.ready || ++n > 20) clearInterval(this._ping); else this._listen(); }, 300);
      });
      this.iframe = f;
      (parent || document.body).appendChild(f);
      ytPlayers.add(this);
    }
    _listen() { this._post({ event: "listening", id: this.id, channel: "widget" }); }
    _post(o) { try { this.iframe.contentWindow.postMessage(JSON.stringify(o), "*"); } catch (e) {} }
    cmd(func, args = []) { this._post({ event: "command", func, args, id: this.id, channel: "widget" }); }
    _onMsg(d) {
      if (d.event === "onReady" || d.event === "initialDelivery") this.ready = true;
      const info = d.info;
      if (d.event === "onStateChange" && typeof info === "number") this._setState(info);
      if (info && typeof info === "object") {
        this.ready = true;
        if (typeof info.playerState === "number") this._setState(info.playerState);
        if (typeof info.currentTime === "number") this.time = info.currentTime;
        if (typeof info.duration === "number" && info.duration > 0) this.dur = info.duration;
      }
    }
    _setState(s) { if (s !== this.state) { this.state = s; this.onState && this.onState(s, this); } }
    play() { this.cmd("playVideo"); }
    pause() { this.cmd("pauseVideo"); }
    volume(v) { this.cmd("setVolume", [Math.round(v)]); }
    seek(s) { this.cmd("seekTo", [s, true]); }
    destroy() { ytPlayers.delete(this); clearInterval(this._ping); this.iframe.remove(); }
  }

  // Background music: the artist's own audio file, looped, routed through a WebAudio gain
  // so it can fade smoothly (also on iOS, where <audio>.volume is read-only). YouTube is a fallback.
  const BG = {
    el: null, gain: null, player: null, vol: 0, target: 0, wanted: false, ducks: new Set(), _ready: false,
    create() {
      if (C.bgMusic.src) {
        const a = document.createElement("audio");
        a.src = C.bgMusic.src; a.loop = true; a.preload = "auto"; a.setAttribute("playsinline", "");
        a.addEventListener("canplaythrough", () => (this._ready = true), { once: true });
        a.addEventListener("error", () => (this._ready = true), { once: true });
        a.load();
        this.el = a;
        return;
      }
      if (!hasYT(C.bgMusic.youtubeId)) { this._ready = true; return; }
      const box = $("#ytbox");
      box.style.cssText = "position:fixed;left:0;bottom:0;width:220px;height:220px;opacity:0.001;pointer-events:none;z-index:-1;overflow:hidden";
      this.player = new YT(C.bgMusic.youtubeId, {
        parent: box, loop: true,
        onState: (s, p) => { if (s === 0 && this.wanted) { p.seek(0); p.play(); } },
      });
    },
    ready() { return this._ready || (this.player && this.player.ready); },
    start() {
      this.wanted = !Audio.muted;
      if (this.el && Audio.ctx && !this.gain) {
        try {
          const src = Audio.ctx.createMediaElementSource(this.el);
          this.gain = Audio.ctx.createGain(); this.gain.gain.value = 0;
          src.connect(this.gain); this.gain.connect(Audio.ctx.destination);
        } catch (e) { this.gain = null; }
      }
      this.vol = 0; this._apply();
      if (this.wanted) this._play();
      this.retarget();
    },
    _play() {
      if (this.el) { const p = this.el.play(); p && p.catch && p.catch(() => {}); }
      else if (this.player) this.player.play();
    },
    _pause() { if (this.el) this.el.pause(); else if (this.player) this.player.pause(); },
    _apply() {
      if (this.el) { if (this.gain) this.gain.gain.value = this.vol; else this.el.volume = clamp(this.vol, 0, 1); }
      else if (this.player) { const v = Math.round(this.vol * 100); if (v !== this._lastSent) { this.player.volume(v); this._lastSent = v; } }
    },
    retarget() {
      this.target = Audio.muted || !this.wanted ? 0 : this.ducks.size ? C.bgMusic.duckVolume : C.bgMusic.volume;
      if (this.wanted && !Audio.muted) this._play();
    },
    duck(key, on) { on ? this.ducks.add(key) : this.ducks.delete(key); this.retarget(); },
    tick(dt) {
      if (!this.el && !this.player) return;
      // fade down in ~0.6s when another sound starts, come back gently over ~2.5s
      const speed = this.target < this.vol ? 1.0 : 0.22;
      const before = this.vol;
      this.vol += clamp(this.target - this.vol, -speed * dt, speed * dt);
      if (before !== this.vol) this._apply();
      if (this.vol <= 0.002 && this.target === 0 && Audio.muted) this._pause();
    },
  };

  /* ======================================================================
     4. THREE — renderer, materials, textures
     ====================================================================== */
  let renderer, scene, camera, clock;
  const canvas = $("#stage");
  const interactive = []; // meshes with userData.onClick / onHover
  const updaters = []; // per-frame functions (t, dt)
  let gradTex, M = {};

  function toon(color, extra) {
    const m = new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: gradTex }, extra || {}));
    m.color.convertSRGBToLinear();
    return m;
  }
  function basic(color, extra) { const m = new THREE.MeshBasicMaterial(Object.assign({ color }, extra || {})); m.color.convertSRGBToLinear(); return m; }

  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  }
  let TEX = {};
  function makeTextures() {
    TEX.glow = canvasTex(128, 128, (g, w) => {
      const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.2, "rgba(255,230,230,.85)");
      r.addColorStop(0.45, "rgba(255,60,80,.28)"); r.addColorStop(1, "rgba(255,0,40,0)");
      g.fillStyle = r; g.fillRect(0, 0, w, w);
    });
    TEX.redGlow = canvasTex(128, 128, (g, w) => {
      const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      r.addColorStop(0, "rgba(255,70,90,.9)"); r.addColorStop(0.4, "rgba(224,16,44,.35)"); r.addColorStop(1, "rgba(224,16,44,0)");
      g.fillStyle = r; g.fillRect(0, 0, w, w);
    });
    TEX.star = canvasTex(128, 128, (g) => {
      g.translate(64, 64);
      const r = g.createRadialGradient(0, 0, 0, 0, 0, 64);
      r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.15, "rgba(255,240,240,.8)"); r.addColorStop(1, "rgba(255,40,70,0)");
      g.fillStyle = r;
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2, rr = i % 2 ? 10 : 62;
        g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.closePath(); g.fill();
      g.beginPath(); g.arc(0, 0, 9, 0, Math.PI * 2); g.fillStyle = "#fff"; g.fill();
    });
    TEX.heart = canvasTex(128, 128, (g) => {
      g.fillStyle = "#ff3a55"; g.shadowColor = "#ff3a55"; g.shadowBlur = 18;
      g.beginPath(); g.moveTo(64, 104);
      g.bezierCurveTo(10, 66, 22, 18, 64, 42); g.bezierCurveTo(106, 18, 118, 66, 64, 104); g.fill();
    });
    TEX.notes = ["♪", "♫", "♩", "♬"].map((ch) => canvasTex(128, 128, (g) => {
      g.font = "96px serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.shadowColor = "#ff2a40"; g.shadowBlur = 20; g.fillStyle = "#fff"; g.fillText(ch, 64, 70);
    }));
    TEX.pendant = canvasTex(64, 96, (g) => {
      g.fillStyle = "#c9933e"; g.fillRect(0, 0, 64, 96);
      g.fillStyle = "#2a1505"; g.font = "bold 30px Georgia"; g.textAlign = "center"; g.fillText("PAT", 32, 58);
    });
  }
  function vinylTex(label, sub) {
    return canvasTex(1024, 1024, (g, w) => {
      const c = w / 2;
      g.fillStyle = "#0b0a0d"; g.beginPath(); g.arc(c, c, c, 0, Math.PI * 2); g.fill();
      for (let r = 150; r < c - 6; r += 3) {
        g.strokeStyle = "rgba(255,255,255," + (0.02 + Math.random() * 0.05) + ")";
        g.lineWidth = 1; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.stroke();
      }
      // sheen
      const sh = g.createLinearGradient(0, 0, w, w);
      sh.addColorStop(0.35, "rgba(255,255,255,0)"); sh.addColorStop(0.5, "rgba(255,255,255,.10)"); sh.addColorStop(0.65, "rgba(255,255,255,0)");
      g.fillStyle = sh; g.beginPath(); g.arc(c, c, c - 4, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "rgba(224,16,44,.9)"; g.lineWidth = 6; g.beginPath(); g.arc(c, c, c - 4, 0, Math.PI * 2); g.stroke();
      // label
      g.fillStyle = "#e0102c"; g.beginPath(); g.arc(c, c, 150, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#f5f0ea"; g.textAlign = "center";
      g.font = "900 64px 'Big Shoulders Display', Arial"; g.fillText(label, c, c - 18);
      g.font = "500 26px 'Be Vietnam Pro', Arial"; g.fillText(sub, c, c + 30);
      g.fillStyle = "#08070a"; g.beginPath(); g.arc(c, c, 12, 0, Math.PI * 2); g.fill();
    });
  }
  function textSprite(text, { size = 46, color = "#f5f0ea", font = "'Be Vietnam Pro', Arial", weight = 600, scale = 1 } = {}) {
    const g0 = document.createElement("canvas").getContext("2d");
    g0.font = weight + " " + size + "px " + font;
    const tw = Math.ceil(g0.measureText(text).width) + 40;
    const tex = canvasTex(tw, size * 2, (g) => {
      g.font = weight + " " + size + "px " + font; g.textBaseline = "middle"; g.textAlign = "center";
      g.shadowColor = "rgba(224,16,44,.9)"; g.shadowBlur = 16; g.fillStyle = color; g.fillText(text, tw / 2, size);
    });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set((tw / (size * 2)) * scale, scale, 1);
    return sp;
  }

  /* ======================================================================
     5. WORLD — nebula, stars, galaxy, warp streaks
     ====================================================================== */
  const U = { time: { value: 0 }, tint: { value: null } };

  function buildSky() {
    U.tint.value = new THREE.Color(0x8a0a1c);
    const geo = new THREE.SphereGeometry(900, 48, 32);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { uTime: U.time, uTint: U.tint },
      vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: [
        "varying vec3 vDir; uniform float uTime; uniform vec3 uTint;",
        "float h(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }",
        "float n(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);",
        " return mix(mix(mix(h(i+vec3(0,0,0)),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),",
        "            mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }",
        "float fbm(vec3 p){ float v=0.0; float a=.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.03; a*=.5; } return v; }",
        "void main(){",
        " vec3 d = vDir; float t = uTime*0.015;",
        " vec3 q = d*2.2 + vec3(t, -t*0.6, t*0.4);",
        " float w = fbm(q + fbm(q*1.7 + t)*1.4);",
        " float band = smoothstep(0.55, 0.0, abs(d.y + 0.15*sin(d.x*3.0+t*2.0)));",
        " vec3 col = vec3(0.012,0.008,0.016);",
        " col += uTint * pow(w, 2.2) * (0.55 + band*0.9);",
        " col += vec3(1.0,0.25,0.32) * pow(w, 6.0) * band * 0.9;",
        " col += vec3(0.95,0.9,0.92) * pow(fbm(q*3.0+2.0), 8.0) * 0.5;",
        " gl_FragColor = vec4(col, 1.0);",
        "}",
      ].join("\n"),
    });
    const sky = new THREE.Mesh(geo, mat);
    sky.renderOrder = -10;
    scene.add(sky);
    updaters.push(() => sky.position.copy(camera.position));
  }

  function buildStars() {
    const N = isMobile() ? 2200 : 4200;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), ph = new Float32Array(N);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const r = rand(80, 420), th = rand(0, Math.PI * 2), u = rand(-1, 1), s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(th); pos[i * 3 + 1] = r * u; pos[i * 3 + 2] = r * s * Math.sin(th) - 50;
      c.set(Math.random() < 0.18 ? 0xff4a5c : Math.random() < 0.5 ? 0xfff2ea : 0xffffff);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      size[i] = Math.random() < 0.03 ? rand(5, 9) : rand(1, 3.2);
      ph[i] = rand(0, 100);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("size", new THREE.BufferAttribute(size, 1));
    g.setAttribute("phase", new THREE.BufferAttribute(ph, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      uniforms: { uTime: U.time, uMap: { value: TEX.glow }, uPR: { value: renderer.getPixelRatio() } },
      vertexShader: "attribute float size; attribute float phase; varying vec3 vC; varying float vA; uniform float uTime; uniform float uPR;" +
        "void main(){ vC=color; vA=0.55+0.45*sin(uTime*(0.6+fract(phase)*2.0)+phase); vec4 mv=modelViewMatrix*vec4(position,1.0);" +
        " gl_PointSize = size*uPR*(260.0/-mv.z); gl_Position=projectionMatrix*mv; }",
      fragmentShader: "uniform sampler2D uMap; varying vec3 vC; varying float vA; void main(){ vec4 t=texture2D(uMap,gl_PointCoord); gl_FragColor=vec4(vC*t.rgb, t.a*vA); }",
    });
    const pts = new THREE.Points(g, m);
    pts.frustumCulled = false;
    scene.add(pts);
    updaters.push((t) => { pts.rotation.y = t * 0.004; });
  }

  function buildGalaxy() {
    const N = isMobile() ? 3500 : 7000;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), ph = new Float32Array(N);
    const inner = new THREE.Color(0xfff4ee), outer = new THREE.Color(0xe0102c), c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const arm = i % 3, r = Math.pow(Math.random(), 1.6) * 90, a = (arm / 3) * Math.PI * 2 + r * 0.06 + rand(-0.35, 0.35) * (1 - r / 120);
      pos[i * 3] = Math.cos(a) * r + rand(-3, 3); pos[i * 3 + 1] = rand(-2.5, 2.5) * (1 - r / 100); pos[i * 3 + 2] = Math.sin(a) * r + rand(-3, 3);
      c.copy(inner).lerp(outer, clamp(r / 60, 0, 1));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      size[i] = rand(1.5, 5); ph[i] = rand(0, 100);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("size", new THREE.BufferAttribute(size, 1));
    g.setAttribute("phase", new THREE.BufferAttribute(ph, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      uniforms: { uTime: U.time, uMap: { value: TEX.glow }, uPR: { value: renderer.getPixelRatio() } },
      vertexShader: "attribute float size; attribute float phase; varying vec3 vC; varying float vA; uniform float uTime; uniform float uPR;" +
        "void main(){ vC=color; vA=0.6+0.4*sin(uTime*1.3+phase); vec4 mv=modelViewMatrix*vec4(position,1.0);" +
        " gl_PointSize = size*uPR*(300.0/-mv.z); gl_Position=projectionMatrix*mv; }",
      fragmentShader: "uniform sampler2D uMap; varying vec3 vC; varying float vA; void main(){ vec4 t=texture2D(uMap,gl_PointCoord); gl_FragColor=vec4(vC*t.rgb, t.a*vA*0.8); }",
    });
    const gal = new THREE.Points(g, m);
    gal.position.set(-160, 70, -260);
    gal.rotation.set(0.9, 0, 0.35);
    gal.frustumCulled = false;
    scene.add(gal);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffe9e4, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    core.scale.set(60, 60, 1); core.position.copy(gal.position); scene.add(core);
    updaters.push((t) => { gal.rotation.y = t * 0.02; });
  }

  let warp;
  function buildWarp() {
    const N = 700, pos = new Float32Array(N * 6);
    for (let i = 0; i < N; i++) {
      const a = rand(0, Math.PI * 2), r = rand(2.5, 22), z = rand(-130, 90), L = rand(3, 12);
      const x = Math.cos(a) * r, y = Math.sin(a) * r + 2;
      pos.set([x, y, z, x, y, z - L], i * 6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.LineBasicMaterial({ color: 0xffd6dc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    warp = new THREE.LineSegments(g, m);
    warp.frustumCulled = false;
    scene.add(warp);
  }

  /* ======================================================================
     6. INSTRUMENTS
     ====================================================================== */
  const INST = {
    mic() {
      const g = new THREE.Group();
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.022, 0.26, 14), M.black); h.position.y = -0.05; g.add(h);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.04, 0.035, 16), M.silver); ring.position.y = 0.09; g.add(ring);
      const inner = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), M.black); inner.position.y = 0.14; g.add(inner);
      const grill = new THREE.Mesh(new THREE.SphereGeometry(0.066, 12, 10), basic(0xdfe3ea, { wireframe: true })); grill.position.y = 0.14; g.add(grill);
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), basic(0xff2a40)); led.position.set(0, 0.0, 0.032); g.add(led);
      return g;
    },
    acoustic() {
      const g = new THREE.Group();
      const wood = toon(0xc98a4b), dark = toon(0x3a2416);
      const lower = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 18), wood); lower.scale.set(1, 1, 0.26); g.add(lower);
      const upper = new THREE.Mesh(new THREE.SphereGeometry(0.23, 28, 18), wood); upper.scale.set(1, 1, 0.26); upper.position.y = 0.3; g.add(upper);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 6, 40), dark); g.add(rim);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), basic(0x120a06)); hole.position.set(0, 0.16, 0.079); g.add(hole);
      const rosette = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.095, 32), basic(0xe0102c)); rosette.position.set(0, 0.16, 0.08); g.add(rosette);
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.58, 0.04), dark); neck.position.y = 0.76; g.add(neck);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.035), dark); head.position.y = 1.1; g.add(head);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.02), dark); bridge.position.set(0, -0.1, 0.08); g.add(bridge);
      g.add(strings(6, 0.05, -0.1, 1.04, 0.085));
      return g;
    },
    electric() {
      const g = new THREE.Group();
      const s = new THREE.Shape();
      s.moveTo(0, -0.34); s.bezierCurveTo(0.3, -0.36, 0.34, -0.1, 0.24, 0.02); s.bezierCurveTo(0.2, 0.1, 0.3, 0.2, 0.2, 0.3);
      s.bezierCurveTo(0.14, 0.32, 0.1, 0.2, 0.05, 0.16); s.lineTo(-0.05, 0.16); s.bezierCurveTo(-0.12, 0.28, -0.24, 0.42, -0.26, 0.22);
      s.bezierCurveTo(-0.28, 0.1, -0.2, 0.06, -0.24, 0.0); s.bezierCurveTo(-0.34, -0.12, -0.28, -0.36, 0, -0.34);
      const body = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 }), toon(0xe0102c));
      body.position.z = -0.03; g.add(body);
      const pg = new THREE.Mesh(new THREE.ShapeGeometry(s), toon(0xf6f3ee)); pg.scale.set(0.62, 0.62, 1); pg.position.set(0.04, -0.03, 0.045); g.add(pg);
      [0.0, -0.12].forEach((y) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.02), M.black); p.position.set(0, y, 0.055); g.add(p); });
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 0.035), toon(0xe7c58f)); neck.position.y = 0.48; g.add(neck);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.17, 0.03), M.black); head.position.set(0.012, 0.86, 0); head.rotation.z = -0.15; g.add(head);
      g.add(strings(6, 0.04, -0.2, 0.8, 0.05));
      return g;
    },
    bass() {
      const g = INST.electric();
      g.children[0].material = toon(0x111014);
      g.children[1].material = toon(0xe0102c);
      g.children.forEach((c) => { if (c.geometry && c.geometry.parameters && c.geometry.parameters.height === 0.62) { c.scale.y = 1.35; c.position.y = 0.6; } });
      g.children.forEach((c) => { if (c.geometry && c.geometry.parameters && c.geometry.parameters.height === 0.17) c.position.y = 1.06; });
      g.remove(g.children[g.children.length - 1]);
      g.add(strings(4, 0.035, -0.2, 1.0, 0.05));
      return g;
    },
    keytar() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.17, 0.08), toon(0xe0102c)); g.add(body);
      const keys = new THREE.Group();
      for (let i = 0; i < 15; i++) {
        const k = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.11, 0.025), M.white);
        k.position.set(-0.38 + i * 0.054, -0.01, 0.05); keys.add(k);
        if ([0, 1, 3, 4, 5].includes(i % 7) && i < 14) {
          const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.065, 0.03), M.black);
          b.position.set(-0.38 + i * 0.054 + 0.027, 0.015, 0.068); keys.add(b);
        }
      }
      g.add(keys); g.userData.keys = keys;
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.06), M.black); neck.position.set(0.6, 0.05, 0); neck.rotation.z = 0.25; g.add(neck);
      return g;
    },
    studio() {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.42), M.silver); g.add(base);
      const scr = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.4, 0.02), [M.silver, M.silver, M.silver, M.silver, basic(0xffffff, { map: dawTex() }), M.silver]);
      scr.position.set(0, 0.2, -0.21); scr.rotation.x = -0.25; g.add(scr);
      return g;
    },
  };
  function strings(n, spread, y0, y1, z) {
    const pts = [];
    for (let i = 0; i < n; i++) { const x = -spread / 2 + (spread / (n - 1)) * i; pts.push(x, y0, z, x * 0.7, y1, z); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xf2f2f2, transparent: true, opacity: 0.85 }));
  }
  let _daw;
  function dawTex() {
    if (_daw) return _daw;
    _daw = canvasTex(512, 330, (g, w, h) => {
      g.fillStyle = "#16141a"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#e0102c"; g.fillRect(0, 0, w, 26);
      g.fillStyle = "#fff"; g.font = "bold 16px Arial"; g.fillText("FL STUDIO  ·  CAKEWALK  ·  PAT SESSION", 10, 18);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 16; c++) {
        g.fillStyle = Math.random() < 0.3 ? (c % 4 === 0 ? "#ff4a5c" : "#f5f0ea") : "#2a2730";
        g.fillRect(14 + c * 30, 40 + r * 34, 24, 26);
      }
    });
    return _daw;
  }

  /* ======================================================================
     7. CHIBI PAT
     ====================================================================== */
  let PAT;
  function headPt(az, el, r) {
    return new THREE.Vector3(r * Math.cos(el) * Math.sin(az) * 1.06, r * Math.sin(el) * 0.95, r * Math.cos(el) * Math.cos(az));
  }
  function lockMesh(a, b, w, mat, flat = 0.5) {
    const dir = b.clone().sub(a); const len = dir.length(); dir.normalize();
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const nrm = mid.clone().normalize();
    const xA = new THREE.Vector3().crossVectors(dir, nrm).normalize();
    const zA = new THREE.Vector3().crossVectors(xA, dir).normalize();
    const geo = new THREE.ConeGeometry(w, len, 7, 1);
    const m = new THREE.Mesh(geo, mat);
    const basis = new THREE.Matrix4().makeBasis(xA, dir, zA);
    m.quaternion.setFromRotationMatrix(basis);
    m.position.copy(mid);
    m.scale.set(1, 1, flat);
    return m;
  }
  function chibiTextures() {
    if (TEX.anger) return;
    TEX.anger = canvasTex(128, 128, (g) => {
      g.translate(64, 64); g.strokeStyle = "#ff2340"; g.lineWidth = 13; g.lineCap = "round";
      for (let i = 0; i < 4; i++) {
        g.save(); g.rotate((i * Math.PI) / 2);
        g.beginPath(); g.moveTo(10, -40); g.quadraticCurveTo(12, -12, 40, -10); g.stroke();
        g.restore();
      }
    });
    TEX.sweat = canvasTex(96, 128, (g) => {
      const gr = g.createLinearGradient(0, 10, 0, 120); gr.addColorStop(0, "#d9f2ff"); gr.addColorStop(1, "#5cb8ff");
      g.fillStyle = gr; g.strokeStyle = "#1d6fb8"; g.lineWidth = 5;
      g.beginPath(); g.moveTo(48, 8); g.bezierCurveTo(70, 50, 86, 70, 80, 92); g.arc(48, 88, 32, 0.15, Math.PI - 0.15); g.bezierCurveTo(10, 70, 26, 50, 48, 8); g.fill(); g.stroke();
      g.fillStyle = "#fff"; g.beginPath(); g.ellipse(36, 84, 7, 12, 0.3, 0, Math.PI * 2); g.fill();
    });
    TEX.tear = canvasTex(64, 64, (g) => {
      g.fillStyle = "#7fd0ff"; g.beginPath(); g.moveTo(32, 4); g.bezierCurveTo(48, 30, 54, 40, 52, 46); g.arc(32, 44, 20, 0.1, Math.PI - 0.1); g.bezierCurveTo(10, 40, 16, 30, 32, 4); g.fill();
    });
    TEX.gloom = canvasTex(128, 128, (g) => {
      for (let i = 0; i < 9; i++) {
        const x = 10 + i * 13, h = 50 + (i % 3) * 22;
        const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(90,70,200,.85)"); gr.addColorStop(1, "rgba(90,70,200,0)");
        g.fillStyle = gr; g.fillRect(x, 0, 4, h);
      }
    });
    TEX.zzz = canvasTex(128, 128, (g) => {
      g.fillStyle = "#f5f0ea"; g.strokeStyle = "#0e0d11"; g.lineWidth = 6; g.font = "900 60px Arial"; g.textAlign = "center"; g.textBaseline = "middle";
      g.strokeText("Z", 64, 66); g.fillText("Z", 64, 66);
    });
    TEX.puff = canvasTex(128, 128, (g) => {
      g.fillStyle = "rgba(255,255,255,.9)";
      [[64, 70, 30], [40, 64, 22], [88, 64, 22], [64, 46, 22]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); });
    });
    TEX.bandaid = canvasTex(128, 48, (g) => {
      g.fillStyle = "#f0c79a"; g.beginPath(); g.roundRect ? g.roundRect(2, 2, 124, 44, 22) : g.rect(2, 2, 124, 44); g.fill();
      g.fillStyle = "#e3ad7a"; g.fillRect(44, 4, 40, 40);
      g.fillStyle = "#c98f5f"; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(52 + i * 12, 14 + j * 10, 2, 0, Math.PI * 2); g.fill(); }
    });
    TEX.capPatch = canvasTex(128, 64, (g) => {
      g.fillStyle = "#e0102c"; g.fillRect(0, 0, 128, 64);
      g.fillStyle = "#f5f0ea"; g.font = "900 40px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("PAT", 64, 34);
    });
    TEX.shield = canvasTex(96, 128, (g) => {
      const path = () => { g.beginPath(); g.moveTo(48, 6); g.lineTo(88, 18); g.quadraticCurveTo(88, 86, 48, 122); g.quadraticCurveTo(8, 86, 8, 18); g.closePath(); };
      path(); g.fillStyle = "#cfd3da"; g.fill();
      g.save(); g.translate(48, 66); g.scale(0.84, 0.84); g.translate(-48, -66); path();
      const gr = g.createLinearGradient(10, 10, 86, 120); gr.addColorStop(0, "#f2b456"); gr.addColorStop(0.5, "#b8641c"); gr.addColorStop(1, "#7a3a0c");
      g.fillStyle = gr; g.fill(); g.restore();
      g.fillStyle = "rgba(255,240,210,.95)"; g.font = "bold 30px Georgia"; g.textAlign = "center"; g.fillText("PAT", 48, 72);
    });
  }

  // Thin box (or cone strand) running from a to b, its face turned away from `center`.
  function strip(a, b, w, t, mat, center) {
    const dir = b.clone().sub(a); const len = dir.length(); dir.normalize();
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const out = mid.clone().sub(center || new THREE.Vector3()).normalize();
    const xA = new THREE.Vector3().crossVectors(dir, out).normalize();
    const zA = new THREE.Vector3().crossVectors(xA, dir).normalize();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, t), mat);
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA, dir, zA));
    m.position.copy(mid);
    return m;
  }
  function tube(points, r, mat, seg = 40) {
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), seg, r, 6, false), mat);
  }
  function roundRectShape(w, h, r) {
    const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s;
  }
  function starShape(ro, ri, n = 5) {
    const s = new THREE.Shape();
    for (let i = 0; i < n * 2; i++) { const a = Math.PI / 2 + (i * Math.PI) / n, r = i % 2 ? ri : ro; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    s.closePath(); return s;
  }
  // a flat decal hugging the head surface at head-local point p
  function decal(geo, mat, p) {
    const m = new THREE.Mesh(geo, mat); m.position.copy(p); m.lookAt(p.clone().multiplyScalar(2)); return m;
  }

  function buildChibi() {
    chibiTextures();
    const C2 = {
      blazer: toon(0x17151a), satin: toon(0x2a2630, { side: THREE.DoubleSide }), velvet: toon(0x0c0b0e), trouser: toon(0x111015),
      belt: toon(0x0a090c), skinFace: toon(0xf2c4a0), lid: basic(0x0d0b10), white: basic(0xffffff),
      tearMat: basic(0x8fd6ff, { transparent: true, opacity: 0, depthWrite: false }),
    };
    const root = new THREE.Group();
    const body = new THREE.Group(); root.add(body);
    const outline = (mesh, s = 1.045, color = 0x5a0a18) => {
      const o = new THREE.Mesh(mesh.geometry, basic(color, { side: THREE.BackSide }));
      o.scale.setScalar(s); mesh.add(o); return o;
    };

    // Legs — black trousers, black shoes
    const legs = [-1, 1].map((s) => {
      const hip = new THREE.Group(); hip.position.set(s * 0.13, 0.33, 0); body.add(hip);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.26, 14), C2.trouser); leg.position.y = -0.13; hip.add(leg);
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), M.black); shoe.scale.set(1, 0.62, 1.45); shoe.position.set(0, -0.27, 0.04); hip.add(shoe);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.03, 0.28), toon(0x2a272e)); sole.position.set(0, -0.315, 0.04); hip.add(sole);
      return hip;
    });

    // Torso — black velvet turtleneck under an open blazer with satin shawl lapels
    const TC = new THREE.Vector3(0, 0.58, 0);
    const BR = 0.345, BS = new THREE.Vector3(1.03, 1.16, 0.9), BY = 0.565;
    const blazer = new THREE.Mesh(new THREE.SphereGeometry(BR, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.93), C2.blazer);
    blazer.scale.copy(BS); blazer.position.set(0, BY, 0); body.add(blazer); outline(blazer, 1.05, 0x3a0a12);
    // a point on the blazer's front surface, lifted by `off`
    const surf = (x, y, off) => {
      const k = 1 - (x / (BR * BS.x)) ** 2 - ((y - BY) / (BR * BS.y)) ** 2;
      return new THREE.Vector3(x, y, BR * BS.z * Math.sqrt(Math.max(0, k)) + off);
    };
    const meshFrom = (rows, mat) => {
      // rows: array of [left, right] point pairs top→bottom; builds a strip of quads
      const pos = [], idx = [];
      rows.forEach(([l, r]) => pos.push(l.x, l.y, l.z, r.x, r.y, r.z));
      for (let i = 0; i < rows.length - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      return new THREE.Mesh(g, mat);
    };
    // the open V: black velvet turtleneck showing between the satin shawl lapels
    const VT = 0.94, VB = 0.4, VW = 0.15, N = 14;
    const vRows = [];
    for (let i = 0; i <= N; i++) { const y = lerp(VT, VB, i / N), w = lerp(VW, 0.005, i / N); vRows.push([surf(-w, y, 0.006), surf(w, y, 0.006)]); }
    body.add(meshFrom(vRows, toon(0x0c0b0e, { side: THREE.DoubleSide })));
    [-1, 1].forEach((s) => {
      const rows = [];
      for (let i = 0; i <= N; i++) {
        const y = lerp(VT + 0.02, VB - 0.02, i / N), w = lerp(VW, 0.005, i / N), lw = lerp(0.085, 0.035, i / N);
        const inner = surf(s * w, y, 0.012), outer = surf(s * (w + lw), y - 0.01, 0.012);
        rows.push(s < 0 ? [outer, inner] : [inner, outer]);
      }
      body.add(meshFrom(rows, C2.satin));
      // satin edge highlight
      const pts = []; for (let i = 0; i <= N; i++) { const y = lerp(VT + 0.02, VB - 0.02, i / N); pts.push(surf(s * (lerp(VW, 0.005, i / N) + 0.004), y, 0.016)); }
      body.add(tube(pts, 0.004, basic(0x5a5560), 30));
    });
    // pocket line on the left chest
    const pocket = tube([surf(0.2, 0.68, 0.01), surf(0.25, 0.69, 0.01), surf(0.3, 0.7, 0.01)], 0.006, basic(0x3a3640), 8); body.add(pocket);
    // belt + silver buckle, seen through the open front
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.012), toon(0x5d6168)); buckle.position.copy(surf(0, 0.36, 0.006)); body.add(buckle);
    
    // turtleneck collar (no skin at the neck)
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.2, 18), C2.velvet); neck.position.y = 0.93; body.add(neck);
    const roll = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.035, 8, 24), C2.velvet); roll.rotation.x = Math.PI / 2; roll.position.y = 0.99; body.add(roll);
    // long silver chain with the amber PAT shield
    const chain = tube([
      new THREE.Vector3(-0.13, 0.99, 0.03), new THREE.Vector3(-0.125, 0.9, 0.13), surf(-0.08, 0.75, 0.02), surf(-0.035, 0.62, 0.022),
      surf(0, 0.57, 0.024), surf(0.035, 0.62, 0.022), surf(0.08, 0.75, 0.02), new THREE.Vector3(0.125, 0.9, 0.13), new THREE.Vector3(0.13, 0.99, 0.03),
    ], 0.006, M.silver, 60);
    body.add(chain);
    const pendant = new THREE.Group(); pendant.position.copy(surf(0, 0.51, 0.03)); pendant.rotation.x = -0.25; body.add(pendant);
    const bail = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 6, 14), M.silver); bail.position.y = 0.05; pendant.add(bail);
    const shield = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.1), basic(0xffffff, { map: TEX.shield, transparent: true, side: THREE.DoubleSide }));
    shield.position.z = 0.004; pendant.add(shield);
    const chestHolder = new THREE.Group(); chestHolder.position.set(0, 0.56, 0.36); body.add(chestHolder);

    // Arms — plain blazer sleeves
    const mkArm = (s) => {
      const sh = new THREE.Group(); sh.position.set(s * 0.31, 0.8, 0); body.add(sh);
      const pad = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 10), C2.blazer); pad.scale.set(1, 0.8, 1); sh.add(pad);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.115, 0.36, 14), C2.blazer); sleeve.position.y = -0.18; sh.add(sleeve); outline(sleeve, 1.08, 0x3a0a12);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.05, 14), C2.velvet); cuff.position.y = -0.375; sh.add(cuff);
      const hand = new THREE.Group(); hand.position.y = -0.43; sh.add(hand);
      const palm = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), M.skin); hand.add(palm);
      return { sh, hand };
    };
    const armR = mkArm(-1), armL = mkArm(1);

    // Head
    const head = new THREE.Group(); head.position.y = 1.24; body.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.52, 40, 30), C2.skinFace); skull.scale.set(1.06, 0.95, 1); head.add(skull); outline(skull, 1.03, 0x3a0a12);
    [-1, 1].forEach((s) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), M.skin); ear.scale.set(0.55, 1, 0.8); ear.position.set(s * 0.555, -0.07, -0.02); head.add(ear);
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.009, 8, 20), M.silver); hoop.position.set(s * 0.585, -0.17, 0.0); hoop.rotation.y = Math.PI / 2; head.add(hoop);
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.09, 8), M.silver); spike.rotation.x = Math.PI; spike.position.set(s * 0.585, -0.255, 0.0); head.add(spike);
      head.userData["ear" + s] = { hoop, spike };
    });

    // Eyes: one group per eye holding every expression shape
    const eyes = [-1, 1].map((s) => {
      const g = new THREE.Group(); g.position.set(s * 0.19, -0.05, 0.462); g.rotation.y = s * 0.33; head.add(g);
      const open = new THREE.Group(); g.add(open);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.078, 18, 14), M.eye); e.scale.set(0.95, 1.0, 0.45); open.add(e);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.026, 0.05), C2.lid); lid.position.set(0, 0.07, 0.01); lid.rotation.z = -s * 0.1; open.add(lid);
      const lash = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.016, 0.04), C2.lid); lash.position.set(s * 0.1, 0.055, 0.01); lash.rotation.z = -s * 0.5; open.add(lash);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), C2.white); hl.position.set(-0.022, 0.03, 0.03); open.add(hl);
      const hl2 = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), C2.white); hl2.position.set(0.02, -0.03, 0.03); open.add(hl2);
      const arcGeo = new THREE.TorusGeometry(0.058, 0.013, 6, 18, Math.PI);
      const happy = new THREE.Mesh(arcGeo, M.eye); happy.position.y = -0.02; g.add(happy);
      const closed = new THREE.Mesh(arcGeo, M.eye); closed.rotation.z = Math.PI; closed.position.y = 0.03; g.add(closed);
      const squeeze = new THREE.Group(); g.add(squeeze);
      [1, -1].forEach((k) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.022, 0.02), M.eye); b.position.set(0, k * 0.022, 0); b.rotation.z = k * s * 0.5; squeeze.add(b); });
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), M.eye); g.add(dot);
      const heart = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.heart, transparent: true, depthWrite: false })); heart.scale.set(0.2, 0.2, 1); heart.position.z = 0.04; g.add(heart);
      const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.star, transparent: true, depthWrite: false })); star.scale.set(0.2, 0.2, 1); star.position.z = 0.05; g.add(star);
      g.userData = { open, happy, closed, squeeze, dot, heart, star, lid };
      return g;
    });
    const brows = [-1, 1].map((s) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.026, 0.03), M.hair); b.position.set(s * 0.19, 0.1, 0.48); b.rotation.set(0, s * 0.33, s * 0.06); head.add(b); return b;
    });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), toon(0xe2a77f)); nose.position.set(0, -0.11, 0.505); head.add(nose);
    // mouths
    const mouths = new THREE.Group(); mouths.position.set(0, -0.21, 0.472); head.add(mouths);
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 6, 16, Math.PI), M.mouth); smile.rotation.z = Math.PI; mouths.add(smile);
    const frown = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 6, 16, Math.PI), M.mouth); frown.position.y = -0.03; mouths.add(frown);
    const flat = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.014, 0.02), M.mouth); mouths.add(flat);
    const mouthO = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), M.mouth); mouthO.scale.set(0.9, 0.4, 0.4); mouths.add(mouthO);
    const grin = new THREE.Group(); mouths.add(grin);
    const grinM = new THREE.Mesh(new THREE.CircleGeometry(0.075, 20, Math.PI, Math.PI), M.mouth); grinM.position.y = 0.015; grin.add(grinM);
    const tongue = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16, Math.PI, Math.PI), basic(0xff7a8a)); tongue.position.set(0, -0.035, 0.004); tongue.scale.y = 0.6; grin.add(tongue);
    const wobPts = []; for (let i = 0; i <= 12; i++) wobPts.push(new THREE.Vector3(-0.06 + i * 0.01, Math.sin(i * 1.6) * 0.012, 0));
    const wobble = tube(wobPts, 0.009, M.mouth, 24); mouths.add(wobble);
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.025, 4), C2.white); fang.rotation.z = Math.PI; fang.position.set(0.02, -0.01, 0.01); frown.add(fang);
    const mouthSet = { smile, frown, flat, mouthO, grin, wobble };
    const blushMat = basic(0xff6f86, { transparent: true, opacity: 0.4, depthWrite: false });
    const blushes = [-1, 1].map((s) => {
      const p = new THREE.Vector3(s * 0.31, -0.16, 0.415);
      const b = decal(new THREE.CircleGeometry(0.075, 24), blushMat, p); b.scale.set(1.25, 0.8, 1); head.add(b); return b;
    });
    // emotion effects
    const tears = [-1, 1].map((s) => {
      const p = new THREE.Vector3(s * 0.22, -0.27, 0.43);
      const t = decal(new THREE.PlaneGeometry(0.06, 0.26), C2.tearMat, p); t.rotation.z += s * 0.1; head.add(t); return t;
    });
    const fxSprite = (tex, x, y, z, sc) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); sp.position.set(x, y, z); sp.scale.set(sc, sc, 1); sp.visible = false; head.add(sp); return sp; };
    const fx = {
      anger: fxSprite(TEX.anger, 0.42, 0.5, 0.25, 0.3),
      sweat: fxSprite(TEX.sweat, -0.5, 0.25, 0.3, 0.2),
      gloom: fxSprite(TEX.gloom, 0, 0.32, 0.56, 0.6),
      zzz: fxSprite(TEX.zzz, 0.5, 0.6, 0.1, 0.22),
    };
    fx.sweat.scale.set(0.16, 0.22, 1);

    // Hair — full black, rounded top, curtain fringe from a near-centre part down over the forehead
    const hair = new THREE.Group(); head.add(hair);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.585, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), M.hair);
    cap.scale.set(1.1, 1.12, 1.07); cap.position.y = 0.02; cap.rotation.x = -0.42; hair.add(cap); outline(cap, 1.03, 0x6a0c1c);
    const nape = new THREE.Mesh(new THREE.SphereGeometry(0.575, 32, 16, Math.PI * 0.8, Math.PI * 1.4, Math.PI * 0.3, Math.PI * 0.42), M.hair);
    nape.scale.set(1.08, 0.98, 1.04); hair.add(nape);
    const L = (az1, el1, az2, el2, w, r1 = 0.62, r2 = 0.62, flat = 0.5) => hair.add(lockMesh(headPt(az1, el1, r1), headPt(az2, el2, r2), w, M.hair, flat));
    // fringe: chunky separated strands fan out from the part and fall to just above the brows
    const part = -0.12;
    for (let i = 0; i < 13; i++) {
      const az = lerp(-1.05, 1.0, i / 12), side = az < part ? -1 : 1;
      const endEl = 0.13 + (i % 3) * 0.05 + Math.min(0.1, Math.abs(az - part) * 0.04);
      L(part + side * 0.1, 1.0, az + side * 0.1, endEl, 0.19, 0.71, 0.58, 0.45);
    }
    // a top layer for volume, its tips sitting a little higher
    [-0.75, -0.35, 0.05, 0.42, 0.8].forEach((az) => L(part, 1.1, az, 0.3, 0.2, 0.74, 0.62, 0.45));
    // sides cover the top of the ears
    [-1, 1].forEach((s) => {
      L(s * 1.0, 0.55, s * 1.3, 0.0, 0.15, 0.62, 0.62);
      L(s * 1.25, 0.5, s * 1.52, -0.1, 0.14, 0.62, 0.6);
      L(s * 1.5, 0.45, s * 1.75, -0.12, 0.13, 0.62, 0.59);
    });
    // back
    for (let i = 0; i < 8; i++) { const az = Math.PI + (i - 3.5) * 0.3; L(az, 0.6, az + rand(-0.1, 0.1), -0.28, 0.16, 0.62, 0.58); }
    // messy textured top
    for (let i = 0; i < 18; i++) {
      const az = rand(-Math.PI, Math.PI), el = rand(0.75, 1.2);
      L(az, el, az + rand(-0.4, 0.4), el + rand(0.05, 0.2), rand(0.08, 0.12), 0.62, rand(0.68, 0.72), 0.55);
    }

    // Studio headphones (shown with the studio instrument unless a hat is worn)
    const headphones = new THREE.Group(); head.add(headphones);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.045, 8, 32, Math.PI), M.black); band.position.y = 0.04; headphones.add(band);
    [-1, 1].forEach((s) => { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 20), toon(0xe0102c)); cup.rotation.z = Math.PI / 2; cup.position.set(s * 0.64, 0.0, 0); headphones.add(cup); });
    headphones.visible = false;

    const P = {
      root, body, head, legs, armL, armR, eyes, brows, mouths: mouthSet, smile, mouthO, blushes, blushMat, headphones, hair, chestHolder,
      faceMat: C2.skinFace, tearMat: C2.tearMat, tears, fx,
      inst: {}, cur: "mic", acting: null, actT: 0, emo: null, emoT: 0, walk: 0, walking: false, blinkT: 2, look: new THREE.Vector2(),
      slots: {}, acc: {},
    };
    P.anchors = { head, face: head, neck: body, back: body, hand: armL.hand, float: root };
    // instruments
    const mic = INST.mic(); mic.position.set(0, -0.02, 0.02); mic.rotation.x = Math.PI * 0.95; armR.hand.add(mic); P.inst.mic = mic;
    const ac = INST.acoustic(); ac.position.set(0.0, -0.08, 0.06); ac.rotation.set(0.15, 0, -1.05); ac.scale.setScalar(0.92); chestHolder.add(ac); P.inst.acoustic = ac;
    const el = INST.electric(); el.position.set(0.0, -0.06, 0.04); el.rotation.set(0.1, 0, -1.0); el.scale.setScalar(0.95); chestHolder.add(el); P.inst.electric = el;
    const kt = INST.keytar(); kt.position.set(0.02, -0.02, 0.06); kt.rotation.set(0.25, 0, -0.18); kt.scale.setScalar(0.85); chestHolder.add(kt); P.inst.keytar = kt;
    const bs = INST.bass(); bs.position.set(0.0, -0.1, 0.04); bs.rotation.set(0.1, 0, -1.08); bs.scale.setScalar(0.95); chestHolder.add(bs); P.inst.bass = bs;
    const st = INST.studio(); st.position.set(0, -0.12, 0.2); st.scale.setScalar(0.85); chestHolder.add(st); P.inst.studio = st;
    Object.values(P.inst).forEach((o) => { o.visible = false; o.userData.s = o.scale.x; });
    P.inst.mic.visible = true;
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), basic(0x000000, { transparent: true, opacity: 0.45, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.005; root.add(shadow); P.shadow = shadow;
    root.scale.setScalar(1.15);

    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 1.9, 10), basic(0xffffff, { visible: false }));
    hit.position.y = 0.95; root.add(hit);
    hit.userData.onClick = () => (Math.random() < 0.45 ? emote() : act());
    hit.userData.hoverScale = false;
    interactive.push(hit);
    return P;
  }

  /* ---------- 30 accessories ---------- */
  const ACC_SLOTS = [
    { key: "head", label: "Mũ & tóc" }, { key: "face", label: "Mặt" }, { key: "neck", label: "Cổ" },
    { key: "back", label: "Lưng" }, { key: "hand", label: "Tay" }, { key: "float", label: "Bạn đồng hành" },
  ];
  const ACC = (() => {
    const red = () => toon(0xe0102c), blk = () => toon(0x111014), wht = () => toon(0xf6f3ee), gold = () => toon(0xd9a441);
    const hemi = (r, mat, sy = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat); m.scale.y = sy; return m; };
    const wingShape = (devil) => {
      const s = new THREE.Shape(); s.moveTo(0, 0);
      if (devil) { s.bezierCurveTo(0.2, 0.25, 0.5, 0.45, 0.62, 0.4); s.lineTo(0.5, 0.18); s.lineTo(0.56, 0.02); s.lineTo(0.4, -0.04); s.lineTo(0.38, -0.2); s.lineTo(0.22, -0.12); s.lineTo(0.1, -0.22); s.closePath(); }
      else { s.bezierCurveTo(0.15, 0.3, 0.45, 0.5, 0.66, 0.42); s.bezierCurveTo(0.6, 0.3, 0.62, 0.22, 0.56, 0.16); s.bezierCurveTo(0.6, 0.06, 0.5, 0.0, 0.46, -0.04); s.bezierCurveTo(0.44, -0.14, 0.32, -0.16, 0.26, -0.18); s.bezierCurveTo(0.18, -0.26, 0.06, -0.2, 0, 0); }
      return s;
    };
    const wings = (devil) => {
      const g = new THREE.Group(); g.position.set(0, 0.72, -0.27);
      const mat = devil ? toon(0x9c0d22, { side: THREE.DoubleSide }) : basic(0xffffff, { side: THREE.DoubleSide });
      const geo = new THREE.ShapeGeometry(wingShape(devil));
      g.userData.w = [-1, 1].map((s) => {
        const pivot = new THREE.Group(); pivot.position.x = s * 0.06; g.add(pivot);
        const w = new THREE.Mesh(geo, mat); w.scale.set(s * 1.05, 1.05, 1); pivot.add(w);
        if (!devil) { const o = new THREE.Mesh(geo, basic(0xffc9d2, { side: THREE.BackSide })); w.add(o); o.position.z = -0.005; o.scale.setScalar(1.04); }
        return pivot;
      });
      g.userData.tick = (t) => g.userData.w.forEach((p, i) => (p.rotation.y = (i ? -1 : 1) * (0.5 + Math.sin(t * (devil ? 7 : 4)) * 0.35)));
      return g;
    };
    return [
      // HEAD (10)
      { id: "beanie", slot: "head", name: "Mũ len đỏ", icon: "🧶", build() {
        const g = new THREE.Group(); const m = red();
        const c = hemi(0.68, m, 0.95); c.position.y = 0.16; c.rotation.x = -0.12; g.add(c);
        const fold = new THREE.Mesh(new THREE.CylinderGeometry(0.71, 0.72, 0.17, 32), toon(0xb80c24)); fold.position.y = 0.22; fold.rotation.x = -0.12; g.add(fold);
        const pom = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), wht()); pom.position.set(0, 0.86, -0.1); g.add(pom); return g; } },
      { id: "snapback", slot: "head", name: "Snapback PAT", icon: "🧢", build() {
        const g = new THREE.Group();
        const c = hemi(0.68, blk(), 0.82); c.position.y = 0.2; c.rotation.x = -0.1; g.add(c);
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 24), red()); brim.scale.z = 1.1; brim.position.set(0, 0.27, 0.62); brim.rotation.x = 0.18; g.add(brim);
        const patch = decal(new THREE.PlaneGeometry(0.34, 0.17), basic(0xffffff, { map: TEX.capPatch }), new THREE.Vector3(0, 0.46, 0.58)); g.add(patch); return g; } },
      { id: "bucket", slot: "head", name: "Mũ bucket", icon: "👒", build() {
        const g = new THREE.Group(); const m = blk(); m.side = THREE.DoubleSide;
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.69, 0.42, 32), m); crown.position.y = 0.48; g.add(crown);
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.69, 0.95, 0.14, 32, 1, true), m); brim.position.y = 0.22; g.add(brim);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.68, 0.06, 32, 1, true), red()); band.material.side = THREE.DoubleSide; band.position.y = 0.33; g.add(band);
        g.rotation.x = -0.1; return g; } },
      { id: "crown", slot: "head", name: "Vương miện sao", icon: "👑", build() {
        const g = new THREE.Group(); const m = gold(); m.side = THREE.DoubleSide;
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.12, 24, 1, true), m); g.add(ring);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2; const s = new THREE.Mesh(new THREE.ShapeGeometry(starShape(0.08, 0.035)), m);
          s.position.set(Math.sin(a) * 0.35, 0.13, Math.cos(a) * 0.35); s.rotation.y = a; g.add(s);
          const gem = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), basic(0xe0102c)); gem.position.set(Math.sin(a) * 0.365, 0, Math.cos(a) * 0.365); g.add(gem);
        }
        g.position.set(0.08, 0.66, 0); g.rotation.z = -0.18; return g; } },
      { id: "phones", slot: "head", name: "Tai nghe đỏ", icon: "🎧", build() {
        const g = new THREE.Group();
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.05, 8, 32, Math.PI), wht()); band.position.y = 0.04; g.add(band);
        [-1, 1].forEach((s) => { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 20), red()); cup.rotation.z = Math.PI / 2; cup.position.set(s * 0.66, 0, 0); g.add(cup); });
        return g; } },
      { id: "headband", slot: "head", name: "Băng đô nơ", icon: "🎀", build() {
        const g = new THREE.Group();
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.035, 8, 32, Math.PI), red()); band.rotation.x = -0.45; g.add(band);
        const bow = new THREE.Group(); bow.position.set(0.32, 0.56, 0.25); bow.rotation.set(-0.4, 0.3, -0.5); g.add(bow);
        [-1, 1].forEach((s) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 12), red()); c.rotation.z = s * Math.PI / 2; c.position.x = s * 0.09; c.scale.z = 0.5; bow.add(c); });
        bow.add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), toon(0xb80c24))); return g; } },
      { id: "horns", slot: "head", name: "Sừng quỷ nhỏ", icon: "😈", build() {
        const g = new THREE.Group();
        [-1, 1].forEach((s) => { const h = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 12), red()); h.position.copy(headPt(s * 0.5, 0.95, 0.7)); h.rotation.z = -s * 0.45; g.add(h); });
        return g; } },
      { id: "catears", slot: "head", name: "Tai mèo", icon: "🐱", build() {
        const g = new THREE.Group();
        [-1, 1].forEach((s) => {
          const e = new THREE.Group(); e.position.copy(headPt(s * 0.62, 0.9, 0.7)); e.rotation.z = -s * 0.5; g.add(e);
          const o = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.28, 3), blk()); o.scale.z = 0.5; e.add(o);
          const i2 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 3), toon(0xff8fa3)); i2.position.set(0, -0.03, 0.04); i2.scale.z = 0.3; e.add(i2);
        });
        return g; } },
      { id: "halo", slot: "head", name: "Vầng hào quang", icon: "😇", build() {
        const g = new THREE.Group(); const r = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.04, 10, 36), basic(0xffd36b)); r.rotation.x = Math.PI / 2 - 0.25; g.add(r);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffd36b, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 })); glow.scale.set(1.1, 0.6, 1); g.add(glow);
        g.position.y = 0.92; g.userData.tick = (t) => (g.position.y = 0.92 + Math.sin(t * 2) * 0.04); return g; } },
      { id: "fedora", slot: "head", name: "Mũ fedora", icon: "🎩", build() {
        const g = new THREE.Group();
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.67, 0.44, 32), blk()); crown.position.y = 0.55; g.add(crown);
        const dent = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.8), toon(0x1c1a20)); dent.position.y = 0.77; g.add(dent);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.645, 0.66, 0.09, 32, 1, true), red()); band.material.side = THREE.DoubleSide; band.position.y = 0.38; g.add(band);
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.03, 40), blk()); brim.position.y = 0.33; g.add(brim);
        g.rotation.set(-0.08, 0, -0.12); return g; } },
      // FACE (6)
      { id: "yellowglasses", slot: "face", name: "Kính vàng", icon: "🕶️", build() {
        const g = new THREE.Group();
        [-1, 1].forEach((s) => {
          const lg = new THREE.Group(); lg.position.set(s * 0.19, -0.03, 0.545); lg.rotation.y = s * 0.28; g.add(lg);
          const outer = roundRectShape(0.29, 0.21, 0.06); outer.holes.push(roundRectShape(0.245, 0.165, 0.045));
          lg.add(new THREE.Mesh(new THREE.ShapeGeometry(outer), basic(0xf6f3ee, { side: THREE.DoubleSide })));
          lg.add(new THREE.Mesh(new THREE.ShapeGeometry(roundRectShape(0.25, 0.17, 0.045)), M.lens));
          const temple = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.02, 0.5), basic(0xf6f3ee)); temple.position.set(s * 0.14, 0.05, -0.24); temple.rotation.y = -s * 0.12; lg.add(temple);
        });
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.026, 0.02), basic(0xf6f3ee)); bar.position.set(0, 0.085, 0.56); g.add(bar);
        return g; } },
      { id: "shades", slot: "face", name: "Kính đen ngầu", icon: "😎", build() {
        const g = new THREE.Group();
        [-1, 1].forEach((s) => {
          const lg = new THREE.Mesh(new THREE.ShapeGeometry(roundRectShape(0.27, 0.15, 0.06)), basic(0x050406, { side: THREE.DoubleSide })); lg.position.set(s * 0.19, -0.03, 0.55); lg.rotation.y = s * 0.28; g.add(lg);
          const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.12), basic(0xffffff, { transparent: true, opacity: 0.35 })); sh.position.set(-0.06, 0, 0.003); sh.rotation.z = -0.6; lg.add(sh);
        });
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.02), basic(0x050406)); bar.position.set(0, 0.04, 0.56); g.add(bar);
        return g; } },
      { id: "roundglasses", slot: "face", name: "Kính tròn gọng vàng", icon: "👓", build() {
        const g = new THREE.Group(); const m = basic(0xd9a441);
        [-1, 1].forEach((s) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.012, 8, 28), m); r.position.set(s * 0.19, -0.04, 0.55); r.rotation.y = s * 0.3; g.add(r); });
        const br = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 12, Math.PI), m); br.position.set(0, -0.02, 0.57); g.add(br);
        return g; } },
      { id: "mask", slot: "face", name: "Khẩu trang đen", icon: "😷", build() {
        const g = new THREE.Group();
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.535, 24, 12, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.53, Math.PI * 0.2), toon(0x141317, { side: THREE.DoubleSide }));
        m.scale.set(1.08, 0.97, 1.04); m.rotation.y = 0; g.add(m);
        [-1, 1].forEach((s) => { const st = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.008, 6, 16, Math.PI), M.white); st.position.set(s * 0.5, -0.1, 0.08); st.rotation.set(0, Math.PI / 2, s * 0.3); g.add(st); });
        return g; } },
      { id: "bandaid", slot: "face", name: "Băng cá nhân", icon: "🩹", build() {
        const b = decal(new THREE.PlaneGeometry(0.2, 0.075), basic(0xffffff, { map: TEX.bandaid, transparent: true }), headPt(-0.5, -0.25, 0.535)); b.rotation.z += 0.5; return b; } },
      { id: "sticker", slot: "face", name: "Sticker ngôi sao", icon: "⭐", build() {
        const s = decal(new THREE.ShapeGeometry(starShape(0.06, 0.026)), basic(0xffd36b, { side: THREE.DoubleSide }), headPt(0.55, -0.22, 0.54)); return s; } },
      // NECK (4)
      { id: "scarf", slot: "neck", name: "Khăn quàng đỏ", icon: "🧣", build() {
        const g = new THREE.Group();
        const r = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.075, 10, 28), red()); r.rotation.x = Math.PI / 2; r.position.y = 0.95; g.add(r);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.05), red()); tail.position.set(-0.13, 0.78, 0.25); tail.rotation.set(-0.25, 0, 0.2); g.add(tail);
        const fr = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.05), wht()); fr.position.y = -0.18; tail.add(fr); return g; } },
      { id: "bowtie", slot: "neck", name: "Nơ cổ đỏ", icon: "🎀", build() {
        const g = new THREE.Group(); g.position.set(0, 0.86, 0.19);
        [-1, 1].forEach((s) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), red()); c.rotation.z = s * Math.PI / 2; c.position.x = s * 0.055; c.scale.z = 0.5; g.add(c); });
        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), toon(0xb80c24))); return g; } },
      { id: "goldchain", slot: "neck", name: "Dây chuyền vàng", icon: "📿", build() {
        const g = new THREE.Group();
        g.add(tube([new THREE.Vector3(-0.14, 0.96, 0.05), new THREE.Vector3(-0.12, 0.84, 0.21), new THREE.Vector3(0, 0.76, 0.27), new THREE.Vector3(0.12, 0.84, 0.21), new THREE.Vector3(0.14, 0.96, 0.05)], 0.014, gold()));
        const med = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 20), gold()); med.rotation.x = Math.PI / 2 - 0.3; med.position.set(0, 0.72, 0.28); g.add(med); return g; } },
      { id: "choker", slot: "neck", name: "Choker bạc", icon: "⛓️", build() {
        const g = new THREE.Group();
        const c = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.02, 8, 28), blk()); c.rotation.x = Math.PI / 2; c.position.y = 0.95; g.add(c);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 14), M.silver); ring.position.set(0, 0.92, 0.15); g.add(ring); return g; } },
      // BACK (5)
      { id: "angelwings", slot: "back", name: "Cánh thiên thần", icon: "🪽", build() { return wings(false); } },
      { id: "devilwings", slot: "back", name: "Cánh ác quỷ", icon: "🦇", build() { return wings(true); } },
      { id: "backpack", slot: "back", name: "Balo đỏ", icon: "🎒", build() {
        const g = new THREE.Group();
        const bag = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), red()); bag.scale.set(1, 1.15, 0.6); bag.position.set(0, 0.6, -0.36); g.add(bag);
        const pk = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.08), toon(0xb80c24)); pk.position.set(0, 0.5, -0.5); g.add(pk);
        const patch = new THREE.Mesh(new THREE.ShapeGeometry(starShape(0.05, 0.022)), basic(0xffffff)); patch.position.set(0, 0.68, -0.52); patch.rotation.y = Math.PI; g.add(patch);
        [-1, 1].forEach((s) => g.add(strip(new THREE.Vector3(s * 0.17, 0.86, 0.05), new THREE.Vector3(s * 0.17, 0.42, 0.24), 0.05, 0.02, blk(), new THREE.Vector3(0, 0.6, 0))));
        return g; } },
      { id: "backguitar", slot: "back", name: "Guitar sau lưng", icon: "🎸", build() {
        const g = INST.acoustic(); g.scale.setScalar(0.85); g.position.set(0, 0.55, -0.36); g.rotation.set(0, Math.PI, 0.7); return g; } },
      { id: "cape", slot: "back", name: "Áo choàng đỏ", icon: "🦸", build() {
        const g = new THREE.Group();
        const geo = new THREE.PlaneGeometry(0.72, 0.85, 8, 10); geo.translate(0, -0.425, 0);
        const m = new THREE.Mesh(geo, toon(0xc00c26, { side: THREE.DoubleSide })); m.position.set(0, 0.92, -0.25); m.rotation.x = 0.22; g.add(m);
        const base = geo.attributes.position.array.slice();
        g.userData.tick = (t) => {
          const p = geo.attributes.position;
          for (let i = 0; i < p.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; p.setX(i, x * (1 + -y * 0.5)); p.setZ(i, Math.sin(t * 4 + x * 6 - y * 5) * 0.04 * -y - y * y * 0.15); }
          p.needsUpdate = true;
        };
        return g; } },
      // HAND (3)
      { id: "balloon", slot: "hand", anchor: "float", name: "Bóng bay ngôi sao", icon: "🎈", build() {
        const g = new THREE.Group();
        const b = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(0.22, 0.1), { depth: 0.06, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 }), toon(0xe0102c));
        g.add(b);
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xf5f0ea }));
        line.frustumCulled = false;
        g.userData.line = line;
        const tmp = new THREE.Vector3();
        g.userData.tick = (t) => {
          b.position.set(0.55 + Math.sin(t * 1.3) * 0.06, 1.75 + Math.sin(t * 1.9) * 0.05, 0.05); b.rotation.z = Math.sin(t * 1.1) * 0.2;
          PAT.anchors.hand.getWorldPosition(tmp); PAT.root.worldToLocal(tmp);
          const a = line.geometry.attributes.position; a.setXYZ(0, tmp.x, tmp.y, tmp.z); a.setXYZ(1, b.position.x, b.position.y - 0.22, b.position.z + 0.03); a.needsUpdate = true;
        };
        g.add(line); return g; } },
      { id: "lightstick", slot: "hand", name: "Lightstick PAT", icon: "🔦", build() {
        const g = new THREE.Group(); g.rotation.x = 1.3;
        const h = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.26, 10), blk()); h.position.y = 0.1; g.add(h);
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), basic(0xff2a40)); orb.position.y = 0.28; g.add(orb);
        const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.redGlow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); gl.position.y = 0.28; gl.scale.set(0.5, 0.5, 1); g.add(gl);
        g.userData.tick = (t) => { const k = 0.4 + Math.abs(Math.sin(t * 3)) * 0.35; gl.scale.set(k, k, 1); };
        return g; } },
      { id: "rose", slot: "hand", name: "Hoa hồng đỏ", icon: "🌹", build() {
        const g = new THREE.Group(); g.rotation.x = 1.1;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.32, 6), toon(0x2f7a3a)); stem.position.y = 0.12; g.add(stem);
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), toon(0x2f7a3a)); leaf.scale.set(1, 0.4, 0.5); leaf.position.set(0.035, 0.1, 0); g.add(leaf);
        for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), toon(0xd0102a)); const a = (i / 6) * Math.PI * 2; p.position.set(Math.cos(a) * 0.035, 0.3 + (i % 2) * 0.02, Math.sin(a) * 0.035); p.scale.set(0.7, 1, 0.7); g.add(p); }
        return g; } },
      // FLOAT (2)
      { id: "cat", slot: "float", name: "Mèo đen bay", icon: "🐈‍⬛", build() {
        const g = new THREE.Group(); const k = toon(0x141317);
        const bd = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), k); bd.scale.set(1.2, 0.9, 1); g.add(bd);
        const hd = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), k); hd.position.set(0, 0.16, 0.08); g.add(hd);
        [-1, 1].forEach((s) => {
          const e = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 3), k); e.position.set(s * 0.08, 0.3, 0.06); e.rotation.z = -s * 0.3; g.add(e);
          const ey = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), basic(0xffd36b)); ey.scale.set(1, 1.3, 0.5); ey.position.set(s * 0.055, 0.18, 0.21); g.add(ey);
        });
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), basic(0xff8fa3)); nose.position.set(0, 0.14, 0.225); g.add(nose);
        const tail = tube([new THREE.Vector3(0, 0, -0.15), new THREE.Vector3(0.05, 0.1, -0.25), new THREE.Vector3(0.12, 0.22, -0.22)], 0.02, k, 16); g.add(tail);
        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 6, 16), red()); collar.rotation.x = Math.PI / 2; collar.position.set(0, 0.07, 0.07); g.add(collar);
        g.userData.tick = (t) => { g.position.set(-0.8 + Math.sin(t * 0.7) * 0.08, 1.55 + Math.sin(t * 1.8) * 0.08, 0.15); g.rotation.y = 0.5 + Math.sin(t * 0.9) * 0.3; g.rotation.z = Math.sin(t * 1.8) * 0.08; };
        return g; } },
      { id: "orbitstars", slot: "float", name: "Sao xoay quanh", icon: "✨", build() {
        const g = new THREE.Group();
        const st = []; for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.star, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.set(0.22, 0.22, 1); g.add(s); st.push(s); }
        g.userData.tick = (t) => st.forEach((s, i) => { const a = t * 1.2 + (i / st.length) * Math.PI * 2; s.position.set(Math.cos(a) * 0.95, 1.1 + Math.sin(a * 2) * 0.25, Math.sin(a) * 0.95); });
        return g; } },
    ];
  })();

  const WARD_KEY = "pat:wardrobe";
  // every accessory is built once at boot (so its shaders compile with the rest) and only shown when worn
  function prebuildAccessories() {
    ACC.forEach((item) => {
      const o = item.build(); o.userData.s = o.scale.x || 1; o.visible = false;
      PAT.anchors[item.anchor || item.slot].add(o); PAT.acc[item.id] = o;
    });
  }
  function equip(id, quiet) {
    const item = ACC.find((a) => a.id === id); if (!item || !PAT) return;
    const slot = item.slot, prev = PAT.slots[slot], obj = PAT.acc[id];
    if (prev) PAT.acc[prev].visible = false;
    if (prev === id) { delete PAT.slots[slot]; saveWardrobe(); syncAccVisibility(); if (!quiet) Audio.pop(); return; }
    PAT.slots[slot] = id; obj.visible = true;
    saveWardrobe(); syncAccVisibility();
    if (!quiet) {
      obj.scale.setScalar(0.01);
      tween(520, (p) => obj.scale.setScalar(obj.userData.s * Math.max(0.01, ease.back(p))));
      const wp = new THREE.Vector3(); PAT.head.getWorldPosition(wp);
      burst(wp, 12, { tex: TEX.star, speed: 2, size: 0.22, life: 0.9 });
      Audio.pop(); act(pick(["wink", "heart", "star"])); say(pick(["Hợp với mình không?", "Xinh chưa nè~", "Ngầu ghê ★", "Mặc cái này đi diễn nha!"]));
    }
  }
  function unequipAll() {
    Object.keys(PAT.slots).forEach((sl) => { PAT.acc[PAT.slots[sl]].visible = false; delete PAT.slots[sl]; });
    saveWardrobe(); syncAccVisibility(); Audio.pop(); emote("awkward");
  }
  function saveWardrobe() { try { localStorage.setItem(WARD_KEY, JSON.stringify(PAT.slots)); } catch (e) {} }
  function loadWardrobe() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(WARD_KEY) || "{}") || {}; } catch (e) {}
    Object.values(s).forEach((id) => equip(id, true));
  }
  // hats replace the studio headphones; a hand prop is tucked away while both hands play
  function syncAccVisibility() {
    if (!PAT) return;
    PAT.headphones.visible = PAT.cur === "studio" && !PAT.slots.head;
    const h = PAT.slots.hand && PAT.acc[PAT.slots.hand];
    if (h) h.visible = (PAT.cur === "mic" || PAT.cur === "none") && !(RIDE && RIDE.midi.visible);
    const back = PAT.slots.back && PAT.acc[PAT.slots.back];
    if (back) back.visible = !(PAT.travel === "wings" || PAT.travel === "rocket");
    Wardrobe.sync();
  }
  function tickAccessories(t, dt) {
    Object.values(PAT.slots).forEach((id) => { const o = PAT.acc[id]; if (o && o.userData.tick) o.userData.tick(t, dt); });
  }

  function setInstrument(name, instant) {
    if (PAT.cur === name) return;
    const prev = PAT.cur; PAT.cur = name;
    syncAccVisibility();
    const outO = PAT.inst[prev], inO = PAT.inst[name];
    if (instant) { if (outO) outO.visible = false; if (inO) { inO.visible = true; inO.scale.setScalar(inO.userData.s); } return; }
    if (outO) tween(350, (p) => outO.scale.setScalar(outO.userData.s * (1 - ease.in(p))), () => (outO.visible = false));
    if (inO) {
      setTimeout(() => {
        inO.visible = true;
        const wp = new THREE.Vector3(); inO.getWorldPosition(wp); burst(wp, 14, { tex: TEX.star, speed: 2.2, size: 0.25, life: 0.9 });
        Audio.pop();
        tween(650, (p) => inO.scale.setScalar(inO.userData.s * ease.back(p)));
      }, 360);
    }
  }

  const SAYINGS = {
    0: ["Chào bạn, mình là PAT!", "Đi cùng mình nha ♪", "Bấm Đi tiếp đi nè~", "Mic check 1, 2 ♫"],
    1: ["Ảnh mình nè, vuốt thử đi!", "Thái độ trước, trình độ sau", "Hơi ngại xíu...", "Cười cái nha ★"],
    2: ["Mở khoá sao kế tiếp đi!", "Bài đầu tiên đó ♪", "Nghe xong nhớ quay lại nha", "Mỗi bài là một vì sao"],
    3: ["Đánh thử phím đàn đi!", "075 có bảy câu chuyện", "Do re mi fa sol ♫", "Chill xíu nha~"],
    4: ["Bass này đã tai chưa?", "Hook dính lắm đó ♪", "Sắp có thêm nhạc mới nha", "Phonk lên nào!"],
    5: ["Chạm vào trống thử đi!", "Bấm Jam cùng mình nha", "FL Studio là nhà mình", "Cả ban nhạc sẵn sàng rồi ♪"],
    6: ["Cảm ơn bạn thật nhiều!", "Chạm vào ngôi sao đi ★", "Hẹn gặp lại nha!", "Bạn là ngôi sao của mình"],
  };
  const ACTS = ["jump", "spin", "wave", "heart", "wink", "dance", "star"];
  const EMOTES = [
    { id: "happy", name: "Vui vẻ", icon: "😄", say: ["Hihi vui quá trời!", "Yeahhh ♪", "Hôm nay đẹp trời ghê~"] },
    { id: "angry", name: "Tức giận", icon: "💢", say: ["Hứ! Giận rồi đó!", "Đừng chọc nữa mà!", "Grrr..."] },
    { id: "shy", name: "Ngại ngùng", icon: "😳", say: ["Ơ... ngại quá à...", "Đừng nhìn mình vậy mà~", "Hihi... thôi mà"] },
    { id: "awkward", name: "Sượng trân", icon: "😶", say: ["...", "Ờm... ờ...", "Sượng trân luôn á"] },
    { id: "cry", name: "Khóc nhè", icon: "😭", say: ["Huhu oa oa...", "Đừng đi mà huhu", "Thương mình đi..."] },
    { id: "surprised", name: "Bất ngờ", icon: "😲", say: ["Ủa gì vậy trời!", "Thật hả?!", "Wow!"] },
    { id: "love", name: "Mê mẩn", icon: "😍", say: ["Thương bạn nhiều lắm ♥", "Tim mình tan chảy rồi", "Iu iu ♥"] },
    { id: "sleepy", name: "Buồn ngủ", icon: "😪", say: ["Ngáp... thức khuya mix nhạc", "Zzz...", "Cho mình ngủ 5 phút..."] },
  ];
  const EMO_DUR = 3.4;
  function act(name) {
    if (!PAT) return;
    PAT.acting = name || pick(ACTS.filter((a) => a !== PAT.acting));
    PAT.actT = 0;
    const wp = new THREE.Vector3(); PAT.head.getWorldPosition(wp);
    if (PAT.acting === "heart") burst(wp.clone().add(new THREE.Vector3(0, 0.5, 0)), 12, { tex: TEX.heart, speed: 1.6, size: 0.3, life: 1.6, up: 1.5 });
    if (PAT.acting === "star" || PAT.acting === "spin") burst(wp, 16, { tex: TEX.star, speed: 2.4, size: 0.22, life: 1.2 });
    say(pick(SAYINGS[state.station] || SAYINGS[0]));
    Audio.chime((Math.random() * 8) | 0);
  }
  function emote(id) {
    if (!PAT) return;
    const e = EMOTES.find((x) => x.id === id) || pick(EMOTES.filter((x) => x.id !== PAT.emo));
    PAT.emo = e.id; PAT.emoT = 0; PAT.acting = null;
    const wp = new THREE.Vector3(); PAT.head.getWorldPosition(wp);
    const up = wp.clone().add(new THREE.Vector3(0, 0.6, 0));
    if (e.id === "happy") burst(wp, 18, { tex: TEX.star, speed: 2.4, size: 0.24, life: 1.2 });
    if (e.id === "love") burst(up, 14, { tex: TEX.heart, speed: 1.5, size: 0.3, life: 1.8, up: 1.4 });
    if (e.id === "shy") burst(up, 6, { tex: TEX.heart, speed: 0.6, size: 0.18, life: 1.5, up: 1 });
    if (e.id === "surprised") burst(up, 10, { tex: TEX.star, speed: 3, size: 0.18, life: 0.7 });
    say(pick(e.say));
    const tones = { happy: [0, 2, 4], angry: [1, 0], shy: [5, 3], awkward: [2], cry: [4, 2, 0], surprised: [6], love: [3, 5, 7], sleepy: [4, 1] }[e.id];
    tones.forEach((n, i) => setTimeout(() => Audio.chime(n), i * 120));
  }
  function say(text) {
    const b = $("#bubble");
    b.textContent = text;
    b.classList.add("on");
    clearTimeout(say._t);
    say._t = setTimeout(() => b.classList.remove("on"), 2200);
  }

  const _v = new THREE.Vector3();
  const FACE_BASE = new THREE.Color(0xf2c4a0).convertSRGBToLinear(), FACE_RED = new THREE.Color(0xff8a80).convertSRGBToLinear(), FACE_PALE = new THREE.Color(0xd9cfe6).convertSRGBToLinear();
  function animateChibi(t, dt) {
    const P = PAT;
    const walk = P.walking ? 1 : 0;
    P.walk = lerp(P.walk, walk, dt * 6);
    const ph = t * 9;
    let aLx = 0, aLz = 0.18, aRx = 0, aRz = -0.18, hx = 0, hy = 0, hz = 0, bodyY = 0, bodyX = 0, bodyRy = 0, bodyRz = 0, squash = 1, mouth = 0;
    const idle = Math.sin(t * 2.2);
    switch (P.cur) {
      case "mic": aRx = -1.95 + Math.sin(t * 3) * 0.08; aRz = -0.62; aLx = -0.4 + Math.sin(t * 1.5) * 0.25; aLz = 0.5 + Math.sin(t * 3) * 0.2; hx = -0.1 + Math.sin(t * 3) * 0.05; mouth = 0.5 + 0.5 * Math.sin(t * 7.5); hz = Math.sin(t * 1.5) * 0.08; break;
      case "acoustic": aLx = -1.0; aLz = 0.75; aRx = -0.62 + Math.sin(t * 9) * 0.18; aRz = 0.55; hx = 0.1; hz = Math.sin(t * 1.6) * 0.12; break;
      case "electric": aLx = -0.95; aLz = 0.78; aRx = -0.6 + Math.sin(t * 13) * 0.22; aRz = 0.55; hx = 0.08 + Math.abs(Math.sin(t * 4.2)) * 0.18; bodyRz = Math.sin(t * 2.1) * 0.06; break;
      case "keytar": aLx = -1.05 + Math.max(0, Math.sin(t * 6)) * 0.14; aLz = 0.28; aRx = -1.05 + Math.max(0, Math.sin(t * 6 + 1.6)) * 0.14; aRz = -0.28; hy = Math.sin(t * 1.2) * 0.2; hz = Math.sin(t * 2.4) * 0.07; break;
      case "bass": aLx = -0.95; aLz = 0.82; aRx = -0.55 + Math.sin(t * 5) * 0.12; aRz = 0.5; bodyRy = Math.sin(t * 2.5) * 0.18; bodyY = Math.abs(Math.sin(t * 2.5)) * 0.03; break;
      case "studio": aLx = -1.2 + Math.sin(t * 15) * 0.05; aLz = 0.25; aRx = -1.2 + Math.sin(t * 15 + 2) * 0.05; aRz = -0.25; hx = 0.18 + Math.sin(t * 4.2) * 0.1; break;
      default: aLx = -2.6 + Math.sin(t * 6) * 0.2; aLz = 0.3; aRx = -2.6 + Math.sin(t * 6 + 3) * 0.2; aRz = -0.3; bodyY = Math.abs(Math.sin(t * 3)) * 0.06; break;
    }
    if (P.walk > 0.01) {
      const w = P.walk;
      aLx = lerp(aLx, Math.sin(ph) * 0.6, w * 0.6); aRx = lerp(aRx, -Math.sin(ph) * 0.6, w * (P.cur === "mic" ? 0.2 : 0.4));
      bodyY += Math.abs(Math.sin(ph)) * 0.12 * w;
      P.legs[0].rotation.x = Math.sin(ph) * 0.7 * w; P.legs[1].rotation.x = -Math.sin(ph) * 0.7 * w;
      hz += Math.sin(ph) * 0.06 * w;
    } else { P.legs[0].rotation.x *= 0.85; P.legs[1].rotation.x *= 0.85; }
    if (P.cur === "mic" && RIDE && RIDE.midi.visible) { aLx = -1.1 + Math.sin(t * 3) * 0.05; aLz = 0.35; }
    switch (P.travel) {
      case "guitar": aLx = -0.3; aLz = 1.25 + Math.sin(t * 3) * 0.1; aRx = -0.3; aRz = -1.25; hz += Math.sin(t * 3) * 0.08; P.legs[0].rotation.x = -0.3; P.legs[1].rotation.x = 0.3; break;
      case "wings": aLx = 0.5 + Math.sin(t * 8) * 0.2; aLz = 0.9; aRx = 0.5 + Math.sin(t * 8) * 0.2; aRz = -0.9; P.legs[0].rotation.x = 0.4; P.legs[1].rotation.x = 0.2; break;
      case "rocket": aRx = -3.0; aRz = -0.15; aLx = 0.5; aLz = 0.25; P.legs[0].rotation.x = 0.5; P.legs[1].rotation.x = 0.5; break;
      case "staff": aLx = 0; aRx = 0; aLz = 1.1 + Math.sin(t * 4) * 0.25; aRz = -1.1 + Math.sin(t * 4) * 0.25; hz += Math.sin(t * 4) * 0.1; break;
      case "finale": aRx = -1.95; aRz = -0.62; aLx = -1.1; aLz = 0.35; mouth = 0.5 + 0.5 * Math.sin(t * 7.5); break;
    }

    // face defaults: calm, cool, a hint of a smile
    let eyeMode = "open", mouthMode = "smile", blushTarget = 0.35, winkR = 1, eyeScale = 1, browY = 0, browRz = 0.06, faceTo = FACE_BASE, faceK = 0, tearK = 0, lookX = 0;
    const fxOn = { anger: false, sweat: false, gloom: false, zzz: false };
    if (P.acting) {
      P.actT += dt;
      const k = P.actT, d = 1.6, p = clamp(k / d, 0, 1), env = Math.sin(p * Math.PI);
      switch (P.acting) {
        case "jump": bodyY += Math.sin(p * Math.PI) * 0.7; squash = 1 + Math.sin(p * Math.PI * 2) * 0.12; aLx = -2.8 * env + aLx * (1 - env); aRx = -2.8 * env + aRx * (1 - env); eyeMode = "happy"; break;
        case "spin": bodyRy += ease.io(p) * Math.PI * 2; bodyY += env * 0.25; break;
        case "wave": aLx = lerp(aLx, -2.7, env); aLz = lerp(aLz, 0.4 + Math.sin(k * 14) * 0.35, env); hz += env * 0.15; mouthMode = "grin"; break;
        case "heart": aLx = lerp(aLx, -2.9, env); aRx = lerp(aRx, -2.9, env); aLz = lerp(aLz, -0.35, env); aRz = lerp(aRz, 0.35, env); hz += Math.sin(k * 4) * 0.08; eyeMode = "happy"; break;
        case "wink": winkR = 1 - env * 0.92; hz += env * 0.22; mouth = Math.max(mouth, env * 0.3); break;
        case "dance": bodyRz += Math.sin(k * 10) * 0.18 * env; bodyY += Math.abs(Math.sin(k * 10)) * 0.12 * env; aLx = lerp(aLx, -1.5 + Math.sin(k * 10) * 0.8, env); aRx = lerp(aRx, -1.5 - Math.sin(k * 10) * 0.8, env); hz += Math.sin(k * 10) * 0.15 * env; mouthMode = "grin"; break;
        case "star": eyeMode = "star"; bodyY += env * 0.15; hx -= env * 0.2; mouth = Math.max(mouth, env * 0.8); break;
      }
      if (k >= d) P.acting = null;
    }
    if (P.emo) {
      P.emoT += dt;
      const k = P.emoT, p = clamp(k / EMO_DUR, 0, 1), env = Math.min(1, k / 0.25, (EMO_DUR - k) / 0.35);
      mouth = 0;
      switch (P.emo) {
        case "happy":
          eyeMode = "happy"; mouthMode = "grin"; blushTarget = 0.7;
          bodyY += Math.abs(Math.sin(k * 7)) * 0.22 * env; squash = 1 + Math.sin(k * 14) * 0.05 * env;
          aLx = lerp(aLx, -2.7 + Math.sin(k * 7) * 0.2, env); aRx = lerp(aRx, -2.7 - Math.sin(k * 7) * 0.2, env); aLz = lerp(aLz, 0.5, env); aRz = lerp(aRz, -0.5, env);
          hz += Math.sin(k * 7) * 0.14 * env; break;
        case "angry":
          eyeMode = "open"; mouthMode = "frown"; browY = -0.03; browRz = -0.45; blushTarget = 0; faceTo = FACE_RED; faceK = 0.55 * env; fxOn.anger = true;
          aLx = lerp(aLx, -0.25, env); aRx = lerp(aRx, -0.25, env); aLz = lerp(aLz, 0.12, env); aRz = lerp(aRz, -0.12, env);
          hx += 0.18 * env; bodyX += Math.sin(k * 40) * 0.015 * env; bodyY += Math.max(0, Math.sin(k * 9)) * 0.06 * env;
          if (Math.floor(k * 3) !== Math.floor((k - dt) * 3)) { P.head.getWorldPosition(_v); _v.y += 0.5; burst(_v, 3, { tex: TEX.puff, speed: 1, size: 0.3, life: 0.9, up: 1.5 }); }
          break;
        case "shy":
          eyeMode = Math.sin(k * 2) > 0.6 ? "closed" : "open"; eyeScale = 0.8; mouthMode = "wobble"; blushTarget = 1; faceTo = FACE_RED; faceK = 0.25 * env; fxOn.sweat = true; lookX = 0.03;
          hy += 0.5 * env; hx += 0.25 * env; hz += -0.15 * env; bodyRy += 0.3 * env;
          aLx = lerp(aLx, -1.0, env); aRx = lerp(aRx, -1.0, env); aLz = lerp(aLz, -0.55, env); aRz = lerp(aRz, 0.55, env);
          bodyRz += Math.sin(k * 3) * 0.05 * env; break;
        case "awkward":
          eyeMode = "dot"; mouthMode = "flat"; blushTarget = 0; faceTo = FACE_PALE; faceK = 0.55 * env; fxOn.gloom = true; fxOn.sweat = true;
          aLx = lerp(aLx, 0, env); aRx = lerp(aRx, 0, env); aLz = lerp(aLz, 0.06, env); aRz = lerp(aRz, -0.06, env);
          hz += 0.12 * env; bodyX += Math.sin(k * 55) * 0.006 * env; squash = 1 - 0.04 * env; break;
        case "cry":
          eyeMode = "squeeze"; mouthMode = "cry"; blushTarget = 0.8; tearK = env;
          aLx = lerp(aLx, -2.5 + Math.sin(k * 8) * 0.15, env); aRx = lerp(aRx, -2.5 - Math.sin(k * 8) * 0.15, env); aLz = lerp(aLz, -0.6, env); aRz = lerp(aRz, 0.6, env);
          hx += 0.15 * env; bodyY += Math.abs(Math.sin(k * 10)) * 0.05 * env; squash = 1 + Math.sin(k * 10) * 0.03 * env;
          if (Math.floor(k * 6) !== Math.floor((k - dt) * 6)) P.eyes.forEach((e) => { e.getWorldPosition(_v); burst(_v, 1, { tex: TEX.tear, speed: 1.1, size: 0.12, life: 0.8, up: 0.6 }); });
          break;
        case "surprised":
          eyeMode = "open"; eyeScale = 1.25; mouthMode = "O"; browY = 0.05; blushTarget = 0.2;
          bodyY += Math.max(0, Math.sin(Math.min(p * 6, 1) * Math.PI)) * 0.35; aLx = lerp(aLx, -2.2, env); aRx = lerp(aRx, -2.2, env); aLz = lerp(aLz, 0.9, env); aRz = lerp(aRz, -0.9, env);
          hx -= 0.18 * env; break;
        case "love":
          eyeMode = "heart"; mouthMode = "grin"; blushTarget = 0.95;
          aLx = lerp(aLx, -1.4, env); aRx = lerp(aRx, -1.4, env); aLz = lerp(aLz, -0.5, env); aRz = lerp(aRz, 0.5, env);
          bodyRz += Math.sin(k * 3) * 0.1 * env; hz += Math.sin(k * 3) * 0.18 * env;
          if (Math.floor(k * 2.5) !== Math.floor((k - dt) * 2.5)) { P.head.getWorldPosition(_v); _v.y += 0.5; burst(_v, 2, { tex: TEX.heart, speed: 0.8, size: 0.24, life: 1.5, up: 1.4 }); }
          break;
        case "sleepy":
          eyeMode = "closed"; mouthMode = Math.sin(k * 1.5) > 0.4 ? "O" : "flat"; mouth = 0.6; blushTarget = 0.3; fxOn.zzz = true;
          hx += (0.35 + Math.sin(k * 1.5) * 0.12) * env; hz += 0.2 * env; bodyRz += Math.sin(k * 1.2) * 0.06 * env;
          aLx = lerp(aLx, 0, env); aRx = lerp(aRx, aRx * 0.4, env); squash = 1 + Math.sin(k * 1.5) * 0.03; break;
      }
      if (k >= EMO_DUR) P.emo = null;
    }
    const s = 1 - Math.exp(-dt * 12);
    P.armL.sh.rotation.x += (aLx - P.armL.sh.rotation.x) * s; P.armL.sh.rotation.z += (aLz - P.armL.sh.rotation.z) * s;
    P.armR.sh.rotation.x += (aRx - P.armR.sh.rotation.x) * s; P.armR.sh.rotation.z += (aRz - P.armR.sh.rotation.z) * s;
    const lx = clamp(P.look.x, -1, 1) * 0.35, ly = clamp(P.look.y, -1, 1) * 0.2;
    P.head.rotation.x += (hx - ly + idle * 0.02 - P.head.rotation.x) * s;
    P.head.rotation.y += (hy + lx - P.head.rotation.y) * s;
    P.head.rotation.z += (hz - P.head.rotation.z) * s;
    P.body.position.y = bodyY + Math.sin(t * 2.2) * 0.012;
    P.body.position.x = bodyX;
    P.body.rotation.y = bodyRy; P.body.rotation.z = bodyRz;
    P.body.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
    P.shadow.scale.setScalar(1 - bodyY * 0.5);
    // eyes
    P.blinkT -= dt;
    let blink = 1;
    if (P.blinkT < 0) { blink = Math.abs(Math.sin((P.blinkT / 0.16) * Math.PI)); if (P.blinkT < -0.16) P.blinkT = rand(2, 5); }
    P.eyes.forEach((e, i) => {
      const u = e.userData;
      u.open.visible = eyeMode === "open"; u.happy.visible = eyeMode === "happy"; u.closed.visible = eyeMode === "closed";
      u.squeeze.visible = eyeMode === "squeeze"; u.dot.visible = eyeMode === "dot"; u.heart.visible = eyeMode === "heart"; u.star.visible = eyeMode === "star";
      const sy = eyeMode === "open" ? blink * (i === 0 ? winkR : 1) * eyeScale : 1;
      e.scale.set(eyeMode === "open" ? eyeScale : 1, sy, 1);
      u.open.position.x = lookX * (i ? 1 : 1);
      if (eyeMode === "star") u.star.material.rotation = t * 3;
      if (eyeMode === "heart") { const hs = 0.18 + Math.abs(Math.sin(t * 6)) * 0.05; u.heart.scale.set(hs, hs, 1); }
      if (eyeMode === "squeeze") u.squeeze.scale.y = 1 + Math.sin(t * 20) * 0.15;
    });
    P.brows.forEach((b, i) => {
      const sd = i ? 1 : -1;
      b.position.y += (0.1 + browY - b.position.y) * s;
      b.rotation.z += (sd * browRz - b.rotation.z) * s;
    });
    // mouth
    const MS = P.mouths;
    let mm = mouthMode;
    if (mm === "smile" && mouth > 0.15) mm = "O";
    MS.smile.visible = mm === "smile"; MS.frown.visible = mm === "frown"; MS.flat.visible = mm === "flat";
    MS.mouthO.visible = mm === "O"; MS.grin.visible = mm === "grin"; MS.wobble.visible = mm === "wobble" || mm === "cry";
    MS.mouthO.scale.y = 0.3 + Math.max(mouth, P.emo === "surprised" ? 0.9 : 0.3) * 0.7;
    if (mm === "cry") { MS.wobble.visible = false; MS.mouthO.visible = true; MS.mouthO.scale.set(1.2, 0.5 + Math.abs(Math.sin(t * 12)) * 0.4, 0.4); }
    else MS.mouthO.scale.x = 0.9;
    if (mm === "grin") MS.grin.scale.y = 0.9 + Math.sin(t * 8) * 0.1;
    P.blushMat.opacity += (blushTarget - P.blushMat.opacity) * s;
    P.faceMat.color.copy(FACE_BASE).lerp(faceTo, faceK);
    P.tearMat.opacity += (tearK * 0.85 - P.tearMat.opacity) * s;
    P.tears.forEach((tr) => (tr.scale.y = 0.6 + Math.sin(t * 6) * 0.15 + tearK * 0.4));
    // emotion sprites
    const F = P.fx;
    F.anger.visible = fxOn.anger; if (fxOn.anger) { const a = 0.26 + Math.abs(Math.sin(t * 9)) * 0.08; F.anger.scale.set(a, a, 1); }
    F.sweat.visible = fxOn.sweat; if (fxOn.sweat) F.sweat.position.y = 0.25 - ((t * 0.25) % 0.12);
    F.gloom.visible = fxOn.gloom; if (fxOn.gloom) F.gloom.material.opacity = 0.7 + Math.sin(t * 4) * 0.2;
    F.zzz.visible = fxOn.zzz; if (fxOn.zzz) { const z = (t * 0.6) % 1; F.zzz.position.set(0.5 + z * 0.25, 0.55 + z * 0.4, 0.1); F.zzz.material.opacity = 1 - z; const zs = 0.12 + z * 0.15; F.zzz.scale.set(zs, zs, 1); }
    if (P.cur === "keytar" && P.inst.keytar.userData.keys) P.inst.keytar.userData.keys.children.forEach((k, i) => (k.position.z = (k.geometry.parameters.depth === 0.025 ? 0.05 : 0.068) - (Math.sin(t * 12 + i * 1.7) > 0.8 ? 0.012 : 0)));
    [-1, 1].forEach((sd) => { const e = P.head.userData["ear" + sd]; e.spike.rotation.z = Math.sin(t * 3 + sd) * 0.2; });
    tickAccessories(t, dt);
  }

  /* ======================================================================
     8. STATIONS, PATH, PROPS
     ====================================================================== */
  const STATIONS = [
    { key: "hero", label: "Khởi hành", short: "Khởi hành", inst: "mic", tint: 0x8a0a1c, fx: "dolly" },
    { key: "about", label: "Chân dung", short: "Chân dung", inst: "acoustic", tint: 0x6a0816, fx: "mask" },
    { key: "tracks", label: "Chòm sao Track", short: "Track", inst: "electric", tint: 0x9c0d22, fx: "glitch" },
    { key: "ep", label: "EP 075", short: "EP 075", inst: "keytar", tint: 0x5e0712, fx: "vinyl" },
    { key: "ads", label: "Nhạc quảng cáo", short: "Quảng cáo", inst: "bass", tint: 0xa3101f, fx: "shutter" },
    { key: "studio", label: "Phòng thu & Ban nhạc", short: "Ban nhạc", inst: "studio", tint: 0x700a19, fx: "eq" },
    { key: "finale", label: "Ngôi sao", short: "Ngôi sao", inst: "mic", tint: 0xb3142a, fx: "dolly" },
  ];
  const INTRO = { x: 0, y: 0, z: 64 };
  let curve, stationT = [], vinyls = [];

  function buildPath() {
    STATIONS.forEach((s, i) => (s.pos = new THREE.Vector3(Math.sin(i * 1.15) * 9, i * 0.9, -i * 18)));
    const pts = [];
    STATIONS.forEach((s, i) => {
      pts.push(s.pos.clone());
      if (i < STATIONS.length - 1) {
        const n = STATIONS[i + 1].pos || new THREE.Vector3(Math.sin((i + 1) * 1.15) * 9, (i + 1) * 0.9, -(i + 1) * 18);
        pts.push(s.pos.clone().lerp(n, 0.5).add(new THREE.Vector3(0, 2.2, 0)));
      }
    });
    curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.4);
    const segs = pts.length - 1;
    stationT = STATIONS.map((_, i) => (i * 2) / segs);

    // music-staff road: 5 glowing lines along the path
    const samples = 400;
    const frames = curve.computeFrenetFrames(samples, false);
    for (let l = 0; l < 5; l++) {
      const off = (l - 2) * 0.16;
      const arr = [];
      for (let i = 0; i <= samples; i++) {
        const p = curve.getPoint(i / samples);
        const side = new THREE.Vector3().crossVectors(curve.getTangent(i / samples), new THREE.Vector3(0, 1, 0)).normalize();
        arr.push(p.x + side.x * off, p.y - 0.02, p.z + side.z * off);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: l === 2 ? 0xff3a50 : 0xf5f0ea, transparent: true, opacity: l === 2 ? 0.75 : 0.28 }));
      scene.add(line);
    }
    void frames;
    // stepping-stone notes along path
    const nGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16);
    for (let i = 0; i < 90; i++) {
      const p = curve.getPoint(i / 90);
      const m = new THREE.Mesh(nGeo, basic(i % 4 === 0 ? 0xe0102c : 0x2a2730)); m.position.copy(p); m.position.y -= 0.03; scene.add(m);
    }
  }

  function buildVinyl(i) {
    const s = STATIONS[i];
    const g = new THREE.Group(); g.position.copy(s.pos); scene.add(g);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.12, 72), [toon(0x111014), basic(0xffffff, { map: vinylTex(pad2(i + 1), s.short) }), toon(0x111014)]);
    disc.position.y = -0.08; g.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.25, 0.03, 8, 96), basic(0xff2a40)); ring.rotation.x = Math.PI / 2; ring.position.y = -0.06; g.add(ring);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.redGlow, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(11, 11, 1); glow.position.y = -1.2; g.add(glow);
    // tonearm
    disc.userData.onClick = () => { disc.userData.boost = 6; Audio.tick(); burst(s.pos.clone().add(new THREE.Vector3(0, 0.3, 0)), 10, { tex: TEX.notes[i % 4], speed: 2, size: 0.4, life: 1.2, up: 1 }); };
    interactive.push(disc);
    disc.userData.boost = 0;
    updaters.push((t, dt) => { disc.userData.boost *= 0.97; disc.rotation.y += dt * (0.25 + disc.userData.boost); });
    vinyls.push(g);
    return g;
  }

  const floatingNotes = [];
  function buildNotes() {
    const n = isMobile() ? 40 : 70;
    for (let i = 0; i < n; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: pick(TEX.notes), transparent: true, depthWrite: false, opacity: 0.9 }));
      const base = curve.getPoint(Math.random()).add(new THREE.Vector3(rand(-7, 7), rand(1.5, 6), rand(-4, 4)));
      sp.position.copy(base); const s = rand(0.35, 0.8); sp.scale.set(s, s, 1);
      sp.userData = { base, ph: rand(0, 6), s, onClick: () => { Audio.chime(i); burst(sp.position.clone(), 10, { tex: TEX.star, speed: 2, size: 0.18, life: 0.9 }); sp.userData.pop = 1; } };
      scene.add(sp); floatingNotes.push(sp);
      const hit = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 4), basic(0xffffff, { visible: false })); sp.add(hit);
      hit.userData.onClick = sp.userData.onClick;
      interactive.push(hit);
    }
    updaters.push((t) => {
      floatingNotes.forEach((sp) => {
        const u = sp.userData; u.pop = (u.pop || 0) * 0.93;
        sp.position.set(u.base.x + Math.sin(t * 0.5 + u.ph) * 0.4, u.base.y + Math.sin(t * 0.9 + u.ph) * 0.5, u.base.z);
        sp.material.rotation = Math.sin(t + u.ph) * 0.3;
        const s = u.s * (1 + u.pop * 0.8); sp.scale.set(s, s, 1);
      });
    });
  }

  function floatProp(obj, pos, { amp = 0.4, spin = 0.1, ph = rand(0, 6) } = {}) {
    obj.position.copy(pos); scene.add(obj);
    const base = pos.clone();
    obj.userData.wob = 0;
    updaters.push((t) => {
      obj.userData.wob *= 0.95;
      obj.position.y = base.y + Math.sin(t * 0.8 + ph) * amp;
      obj.rotation.y += spin * 0.016 + obj.userData.wob * 0.05;
      obj.rotation.z = Math.sin(t * 0.6 + ph) * 0.08 + Math.sin(t * 20) * obj.userData.wob * 0.05;
    });
    return obj;
  }
  function clickable(obj, fn) {
    obj.traverse((o) => { if (o.isMesh) { o.userData.onClick = fn; o.userData.hoverRoot = obj; interactive.push(o); } });
  }

  let photoFrames = [], constel = [], finaleStar, brightStar;
  // place things relative to how the camera frames station i: back = away from camera, right = screen right
  function spot(i, back, right, up) {
    const y = stationYaw(i), d = new THREE.Vector3(Math.sin(y), 0, Math.cos(y));
    const r = new THREE.Vector3().crossVectors(d.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize();
    return STATIONS[i].pos.clone().addScaledVector(d, -back).addScaledVector(r, right).add(new THREE.Vector3(0, up, 0));
  }
  function buildProps() {
    // 0 — giant mic + the brightest star (PAT)
    const s0 = STATIONS[0].pos;
    const gm = floatProp(INST.mic(), spot(0, 5, 3.2, 2.4), { spin: 0.2 }); gm.scale.setScalar(7); gm.rotation.x = 0.3;
    clickable(gm, () => { gm.userData.wob = 1; Audio.chime(4); act("star"); });
    brightStar = new THREE.Group(); brightStar.position.copy(spot(0, 9, -1, 7.5)); scene.add(brightStar);
    const bsCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.star, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); bsCore.scale.set(4, 4, 1); brightStar.add(bsCore);
    const bsHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.redGlow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 })); bsHalo.scale.set(9, 9, 1); brightStar.add(bsHalo);
    const lbl = textSprite("PAT · ngôi sao sáng nhất", { size: 40, scale: 0.55 }); lbl.position.y = -2.3; brightStar.add(lbl);
    const bsHit = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), basic(0xffffff, { visible: false })); brightStar.add(bsHit);
    bsHit.userData.onClick = () => { Audio.unlock(); burst(brightStar.position.clone(), 30, { tex: TEX.star, speed: 4, size: 0.35, life: 1.4 }); act("star"); };
    interactive.push(bsHit);
    updaters.push((t) => { bsCore.material.rotation = t * 0.3; const s = 4 + Math.sin(t * 2.4) * 0.5; bsCore.scale.set(s, s, 1); bsHalo.material.opacity = 0.6 + Math.sin(t * 1.3) * 0.2; });

    // 1 — acoustic guitar + floating polaroids
    const s1 = STATIONS[1].pos;
    const ga = floatProp(INST.acoustic(), spot(1, 5, 3.6, 1.6), { spin: 0.15 }); ga.scale.setScalar(4.2); ga.rotation.z = 0.4;
    clickable(ga, () => { ga.userData.wob = 1; [196, 247, 294, 392].forEach((f, k) => setTimeout(() => Audio.pluck(f), k * 70)); });
    C.photos.forEach((ph, i) => {
      const grp = new THREE.Group();
      const tex = new THREE.TextureLoader().load(ph.src); tex.encoding = THREE.sRGBEncoding;
      const frameM = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.15), basic(0xf5f0ea, { side: THREE.DoubleSide })); grp.add(frameM);
      const img = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.8), basic(0xffffff, { map: tex, side: THREE.DoubleSide })); img.position.set(0, 0.1, 0.01); grp.add(img);
      const pos = spot(1, 3.5 + (i % 2) * 1.2, -2.2 + i * 1.5, 2.6 + (i % 2) * 0.8);
      grp.position.copy(pos); scene.add(grp);
      grp.userData = { base: pos.clone(), ph: i * 1.3, flip: 0 };
      clickable(grp, () => { grp.userData.flip = 1; Audio.tick(); Gallery.go(i); (i % 2 ? emote("shy") : act("wink")); });
      photoFrames.push(grp);
    });
    updaters.push((t) => photoFrames.forEach((g) => {
      const u = g.userData; u.flip *= 0.94;
      g.position.y = u.base.y + Math.sin(t * 0.9 + u.ph) * 0.25;
      g.lookAt(camera.position.x, g.position.y, camera.position.z);
      g.rotation.z = Math.sin(t * 0.7 + u.ph) * 0.08;
      g.rotateY(u.flip * Math.PI * 2);
    }));

    // 2 — electric guitar + track constellation
    const s2 = STATIONS[2].pos;
    const ge = floatProp(INST.electric(), spot(2, 4, 4, 1.4), { spin: 0.12 }); ge.scale.setScalar(4.6); ge.rotation.z = -0.5;
    clickable(ge, () => { ge.userData.wob = 1; [330, 392, 440, 523, 659].forEach((f, k) => setTimeout(() => Audio.pluck(f), k * 60)); act("dance"); });
    buildConstellation(s2);

    // 3 — piano keys arc (playable)
    const s3 = STATIONS[3].pos;
    const scale = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880];
    const keys = new THREE.Group(); keys.position.copy(spot(3, 1.2, 0.6, 0.2)); keys.rotation.y = stationYaw(3); scene.add(keys);
    scale.forEach((f, i) => {
      const a = -1.1 + (i / (scale.length - 1)) * 2.2;
      const k = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 1.6), i % 3 === 1 ? toon(0xe0102c) : M.white);
      k.position.set(Math.sin(a) * 5, 1.4 + Math.cos(a * 2) * 0.3, -Math.cos(a) * 3.5);
      k.position.z += 0;
      k.rotation.y = a; k.rotation.x = -0.25; keys.add(k);
      k.userData.press = 0; k.userData.baseY = k.position.y;
      k.userData.onClick = () => { k.userData.press = 1; Audio.piano(f); burst(k.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.4, 0)), 6, { tex: TEX.notes[i % 4], speed: 1.4, size: 0.35, life: 1.2, up: 1.5 }); };
      k.userData.onHover = () => { if (!k.userData.hovered) { k.userData.hovered = true; k.userData.onClick(); } };
      k.userData.onLeave = () => (k.userData.hovered = false);
      interactive.push(k);
    });
    updaters.push((t) => keys.children.forEach((k, i) => { k.userData.press *= 0.88; k.position.y = k.userData.baseY - k.userData.press * 0.25 + Math.sin(t * 1.5 + i * 0.5) * 0.08; }));

    // 4 — bass
    const s4 = STATIONS[4].pos;
    const gb = floatProp(INST.bass(), spot(4, 4, 3.8, 1.6), { spin: 0.1 }); gb.scale.setScalar(4.4); gb.rotation.z = 0.6;
    clickable(gb, () => { gb.userData.wob = 1; [55, 73.4, 82.4, 110].forEach((f, k) => setTimeout(() => Audio.tone(f, { type: "sawtooth", dur: 0.8, vol: 0.08 }), k * 120)); act("dance"); });
    // floating billboards (ad screens)
    for (let i = 0; i < 3; i++) {
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.35), basic(0xffffff, { map: adTex(i), side: THREE.DoubleSide }));
      floatProp(scr, spot(4, 5 + i, -1.5 + i * 2.2, 3 + (i % 2) * 1.1), { spin: 0, amp: 0.3 }); scr.rotation.y = stationYaw(4);
      clickable(scr, () => { scr.userData.wob = 1; Audio.pop(); });
    }

    // 5 — full band on a stage
    buildBand();

    // 6 — finale star
    buildFinaleStar(spot(6, 3, -3, 2.6));
  }
  /* ---------- full band: 3D stage at the studio + pads in the panel ---------- */
  const DRUM = {
    // noise burst through a filter
    noise({ hp = 0, lp = 0, bp = 0, q = 1, dur = 0.2, vol = 0.1, when = 0 }) {
      const A = Audio; if (!A.ctx || A.muted) return;
      const c = A.ctx, t = c.currentTime + when;
      const src = c.createBufferSource(); src.buffer = A.noise;
      let node = src;
      [["highpass", hp], ["lowpass", lp], ["bandpass", bp]].forEach(([type, f]) => { if (!f) return; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; node.connect(fl); node = fl; });
      const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      node.connect(g); g.connect(A.master); src.start(t, Math.random()); src.stop(t + dur + 0.05);
    },
    sweep(f0, f1, dur, vol, type = "sine", when = 0) {
      const A = Audio; if (!A.ctx || A.muted) return;
      const c = A.ctx, t = c.currentTime + when;
      const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
      const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(A.master); o.start(t); o.stop(t + dur + 0.05);
    },
    filtered(f, { type = "sawtooth", dur = 0.6, vol = 0.1, cut = 900, cut1 = 200, when = 0, detune = 0 } = {}) {
      const A = Audio; if (!A.ctx || A.muted) return;
      const c = A.ctx, t = c.currentTime + when;
      const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune;
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 4; lp.frequency.setValueAtTime(cut, t); lp.frequency.exponentialRampToValueAtTime(cut1, t + dur);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); lp.connect(g); g.connect(A.master); o.start(t); o.stop(t + dur + 0.05);
    },
  };
  const BAND = [
    { id: "kick", name: "Trống cái", key: "a", inst: null, play: (w = 0) => { DRUM.sweep(150, 42, 0.45, 0.5, "sine", w); DRUM.noise({ lp: 1200, dur: 0.03, vol: 0.05, when: w }); } },
    { id: "snare", name: "Trống lẫy", key: "s", inst: null, play: (w = 0) => { DRUM.noise({ hp: 1500, dur: 0.22, vol: 0.18, when: w }); DRUM.sweep(220, 160, 0.12, 0.12, "triangle", w); } },
    { id: "hat", name: "Hi-hat", key: "d", inst: null, play: (w = 0) => DRUM.noise({ hp: 7000, dur: 0.05, vol: 0.09, when: w }) },
    { id: "tom", name: "Trống tom", key: "f", inst: null, play: (w = 0) => DRUM.sweep(180, 95, 0.4, 0.32, "sine", w) },
    { id: "crash", name: "Cymbal", key: "g", inst: null, play: (w = 0) => DRUM.noise({ hp: 4500, dur: 1.4, vol: 0.09, when: w }) },
    { id: "bass", name: "Guitar bass", key: "h", inst: "bass", play: (w = 0, f = 55) => DRUM.filtered(f, { dur: 0.55, vol: 0.2, cut: 700, cut1: 120, when: w }) },
    { id: "guitar", name: "Guitar điện", key: "j", inst: "electric", play: (w = 0, root = 110) => [1, 1.5, 2, 2.52].forEach((r, k) => DRUM.filtered(root * r, { dur: 1.1, vol: 0.06, cut: 2600, cut1: 600, when: w + k * 0.018, detune: rand(-8, 8) })) },
    { id: "acoustic", name: "Guitar mộc", key: "k", inst: "acoustic", play: (w = 0) => [196, 246.9, 293.7, 392, 493.9].forEach((f, k) => setTimeout(() => Audio.pluck(f), w * 1000 + k * 45)) },
    { id: "keys", name: "Piano", key: "l", inst: "keytar", play: (w = 0, ch = [220, 261.6, 329.6]) => ch.forEach((f) => setTimeout(() => Audio.piano(f), w * 1000)) },
    { id: "synth", name: "Synth", key: ";", inst: "studio", play: (w = 0) => [440, 523.3, 659.3, 880].forEach((f, k) => DRUM.filtered(f, { type: "square", dur: 0.25, vol: 0.035, cut: 3000, cut1: 500, when: w + k * 0.09 })) },
    { id: "vox", name: "Giọng PAT", key: "'", inst: "mic", play: (w = 0) => {
      const A = Audio; if (!A.ctx || A.muted) return;
      const c = A.ctx, t = c.currentTime + w;
      const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(220, t); o.frequency.linearRampToValueAtTime(247, t + 0.35); o.frequency.linearRampToValueAtTime(220, t + 0.8);
      const vib = c.createOscillator(); vib.frequency.value = 5.5; const vg = c.createGain(); vg.gain.value = 3; vib.connect(vg); vg.connect(o.frequency);
      const out = c.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.09, t + 0.08); out.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      [[700, 8, 1], [1220, 10, 0.5], [2600, 12, 0.25]].forEach(([f, q, v]) => { const b = c.createBiquadFilter(); b.type = "bandpass"; b.frequency.value = f; b.Q.value = q; const gg = c.createGain(); gg.gain.value = v * 3; o.connect(b); b.connect(gg); gg.connect(out); });
      out.connect(A.master); o.start(t); vib.start(t); o.stop(t + 1); vib.stop(t + 1);
    } },
  ];
  const Band = {
    parts: {}, jam: null,
    hit(id, fromJam) {
      const b = BAND.find((x) => x.id === id); if (!b) return;
      Audio.init(); b.play();
      const p = this.parts[id]; if (p) { p.userData.hitT = 1; const wp = new THREE.Vector3(); p.getWorldPosition(wp); burst(wp.add(new THREE.Vector3(0, 0.6, 0)), 5, { tex: pick(TEX.notes), speed: 1.4, size: 0.35, life: 1, up: 1.2 }); }
      const pad = $('[data-pad="' + id + '"]'); if (pad) { pad.classList.remove("hit"); void pad.offsetWidth; pad.classList.add("hit"); }
      if (!fromJam && b.inst && state.station === 5) { setInstrument(b.inst); act(pick(["dance", "jump", "wave"])); }
    },
    // 16-step groove at 96 BPM in A minor (Am, F, C, G) so the jam sits with the catalogue
    toggleJam() {
      Audio.init();
      const btn = $("#btnJam");
      if (this.jam) { clearInterval(this.jam.iv); this.jam = null; BG.duck("jam", false); if (btn) btn.textContent = "▶ Jam cùng PAT"; return; }
      const stepMs = 60000 / 96 / 4; let step = 0;
      const roots = [55, 43.65, 65.41, 49], chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 261.6, 329.6], [196, 246.9, 293.7]];
      BG.duck("jam", true); if (btn) btn.textContent = "■ Dừng jam";
      if (state.station === 5) { setInstrument("studio"); act("dance"); }
      this.jam = { iv: setInterval(() => {
        const s = step % 16, bar = Math.floor(step / 16) % 4;
        if (s === 0 || s === 6 || s === 10) this.hit("kick", true);
        if (s === 4 || s === 12) this.hit("snare", true);
        if (s % 2 === 0) this.hit("hat", true);
        if (s === 0 && bar === 0) this.hit("crash", true);
        if (s === 0 || s === 3 || s === 8 || s === 11) { BAND[5].play(0, roots[bar]); this.flash("bass"); }
        if (s === 0 || s === 8) { BAND[8].play(0, chords[bar]); this.flash("keys"); }
        if (s === 14 && bar === 3) this.hit("tom", true);
        step++;
      }, stepMs) };
    },
    flash(id) { const p = this.parts[id]; if (p) p.userData.hitT = 1; const pad = $('[data-pad="' + id + '"]'); if (pad) { pad.classList.remove("hit"); void pad.offsetWidth; pad.classList.add("hit"); } },
    padsHTML() {
      return BAND.map((b) => '<button class="pad" data-pad="' + b.id + '"><b>' + esc(b.name) + "</b><kbd>" + esc(b.key.toUpperCase()) + "</kbd></button>").join("");
    },
    bind() {
      $$("[data-pad]").forEach((el) => el.addEventListener("pointerdown", (e) => { e.preventDefault(); this.hit(el.dataset.pad); }));
      const j = $("#btnJam"); if (j) j.addEventListener("click", () => this.toggleJam());
      window.addEventListener("keydown", (e) => {
        if (state.station !== 5 || state.modal || state.phase !== "live" || e.repeat || e.metaKey || e.ctrlKey) return;
        const b = BAND.find((x) => x.key === e.key.toLowerCase()); if (b) this.hit(b.id);
      });
    },
  };
  function buildBand() {
    const stage = new THREE.Group(); stage.position.copy(spot(5, 3.6, 2.2, 0)); stage.rotation.y = stationYaw(5); scene.add(stage);
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.6, 0.35, 48, 1, false, -Math.PI * 0.62, Math.PI * 1.24), toon(0x141217));
    riser.position.y = -0.1; riser.position.z = -0.6; stage.add(riser);
    const rEdge = new THREE.Mesh(new THREE.TorusGeometry(4.45, 0.03, 6, 80, Math.PI * 1.24), basic(0xff2a40)); rEdge.rotation.set(Math.PI / 2, 0, Math.PI * 0.5 - Math.PI * 0.62 + Math.PI); rEdge.position.set(0, 0.08, -0.6); stage.add(rEdge);
    const add = (id, obj, pos, s = 1) => {
      obj.position.copy(pos); obj.scale.multiplyScalar(s); stage.add(obj);
      obj.userData.hitT = 0; obj.userData.base = obj.position.clone(); obj.userData.bs = obj.scale.x;
      Band.parts[id] = obj;
      clickable(obj, () => Band.hit(id));
      return obj;
    };
    const drumShell = (r, h, shell, label) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32, 1, true), toon(shell, { side: THREE.DoubleSide })); g.add(body);
      [-1, 1].forEach((s) => {
        const head = new THREE.Mesh(new THREE.CircleGeometry(r * 0.97, 32), label && s > 0 ? basic(0xffffff, { map: label }) : toon(0xf2eee8, { side: THREE.DoubleSide }));
        head.rotation.x = -s * Math.PI / 2; head.position.y = s * h / 2; g.add(head);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.05, 6, 32), M.silver); rim.rotation.x = Math.PI / 2; rim.position.y = s * h / 2; g.add(rim);
      });
      return g;
    };
    const cym = (r) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, r * 0.16, 36, 1, true), toon(0xd9a441, { side: THREE.DoubleSide })); return m; };
    const pole = (h) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, h, 8), M.silver); m.position.y = h / 2; return m; };
    const kickTex = canvasTex(256, 256, (g) => {
      g.fillStyle = "#f5f0ea"; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill();
      g.fillStyle = "#e0102c"; g.beginPath(); g.arc(128, 128, 92, 0, 7); g.fill();
      g.fillStyle = "#f5f0ea"; g.font = "900 78px 'Big Shoulders Display', Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("PAT", 128, 134);
    });
    // drum kit (centre back)
    const kick = drumShell(0.62, 0.5, 0xe0102c, kickTex); kick.rotation.x = Math.PI / 2; add("kick", kick, new THREE.Vector3(0, 0.7, -1.2));
    const snare = drumShell(0.3, 0.16, 0xc9ccd4); snare.rotation.x = 0.25; snare.add(pole(0.6).translateY(-0.95)); add("snare", snare, new THREE.Vector3(-0.85, 1.05, -0.65));
    const tom = new THREE.Group(); [-1, 1].forEach((s) => { const t = drumShell(0.24, 0.22, 0x9c0d22); t.position.set(s * 0.32, 0, 0); t.rotation.set(0.45, 0, -s * 0.15); tom.add(t); }); add("tom", tom, new THREE.Vector3(0, 1.4, -1.0));
    const floor = drumShell(0.36, 0.42, 0xe0102c); add("tom2", floor, new THREE.Vector3(0.95, 0.6, -0.7)); Band.parts.tom2 = floor; floor.traverse((o) => { if (o.isMesh) o.userData.onClick = () => Band.hit("tom"); });
    const hat = new THREE.Group(); const h1 = cym(0.3); h1.position.y = 1.32; const h2 = cym(0.3); h2.rotation.x = Math.PI; h2.position.y = 1.27; hat.add(h1, h2, pole(1.3)); add("hat", hat, new THREE.Vector3(-1.55, 0, -0.8));
    const crash = new THREE.Group(); const c1 = cym(0.5); c1.position.y = 2.1; c1.rotation.z = 0.35; crash.add(c1, pole(2.05)); add("crash", crash, new THREE.Vector3(-1.1, 0, -1.7));
    const ride = new THREE.Group(); const c2 = cym(0.55); c2.position.y = 1.9; c2.rotation.z = -0.3; ride.add(c2, pole(1.85)); stage.add(ride); ride.position.set(1.4, 0, -1.6); clickable(ride, () => Band.hit("crash"));
    // drummer stool
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 20), toon(0x111014)); stool.position.set(0, 0.62, -2.05); stage.add(stool);
    // bass rig (left)
    const bassRig = new THREE.Group();
    const amp = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.6), toon(0x111014)); amp.position.y = 0.6; bassRig.add(amp);
    const grill = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.86), toon(0x2a2730)); grill.position.set(0, 0.52, 0.31); bassRig.add(grill);
    const cone = new THREE.Mesh(new THREE.CircleGeometry(0.32, 28), toon(0xe0102c)); cone.position.set(0, 0.52, 0.315); bassRig.add(cone);
    const bg = INST.bass(); bg.scale.setScalar(2.1); bg.position.set(0.75, 1.15, 0.1); bg.rotation.set(0, -0.3, -0.15); bassRig.add(bg);
    add("bass", bassRig, new THREE.Vector3(-3.1, 0, -0.2));
    // guitar rig (right)
    const gRig = new THREE.Group();
    const amp2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 0.55), toon(0xf2eee8)); amp2.position.y = 0.38; gRig.add(amp2);
    const g2 = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.45), toon(0x16141a)); g2.position.set(0, 0.32, 0.28); gRig.add(g2);
    const knobs = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.02), M.gold); knobs.position.set(0, 0.66, 0.28); gRig.add(knobs);
    const eg = INST.electric(); eg.scale.setScalar(2.1); eg.position.set(-0.75, 1.15, 0.1); eg.rotation.set(0, 0.3, 0.12); gRig.add(eg);
    add("guitar", gRig, new THREE.Vector3(3.0, 0, -0.3));
    // acoustic on a stand
    const aRig = new THREE.Group(); const ag = INST.acoustic(); ag.scale.setScalar(2); ag.position.y = 1.05; ag.rotation.z = 0.12; aRig.add(ag);
    const legsA = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 3, 1, true), toon(0x111014, { side: THREE.DoubleSide })); legsA.position.y = 0.25; aRig.add(legsA);
    add("acoustic", aRig, new THREE.Vector3(2.0, 0, 0.9));
    // keyboard on an X stand
    const kRig = new THREE.Group();
    const kb = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.5), toon(0x111014)); kb.position.y = 1.0; kRig.add(kb);
    for (let i = 0; i < 17; i++) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.03, 0.3), i % 7 === 3 ? toon(0xe0102c) : M.white); k.position.set(-0.75 + i * 0.094, 1.07, 0.08); kRig.add(k); }
    [-1, 1].forEach((s) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.25, 0.05), M.silver); l.position.set(0, 0.5, 0); l.rotation.z = s * 0.7; kRig.add(l); });
    add("keys", kRig, new THREE.Vector3(-2.2, 0, 0.9));
    // synth / sampler pad
    const sRig = new THREE.Group();
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.75), toon(0x16141a)); sp.position.y = 1.0; sp.rotation.x = 0.35; sRig.add(sp);
    const lights = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.14), basic(0x3a0a12)); b.position.set(-0.24 + c * 0.16, 0.05, -0.24 + r * 0.16); sp.add(b); lights.push(b); }
    sRig.add(pole(1.0));
    add("synth", sRig, new THREE.Vector3(-0.9, 0, 1.2));
    // vocal mic stand (front centre, PAT's spot)
    const vRig = new THREE.Group(); vRig.add(pole(1.5));
    const vm = INST.mic(); vm.scale.setScalar(1.3); vm.position.y = 1.55; vm.rotation.x = -0.3; vRig.add(vm);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.05, 20), M.silver); vRig.add(base);
    add("vox", vRig, new THREE.Vector3(0.9, 0, 1.3));
    // stage lights
    const beams = [];
    [-2.4, -0.8, 0.8, 2.4].forEach((x, i) => {
      const beam = new THREE.Mesh(new THREE.ConeGeometry(0.9, 5, 24, 1, true), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff2a40 : 0xfff1ec, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      beam.position.set(x, 3.4, -0.6); stage.add(beam); beams.push(beam);
    });
    updaters.push((t, dt) => {
      Object.entries(Band.parts).forEach(([id, o]) => {
        const u = o.userData; u.hitT = Math.max(0, u.hitT - dt * 4);
        const k = u.hitT;
        if (id === "kick" || id === "tom" || id === "tom2" || id === "snare") o.scale.setScalar(u.bs * (1 + k * 0.08));
        else if (id === "hat" || id === "crash") o.rotation.z = Math.sin(t * 40) * 0.08 * k;
        else o.position.y = u.base.y + k * 0.12;
      });
      lights.forEach((b, i) => b.material.color.setHex(Math.sin(t * 6 + i * 1.7) > 0.6 || (Band.jam && (i + Math.floor(t * 6.4)) % 5 === 0) ? 0xff2a40 : 0x3a0a12));
      beams.forEach((b, i) => { b.rotation.z = Math.sin(t * 0.8 + i) * 0.35; b.material.opacity = (Band.jam ? 0.12 : 0.06) + Math.max(0, Math.sin(t * 3 + i)) * 0.04; });
    });
  }

  function adTex(i) {
    return canvasTex(480, 270, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, i % 2 ? "#f5f0ea" : "#e0102c"); gr.addColorStop(1, "#08070a");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20);
      g.fillStyle = i % 2 ? "#08070a" : "#f5f0ea"; g.font = "900 54px 'Big Shoulders Display', Arial"; g.fillText("ON AIR", 30, 80);
      g.font = "500 22px 'Be Vietnam Pro', Arial"; g.fillText("Nhạc quảng cáo · PAT", 30, 120);
      for (let k = 0; k < 40; k++) { const x = 30 + k * 10.5, hh = 10 + Math.abs(Math.sin(k * 0.7 + i)) * 70; g.fillRect(x, h - 40 - hh, 6, hh); }
    });
  }

  function constelPos(s2, i, n) {
    const f = n > 1 ? i / (n - 1) : 0.5;
    return spot(2, 4.5 + Math.sin(f * Math.PI) * 2, -3.6 + f * 8.4, 3.2 + (i % 2) * 1.3 + Math.sin(f * Math.PI) * 0.8);
  }
  let constelLine, keyAsset;
  function buildConstellation(s2) {
    const n = Math.max(1, C.tracks.length);
    for (let i = 0; i < C.tracks.length; i++) {
      const g = new THREE.Group(); g.position.copy(constelPos(s2, i, n)); scene.add(g);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.star, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0x8a8590 })); sp.scale.set(0.9, 0.9, 1); g.add(sp);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.redGlow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); halo.scale.set(3, 3, 1); g.add(halo);
      const hit = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), basic(0xffffff, { visible: false })); g.add(hit);
      hit.userData.onClick = () => Tracks.tryOpen(i);
      interactive.push(hit);
      const lab = textSprite(pad2(i + 1), { size: 40, scale: 0.4, font: "'Big Shoulders Display', Arial", weight: 900 }); lab.position.y = -0.85; g.add(lab);
      g.userData = { sp, halo, lab, glow: 0 };
      constel.push(g);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.Float32BufferAttribute(constel.flatMap((g) => [g.position.x, g.position.y, g.position.z]), 3));
    constelLine = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xff4a5c, transparent: true, opacity: 0.8 }));
    constelLine.geometry.setDrawRange(0, 0);
    scene.add(constelLine);
    // the golden "key" asset that orbits the next lockable star
    keyAsset = new THREE.Group();
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 20), M.gold); bow.position.y = 0.25; keyAsset.add(bow);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), M.gold); keyAsset.add(shaft);
    [0, 1].forEach((k) => { const t = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.04), M.gold); t.position.set(0.07, -0.18 + k * 0.1, 0); keyAsset.add(t); });
    const kg = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffd27a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); kg.scale.set(1.2, 1.2, 1); keyAsset.add(kg);
    scene.add(keyAsset);
    clickable(keyAsset, () => Tracks.tryOpen(Tracks.unlocked));
    updaters.push((t) => {
      constel.forEach((g, i) => {
        const u = g.userData, open = i < Tracks.unlocked, next = i === Tracks.unlocked;
        u.glow = lerp(u.glow, open ? 1 : next ? 0.5 + 0.5 * Math.sin(t * 4) : 0, 0.08);
        u.sp.material.color.setRGB(lerp(0.54, 1, u.glow), lerp(0.52, 0.95, u.glow), lerp(0.56, 0.95, u.glow));
        const s = 0.8 + u.glow * 0.9 + (open ? Math.sin(t * 2 + i) * 0.1 : 0); u.sp.scale.set(s, s, 1);
        u.sp.material.rotation = t * (open ? 0.5 : 0.1);
        u.halo.material.opacity = u.glow * 0.7;
      });
      const nx = constel[Tracks.unlocked];
      keyAsset.visible = !!nx;
      if (nx) {
        keyAsset.position.set(nx.position.x + Math.cos(t * 2) * 1.0, nx.position.y + Math.sin(t * 3) * 0.3, nx.position.z + Math.sin(t * 2) * 1.0);
        keyAsset.rotation.y = t * 3; keyAsset.rotation.z = Math.sin(t * 2) * 0.4;
      }
    });
  }

  let finale = { mode: "idle", t: 0 };
  function buildFinaleStar(p) {
    finaleStar = new THREE.Group(); finaleStar.position.copy(p); scene.add(finaleStar);
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.42 : 1; i ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const star = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 3 }), basic(0xfff6f0));
    star.geometry.center(); finaleStar.add(star);
    const edge = new THREE.Mesh(star.geometry, basic(0xe0102c, { side: THREE.BackSide })); edge.scale.setScalar(1.12); star.add(edge);
    const g1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); g1.scale.set(5, 5, 1); finaleStar.add(g1);
    const g2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.star, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 })); g2.scale.set(8, 8, 1); finaleStar.add(g2);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 6), basic(0xffffff, { visible: false })); finaleStar.add(hit);
    hit.userData.onClick = () => openContact();
    interactive.push(hit);
    finaleStar.userData = { star, g1, g2, home: finaleStar.position.clone() };
    finaleStar.scale.setScalar(0.6);
    updaters.push((t, dt) => {
      const u = finaleStar.userData, c = STATIONS[6].pos;
      star.rotation.y += dt * 1.4; g2.material.rotation = t * 0.4;
      if (finale.mode === "orbit") {
        finale.t += dt;
        const k = finale.t, r = 2.6 + Math.sin(k * 1.3) * 0.6;
        finaleStar.position.set(c.x + Math.cos(k * 2.6) * r, c.y + 1.6 + Math.sin(k * 3.2) * 0.8 + k * 0.4, c.z + Math.sin(k * 2.6) * r);
        if (Math.random() < 0.7) burst(finaleStar.position.clone(), 1, { tex: TEX.star, speed: 0.3, size: 0.25, life: 1.2 });
        if (k > 3.2) { finale.mode = "rise"; finale.t = 0; finale.from = finaleStar.position.clone(); finale.top = spot(6, 3.4, -3, 3.8); }
      } else if (finale.mode === "rise") {
        finale.t += dt;
        const p2 = ease.io(clamp(finale.t / 1.8, 0, 1));
        finaleStar.position.lerpVectors(finale.from, finale.top, p2);
        finaleStar.scale.setScalar(lerp(0.6, 1.25, p2));
        if (finale.t > 1.8 && !finale.flashed) { finale.flashed = true; flash(0.6); Audio.unlock(); burst(finaleStar.position.clone(), 40, { tex: TEX.star, speed: 5, size: 0.35, life: 1.6 }); }
        if (finale.t > 1.8) finale.mode = "shine";
      } else if (finale.mode === "shine") {
        const s = 6 + Math.sin(t * 2.5) * 1.5; g1.scale.set(s, s, 1);
        finaleStar.position.y = finale.top.y + Math.sin(t * 1.2) * 0.25;
      } else {
        finaleStar.position.set(u.home.x + Math.sin(t) * 0.3, u.home.y + Math.sin(t * 1.3) * 0.3, u.home.z);
      }
    });
  }

  // particles
  const parts = [];
  function burst(pos, n, { tex = TEX.star, speed = 2, size = 0.2, life = 1, up = 0 } = {}) {
    for (let i = 0; i < n; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: tex === TEX.heart ? THREE.NormalBlending : THREE.AdditiveBlending }));
      sp.position.copy(pos);
      const v = new THREE.Vector3(rand(-1, 1), rand(-0.3, 1) + up, rand(-1, 1)).normalize().multiplyScalar(speed * rand(0.4, 1));
      sp.userData = { v, life, t: 0, size: size * rand(0.6, 1.3) };
      scene.add(sp); parts.push(sp);
    }
  }
  function tickParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i], u = p.userData;
      u.t += dt;
      const k = u.t / u.life;
      if (k >= 1) { scene.remove(p); p.material.dispose(); parts.splice(i, 1); continue; }
      p.position.addScaledVector(u.v, dt); u.v.multiplyScalar(0.97); u.v.y -= dt * 0.4;
      const s = u.size * (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8); p.scale.set(s, s, 1);
      p.material.rotation += dt * 2;
    }
  }

  /* ======================================================================
     9. CAMERA RIG (orbit 360° around + pitch, zoom, view offset)
     ====================================================================== */
  const cam = {
    target: new THREE.Vector3(), tGoal: new THREE.Vector3(),
    yaw: 0, pitch: 0.16, dist: 7, baseYaw: 0, uYaw: 0, uPitch: 0, zoom: 1, fov: 46, fovKick: 0, shake: 0, mode: "intro",
  };
  function stationYaw(i) {
    const tng = curve.getTangent(stationT[i]);
    return Math.atan2(tng.x, tng.z) + Math.PI + 0.55; // view from front-right of the path
  }
  function updateCamera(dt) {
    const k = 1 - Math.exp(-dt * 4);
    cam.target.lerp(cam.tGoal, k);
    const yaw = cam.baseYaw + cam.uYaw;
    const pitch = clamp(cam.pitch + cam.uPitch, -1.2, 1.35);
    const d = cam.dist * cam.zoom * (isMobile() ? 1.3 : 1);
    const off = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(d);
    camera.position.copy(cam.target).add(off);
    if (cam.shake > 0.001) { camera.position.x += rand(-1, 1) * cam.shake; camera.position.y += rand(-1, 1) * cam.shake; cam.shake *= 0.88; }
    camera.lookAt(cam.target);
    const fov = cam.fov + cam.fovKick;
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
  }
  function applyViewOffset() {
    const w = window.innerWidth, h = window.innerHeight;
    if (state.phase === "intro") camera.clearViewOffset();
    else if (isMobile()) camera.setViewOffset(w, h, 0, h * (state.wardrobe ? 0.3 : 0.13), w, h);
    else camera.setViewOffset(w, h, -w * (state.wardrobe ? 0.09 : 0.17), 0, w, h);
    camera.updateProjectionMatrix();
  }

  /* ======================================================================
     10. DOM PANELS
     ====================================================================== */
  const socialHTML = () => C.socials.filter((s) => s.url).map((s) => '<a class="soc" href="' + esc(s.url) + '" target="_blank" rel="noopener"><i></i>' + esc(s.name) + "</a>").join("");
  const ytThumbCover = '<span class="play-dot"><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></span>';


  function projCard(o, kind, idx) {
    const title = (o.title && o.title.trim()) || (kind === "ep" ? "EP " + pad2(idx + 1) : "Dự án " + pad2(idx + 1));
    const sub = kind === "ad" ? [o.brand || "Thương hiệu", o.year, o.role].filter(Boolean).join(" · ") : [o.date || PENDING].join(" · ");
    const link = o.link || (hasYT(o.youtubeId) ? "https://www.youtube.com/watch?v=" + o.youtubeId : "");
    const pending = !o.title ? '<span class="tag">chờ cập nhật</span>' : "";
    return (
      '<article class="pcard rv" data-fx="' + esc(o.fx || "notes") + '">' +
      '<div class="fxwrap"><canvas class="fx"></canvas>' +
      (hasYT(o.youtubeId) ? '<button class="play-cover" data-yt="' + esc(o.youtubeId) + '" aria-label="Xem video ' + esc(title) + '">' + ytThumbCover + "</button>" : "") +
      "</div>" +
      '<div class="pc-body"><h3 class="pc-title" data-tx>' + esc(title) + "</h3>" + pending +
      '<div class="pc-sub">' + esc(sub) + "</div>" +
      (o.story ? '<p class="body-t" style="margin:4px 0 0">' + esc(o.story) + "</p>" : "") +
      (o.tracklist && o.tracklist.length ? '<ol class="tracklist">' + o.tracklist.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ol>" : "") +
      '<div class="pc-row">' + (link ? '<a class="src-link" href="' + esc(link) + '" target="_blank" rel="noopener">Mở nguồn gốc ↗</a>' : "") + "</div>" +
      "</div></article>"
    );
  }

  function epCard(e, idx) {
    const items = C.tracks.map((t, i) => [t, i]).filter(([t]) => t.ep === e.id).sort((a, b) => (a[0].epNo || 0) - (b[0].epNo || 0));
    return (
      '<article class="pcard rv" data-fx="' + esc(e.fx || "vinyl") + '">' +
      '<div class="fxwrap"><canvas class="fx"></canvas></div>' +
      '<div class="pc-body"><h3 class="pc-title" data-tx>' + esc(e.title || "EP " + pad2(idx + 1)) + "</h3>" +
      '<div class="pc-sub">' + esc([e.date, items.length + " bài", e.upc ? "UPC " + e.upc : ""].filter(Boolean).join(" · ")) + "</div>" +
      (e.story ? '<p class="body-t" style="margin:4px 0 0">' + esc(e.story) + "</p>" : "") +
      '<ol class="ep-list">' + items.map(([t, i]) => '<li><button data-ep-track="' + i + '"><span class="no">' + pad2(t.epNo || 0) + '</span><span class="tt">' + esc(t.title) + '</span><span class="td">' + esc(t.dur || "") + "</span></button></li>").join("") + "</ol>" +
      '<div class="pc-row">' + (e.smartLink ? '<a class="src-link sl-main" href="' + esc(e.smartLink) + '" target="_blank" rel="noopener">Smart link EP ↗</a>' : "") + "</div>" +
      "</div></article>"
    );
  }

  function buildPanels() {
    const A = C.artist;
    const html = [];
    // 0 hero
    html.push(
      '<section class="panel" data-st="0" aria-label="Khởi hành">' +
      '<div class="eyebrow rv">' + esc((A.roles || []).join(" · ")) + "</div>" +
      '<h1 class="poster hero-name rv" data-tx>' + esc(A.stageName || "Phương Anh Tú") + "</h1>" +
      '<div class="rap rv">rap name · ' + esc(A.rapName || "PAT") + "</div>" +
      '<p class="lead rv" data-tx>' + esc(A.tagline || "") + "</p>" +
      '<p class="body-t rv">' + esc(A.intro || "") + "</p>" +
      '<ul class="roles rv"><li>Tên thật · ' + esc(A.realName || "") + "</li>" + (A.roles || []).map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul>" +
      '<div class="socials rv">' + socialHTML() + contactChips() + "</div>" +
      (C.publisher ? '<div class="pub rv">' + esc(C.publisher.label) + ' · <a href="' + esc(C.publisher.url) + '" target="_blank" rel="noopener">' + esc(C.publisher.name) + "</a></div>" : "") +
      "</section>"
    );
    // 1 about
    html.push(
      '<section class="panel" data-st="1" aria-label="Chân dung">' +
      '<div class="eyebrow rv">Chương 02 · Chân dung</div>' +
      '<h2 class="p-title rv" data-tx>Người kể chuyện bằng giai điệu</h2>' +
      '<div class="gal rv" id="gal"></div><div class="gal-ui rv"><div class="gal-dots" id="galDots"></div><span class="gal-hint">Vuốt trái · phải</span></div>' +
      (A.about || []).map((p) => '<p class="body-t rv" data-tx>' + esc(p) + "</p>").join("") +
      (A.quote ? '<blockquote class="quote rv" data-tx>' + esc(A.quote) + "</blockquote>" : "") +
      "</section>"
    );
    // 2 tracks
    html.push(
      '<section class="panel" data-st="2" aria-label="Chòm sao Track">' +
      '<div class="eyebrow rv">Chương 03 · Track</div>' +
      '<h2 class="p-title rv" data-tx>Chòm sao <em>Track</em></h2>' +
      '<p class="body-t rv">' + C.tracks.length + ' ngôi sao, ' + C.tracks.length + ' bài hát, xếp đúng thứ tự phát hành từ Thức Tỉnh (2024). Mở khoá lần lượt: chạm vào ngôi sao đang nhấp nháy, chiếc chìa khoá vàng hoặc danh sách bên dưới. Mỗi bài có bản nghe đầy đủ, lời thẩm định và smart link.</p>' +
      '<div class="unlock-meta rv"><b id="unCount">0</b><span>/ ' + C.tracks.length + " ngôi sao đã sáng</span>" + "</div>" +
      '<ol class="tlist rv" id="tlist"></ol>' +
      '<div class="spot-drawer rv"><button class="chip-btn" id="btnSpotify">Nghe toàn bộ trên Spotify</button><div id="spotBox"></div></div>' +
      "</section>"
    );
    // 3 EP
    html.push(
      '<section class="panel" data-st="3" aria-label="EP">' +
      '<div class="eyebrow rv">Chương 04 · EP</div>' +
      '<h2 class="p-title rv" data-tx>EP đầu tay <em>075</em></h2>' +
      '<p class="body-t rv">Chạm vào dãy phím đàn trôi bên cạnh để tự chơi vài nốt trong lúc nghe.</p>' +
      C.eps.map((e, i) => epCard(e, i)).join("") +
      "</section>"
    );
    // 4 ads
    html.push(
      '<section class="panel" data-st="4" aria-label="Nhạc quảng cáo">' +
      '<div class="eyebrow rv">Chương 05 · Quảng cáo</div>' +
      '<h2 class="p-title rv" data-tx>Âm nhạc cho <em>thương hiệu</em></h2>' +
      (C.ads.length
        ? '<p class="body-t rv">Video phát ngay tại đây. Muốn xem ở kênh gốc, bấm “Mở nguồn gốc”.</p>' + C.ads.map((a, i) => projCard(a, "ad", i)).join("")
        : '<p class="body-t rv">Các dự án nhạc quảng cáo đang được cập nhật. Bạn cần một topline, một đoạn hook hay một giọng hát cho thương hiệu? Hẹn PAT ở ngôi sao cuối hành trình.</p>' +
          '<div class="socials rv">' + contactChips() + "</div>") +
      "</section>"
    );
    // 5 studio + band
    const tools = (C.tools || []).map((t, i) => '<div class="tool rv"><canvas data-tool="' + i + '"></canvas><b>' + esc(t.name) + "</b><span>" + esc(t.note || "") + "</span></div>").join("");
    html.push(
      '<section class="panel" data-st="5" aria-label="Phòng thu và ban nhạc">' +
      '<div class="eyebrow rv">Chương 06 · Phòng thu</div>' +
      '<h2 class="p-title rv" data-tx>Phòng thu &amp; <em>ban nhạc</em></h2>' +
      '<div class="tools">' + tools + "</div>" +
      '<div class="band rv"><div class="band-head"><h3>Ban nhạc của PAT</h3><button class="chip-btn" id="btnJam">▶ Jam cùng PAT</button></div>' +
      '<p class="stats-note">Chạm vào từng nhạc cụ trên sân khấu 3D hoặc các nút dưới đây. Bàn phím: A S D F G H J K L ; \'</p>' +
      '<div class="pads" id="pads">' + Band.padsHTML() + "</div></div>" +
      "</section>"
    );
    // 6 finale
    html.push(
      '<section class="panel" data-st="6" aria-label="Lời cảm ơn">' +
      '<div class="eyebrow rv">Chương 07 · Ngôi sao</div>' +
      '<h2 class="p-title rv" data-tx>Cảm ơn <em>bạn</em></h2>' +
      '<p class="thanks rv" data-tx>' + esc(C.thanks || "") + "</p>" +
      '<button class="star-cta rv" id="starCta">Chạm vào ngôi sao để nhận lời hẹn</button>' +
      "</section>"
    );
    $("#panels").innerHTML = html.join("");
    $("#stepAll").textContent = pad2(STATIONS.length);
    Tracks.renderList();
    Band.bind();
    $$("[data-ep-track]").forEach((b) => b.addEventListener("click", () => Tracks.tryOpen(+b.dataset.epTrack)));
    $("#starCta").addEventListener("click", openContact);
    $("#btnSpotify").addEventListener("click", toggleSpotify);
    $$(".play-cover").forEach((b) => b.addEventListener("click", () => playInline(b)));
    $$(".panel").forEach((p) => p.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true }));
    $$(".panel").forEach((p) => p.addEventListener("pointerdown", (e) => e.stopPropagation()));
  }

  function playInline(btn) {
    const id = btn.dataset.yt, wrap = btn.parentElement;
    btn.remove();
    const key = "inline-" + id + "-" + Math.random();
    new YT(id, { parent: wrap, autoplay: true, controls: 1, visible: true, onState: (s) => BG.duck(key, s === 1 || s === 3) });
    BG.duck(key, true);
    setTimeout(() => BG.duck(key, false), 6000); // released if the embed never reports playing (blocked)
  }
  // Spotify embed with the official iFrame API so the page knows when music plays (to fade the bg music)
  const SPOT = {
    api: null, _l: null,
    load() {
      if (this._l) return this._l;
      this._l = new Promise((res) => {
        window.onSpotifyIframeApiReady = (api) => { this.api = api; res(api); };
        const sc = document.createElement("script");
        sc.src = "https://open.spotify.com/embed/iframe-api/v1"; sc.async = true;
        sc.onerror = () => res(null);
        document.head.appendChild(sc);
        setTimeout(() => res(this.api), 6000);
      });
      return this._l;
    },
  };
  class SpotPlayer {
    constructor(uri, el, { height = 80, onState, key } = {}) {
      this.time = 0; this.dur = 0; this.state = -1; this.el = el; this.onState = onState; this.key = key;
      const [, type, id] = uri.split(":");
      el.innerHTML = '<div class="spot-slot"></div><p class="pub spot-out"><a href="https://open.spotify.com/' + type + "/" + esc(id) + '" target="_blank" rel="noopener">Mở trên Spotify ↗</a></p>';
      SPOT.load().then((api) => {
        if (this.dead) return;
        if (!api) {
          // iFrame API unavailable: plain embed, assume it may be playing while it is open
          $(".spot-slot", el).innerHTML = '<iframe title="Spotify" style="width:100%;height:' + height + 'px;border:0;border-radius:12px" src="https://open.spotify.com/embed/' + type + "/" + esc(id) + '?theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>';
          this.fallback = true; BG.duck(this.key, true);
          return;
        }
        api.createController($(".spot-slot", el), { uri, width: "100%", height, theme: "dark" }, (c) => {
          if (this.dead) { c.destroy(); return; }
          this.c = c;
          c.addListener("playback_update", (e) => {
            const d = e.data || {};
            this.time = (d.position || 0) / 1000; this.dur = (d.duration || 0) / 1000;
            const st = d.isPaused || d.isBuffering ? 2 : 1;
            if (st !== this.state) { this.state = st; this.onState && this.onState(st, this); }
          });
          if (this._pending) this.play();
        });
      });
    }
    play() { if (!this.c) { this._pending = true; return; } if (this.started) this.c.resume(); else { this.c.play(); this.started = true; } }
    pause() { this.c && this.c.pause(); }
    seek(s) { this.c && this.c.seek(s); }
    destroy() { this.dead = true; try { this.c && this.c.destroy(); } catch (e) {} this.el.innerHTML = ""; if (this.key) BG.duck(this.key, false); }
  }

  let spotOpen = false, spotArtist = null;
  function toggleSpotify() {
    const box = $("#spotBox");
    spotOpen = !spotOpen;
    $("#btnSpotify").textContent = spotOpen ? "Đóng Spotify" : "Nghe toàn bộ trên Spotify";
    if (spotOpen) spotArtist = new SpotPlayer("spotify:artist:" + C.spotifyArtistId, box, { height: 352, key: "spotify-artist", onState: (st) => BG.duck("spotify-artist", st === 1) });
    else if (spotArtist) { spotArtist.destroy(); spotArtist = null; }
  }

  /* ---------- gallery (swipe, drag, 3D tilt, random transitions) ---------- */
  const Gallery = {
    i: 0, cards: [],
    build() {
      const g = $("#gal"); if (!g) return;
      if (!C.photos.length) { g.remove(); return; }
      g.innerHTML = C.photos.map((p, i) => '<figure class="gal-card" data-i="' + i + '"><img src="' + esc(p.src) + '" alt="' + esc((C.artist.stageName || "") + " · " + (p.caption || "ảnh " + (i + 1))) + '" draggable="false"><figcaption>' + esc(p.caption || "") + "</figcaption></figure>").join("");
      $("#galDots").innerHTML = C.photos.map((_, i) => '<button aria-label="Ảnh ' + (i + 1) + '"></button>').join("");
      $$("#galDots button").forEach((b, i) => b.addEventListener("click", () => this.go(i)));
      this.cards = $$(".gal-card", g);
      this.layout(null);
      let sx = 0, dx = 0, down = false;
      g.addEventListener("pointerdown", (e) => { down = true; sx = e.clientX; dx = 0; g.setPointerCapture(e.pointerId); });
      g.addEventListener("pointermove", (e) => {
        const r = g.getBoundingClientRect();
        const top = this.cards[this.i];
        if (down) { dx = e.clientX - sx; top.style.transition = "none"; top.style.transform = "translateX(" + dx + "px) rotate(" + dx * 0.05 + "deg)"; }
        else { const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5; top.style.transform = "rotateY(" + px * 16 + "deg) rotateX(" + -py * 16 + "deg)"; }
      });
      const end = () => { if (!down) return; down = false; this.cards[this.i].style.transition = ""; if (Math.abs(dx) > 50) this.go(this.i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); else this.layout(null); };
      g.addEventListener("pointerup", end); g.addEventListener("pointercancel", end);
      g.addEventListener("pointerleave", () => { if (!down) this.layout(null); });
      g.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") this.go(this.i + 1, 1); if (e.key === "ArrowLeft") this.go(this.i - 1, -1); });
      g.tabIndex = 0;
    },
    go(n, dir = 1) {
      if (!this.cards.length) return;
      const L = this.cards.length, prev = this.i;
      this.i = ((n % L) + L) % L;
      if (prev === this.i) return;
      this.layout(pick(["slide", "mask", "zoom", "flip"]), prev, dir);
      Audio.swoosh(0.4);
    },
    layout(trans, prev, dir = 1) {
      const L = this.cards.length;
      this.cards.forEach((c, k) => {
        const rel = (k - this.i + L) % L;
        c.style.zIndex = String(L - rel);
        c.style.clipPath = "inset(0 0 0 0 round 18px)";
        c.style.opacity = rel > 2 ? 0 : 1;
        c.style.transform = "translate(" + rel * 14 + "px," + rel * -10 + "px) rotate(" + rel * 3.5 + "deg) scale(" + (1 - rel * 0.06) + ")";
        c.style.filter = rel ? "brightness(" + (0.55 - rel * 0.1) + ")" : "none";
      });
      if (trans && prev != null) {
        const out = this.cards[prev];
        out.style.zIndex = String(L + 1);
        const tf = {
          slide: "translateX(" + -dir * 120 + "%) rotate(" + -dir * 18 + "deg)",
          zoom: "scale(1.5)",
          flip: "rotateY(" + dir * 180 + "deg) scale(.7)",
          mask: "none",
        }[trans];
        requestAnimationFrame(() => {
          out.style.transform = tf;
          if (trans === "mask") out.style.clipPath = "inset(0 0 0 100% round 18px)";
          else out.style.opacity = 0;
        });
        setTimeout(() => this.layout(null), 820);
      }
      $$("#galDots button").forEach((b, k) => b.classList.toggle("on", k === this.i));
    },
  };

  /* ---------- tracks: unlock in release order + ticket ---------- */
  const Tracks = {
    unlocked: clamp(store.get("unlocked", 0), 0, C.tracks.length),
    renderList() {
      const ol = $("#tlist"); if (!ol) return;
      ol.innerHTML = C.tracks.map((t, i) => {
        const open = i < this.unlocked, next = i === this.unlocked;
        const cls = open ? "open" : next ? "next locked" : "locked";
        const title = open ? trackTitle(t, i) : "★ ★ ★ ★ ★";
        const date = open ? [t.date || PENDING, t.dur, /,/.test(t.artists || "") ? "cùng " + t.artists.split(",").map((x) => x.trim()).filter((x) => x !== C.artist.stageName).join(", ") : ""].filter(Boolean).join(" · ") : next ? "Sẵn sàng mở khoá" : "Đang khoá";
        return '<li><button class="titem ' + cls + '" data-i="' + i + '"' + (open || next ? "" : ' aria-disabled="true"') + ">" +
          '<canvas class="fx" data-fx="' + esc(t.fx) + '"></canvas>' +
          '<span class="no">' + pad2(i + 1) + '</span><span class="tt">' + esc(title) + (open && !t.title ? '<span class="tag">chờ cập nhật</span>' : "") + '<span class="td">' + esc(date) + "</span></span>" +
          '<span class="lk">' + (open ? "Nghe" : next ? "Mở khoá" : "Khoá") + "</span></button>" +
          (open && t.smartLink ? '<a class="tsl" href="' + esc(t.smartLink) + '" target="_blank" rel="noopener">Smart link ↗</a>' : "") + "</li>";
      }).join("");
      $$(".titem", ol).forEach((b) => b.addEventListener("click", () => this.tryOpen(+b.dataset.i)));
      const uc = $("#unCount"); if (uc) uc.textContent = this.unlocked;
      if (constelLine) constelLine.geometry.setDrawRange(0, this.unlocked);
      fxCanvases.refresh();
    },
    tryOpen(i) {
      if (i == null || i >= C.tracks.length) return;
      if (i > this.unlocked) { toast("Hãy mở khoá ngôi sao số " + pad2(this.unlocked + 1) + " trước nhé"); emote("shy"); return; }
      if (i === this.unlocked) {
        this.unlocked++; store.set("unlocked", this.unlocked);
        const g = constel[i];
        if (g) { burst(g.position.clone(), 36, { tex: TEX.star, speed: 4, size: 0.3, life: 1.4 }); keyAsset && burst(keyAsset.position.clone(), 12, { tex: TEX.glow, speed: 2, size: 0.3, life: 1 }); }
        Audio.unlock(); flash(0.35); act("jump");
        this.renderList();
        setTimeout(() => Ticket.open(i, true), 650);
        return;
      }
      Ticket.open(i, false);
    },
  };

  // full-length local audio for the ticket player
  class LocalPlayer {
    constructor(src, onState) {
      const a = document.createElement("audio"); a.src = src; a.preload = "auto"; a.volume = 0.85;
      this.a = a; this.onState = onState;
      a.addEventListener("playing", () => onState(1)); a.addEventListener("pause", () => onState(2)); a.addEventListener("ended", () => onState(0));
      a.addEventListener("waiting", () => onState(3));
    }
    get time() { return this.a.currentTime || 0; }
    get dur() { return isFinite(this.a.duration) ? this.a.duration : 0; }
    play() { const p = this.a.play(); if (p && p.catch) p.catch(() => this.onState(2)); }
    pause() { this.a.pause(); }
    seek(t) { this.a.currentTime = t; }
    destroy() { this.a.pause(); this.a.removeAttribute("src"); this.a.load(); }
  }
  const spotifyHref = (t) => t.spotify || "https://open.spotify.com/search/" + encodeURIComponent(t.title + " " + (C.artist.stageName || ""));
  const Ticket = {
    player: null, idx: -1, playing: false, peaks: null,
    open(i, fresh) {
      const t = C.tracks[i]; this.idx = i;
      $("#tkNo").textContent = pad2(i + 1);
      $("#tkDate").textContent = (t.date || "PAT") + " · ADMIT ONE";
      $("#tkEyebrow").textContent = (fresh ? "Ngôi sao vừa mở khoá" : "Ngôi sao số " + pad2(i + 1)) + (t.ep ? " · EP " + t.ep + " · track " + t.epNo : " · Single");
      const title = $("#tkTitle"); title.textContent = trackTitle(t, i); title._tx = null; playText(title);
      $("#tkSpec").innerHTML = [t.artists, t.genre, t.dur, t.bpm ? "~" + t.bpm + " BPM" : "", t.key, t.isrc ? "ISRC " + t.isrc : ""].filter(Boolean).map((x) => "<span>" + esc(String(x)) + "</span>").join("");
      const rows = { story: t.story || "Câu chuyện của bài hát sẽ sớm được kể ở đây.", formed: t.formed || t.date || PENDING, process: t.process || "Phần thẩm định đang được cập nhật." };
      (async () => { for (const p of $$(".tk-row p", $("#ticketModal"))) await typeInto(p, rows[p.dataset.k], 10); })();
      // smart link first, then Spotify, then the rest
      const links = [];
      if (t.smartLink) links.push('<a class="sl-main" href="' + esc(t.smartLink) + '" target="_blank" rel="noopener">Smart link · mọi nền tảng ↗</a>');
      links.push('<a href="' + esc(spotifyHref(t)) + '" target="_blank" rel="noopener">Spotify ↗</a>');
      links.push('<a href="https://music.apple.com/us/artist/ph%C6%B0%C6%A1ng-anh-t%C3%BA/1778922650" target="_blank" rel="noopener">Apple Music ↗</a>');
      if (hasYT(t.youtubeId)) links.push('<a href="https://www.youtube.com/watch?v=' + esc(t.youtubeId) + '" target="_blank" rel="noopener">YouTube ↗</a>');
      $("#tkLinks").innerHTML = links.join("");
      this.peaks = Array.isArray(t.peaks) ? t.peaks : null;
      this.seed = Array.from(trackTitle(t, i)).reduce((a, c) => a + c.charCodeAt(0), 7);
      this.stop();
      $("#tkDur").textContent = t.dur || (t.audio ? "--:--" : "chưa có bản nghe");
      if (t.audio) this.player = new LocalPlayer(t.audio, (st) => { this.playing = st === 1 || st === 3; this.setIcon(); BG.duck("ticket", this.playing); if (st === 0) emote("happy"); });
      $("#ticketModal").classList.add("on");
      state.modal = true;
    },
    toggle() {
      if (!this.player) { toast("Bản nghe sẽ sớm có mặt"); return; }
      Audio.init();
      if (this.playing) { this.player.pause(); this.playing = false; BG.duck("ticket", false); }
      else { this.player.play(); this.playing = true; BG.duck("ticket", true); }
      this.setIcon();
    },
    setIcon() { $("#tkIcon").innerHTML = this.playing ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>' : '<path d="M7 4l13 8-13 8z"/>'; },
    stop() { if (this.player) { this.player.destroy(); this.player = null; } this.playing = false; this.setIcon(); BG.duck("ticket", false); $("#tkCur").textContent = "0:00"; },
    close() { this.stop(); $("#ticketModal").classList.remove("on"); state.modal = false; $$(".tk-row p").forEach((p) => clearInterval(p._iv)); },
    draw(t) {
      const cv = $("#tkWave"); if (!$("#ticketModal").classList.contains("on")) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      const n = Math.floor(w / 4), p = this.player && this.player.dur ? this.player.time / this.player.dur : 0, pk = this.peaks;
      for (let i = 0; i < n; i++) {
        let base;
        if (pk) { const a = Math.floor((i / n) * pk.length), b = Math.max(a + 1, Math.floor(((i + 1) / n) * pk.length)); base = 0; for (let k = a; k < b; k++) base = Math.max(base, pk[k] || 0); base = 0.12 + base * 0.88; }
        else base = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.37 + this.seed) * Math.cos(i * 0.11 + this.seed * 0.3));
        const near = this.playing && Math.abs(i / n - p) < 0.02 ? 1 + 0.15 * Math.sin(t * 20 + i) : 1;
        const bh = Math.max(2, base * near * (h - 6));
        g.fillStyle = i / n < p ? "#e0102c" : "rgba(8,7,10,.28)";
        g.fillRect(i * 4, (h - bh) / 2, 2.5, bh);
      }
      if (this.player && this.player.dur) {
        const f = (s) => Math.floor(s / 60) + ":" + pad2(Math.floor(s % 60));
        $("#tkCur").textContent = f(this.player.time); $("#tkDur").textContent = f(this.player.dur);
      }
    },
  };

  /* ---------- per-project animated canvases (each fx is its own scene) ---------- */
  const fxCanvases = {
    list: [],
    refresh() { this.list = $$("canvas.fx").map((c) => ({ c, type: c.dataset.fx || (c.closest("[data-fx]") || {}).dataset?.fx || "notes", seed: Math.random() * 100 })); },
    draw(t) {
      const active = $(".panel.on");
      this.list.forEach((o) => {
        if (!active || !active.contains(o.c)) return;
        const w = o.c.clientWidth, h = o.c.clientHeight; if (!w || !h) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        if (o.c.width !== Math.round(w * dpr)) { o.c.width = Math.round(w * dpr); o.c.height = Math.round(h * dpr); }
        const g = o.c.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
        (FXP[o.type] || FXP.notes)(g, w, h, t, o.seed);
      });
      $$("canvas[data-tool]").forEach((c, i) => {
        if (!active || !active.contains(c)) return;
        const w = c.clientWidth, h = c.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
        if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
        const g = c.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
        (i % 2 ? FXP._daw : FXP._seq)(g, w, h, t);
      });
    },
  };
  const bg = (g, w, h, a = "#1a0508") => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, a); gr.addColorStop(1, "#050406"); g.fillStyle = gr; g.fillRect(0, 0, w, h); };
  const FXP = {
    notes(g, w, h, t, s) { bg(g, w, h); g.font = "22px serif"; g.textAlign = "center"; for (let i = 0; i < 18; i++) { const x = ((i * 97 + s * 13) % w), y = h - (((t * 30 + i * 53) % (h + 40))) + 20; g.fillStyle = i % 3 ? "rgba(245,240,234,.8)" : "#ff4a5c"; g.fillText("♪♫♩♬"[i % 4], x + Math.sin(t + i) * 10, y); } },
    vinyl(g, w, h, t) { bg(g, w, h); const r = Math.min(w, h) * 0.42, cx = w * 0.55, cy = h / 2; g.save(); g.translate(cx, cy); g.rotate(t * 1.4); g.fillStyle = "#0b0a0d"; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); for (let k = r * 0.4; k < r; k += 3) { g.strokeStyle = "rgba(255,255,255," + (0.03 + ((k * 7) % 5) / 60) + ")"; g.beginPath(); g.arc(0, 0, k, 0, 7); g.stroke(); } g.fillStyle = "#e0102c"; g.beginPath(); g.arc(0, 0, r * 0.32, 0, 7); g.fill(); g.fillStyle = "#f5f0ea"; g.fillRect(-2, -r * 0.25, 4, r * 0.1); g.restore(); g.strokeStyle = "#cfd3da"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx + r * 1.1, cy - r); g.lineTo(cx + r * 0.6, cy + r * 0.2 + Math.sin(t * 2) * 3); g.stroke(); },
    waves(g, w, h, t) { bg(g, w, h); for (let k = 0; k < 6; k++) { g.strokeStyle = k % 2 ? "rgba(245,240,234,.55)" : "rgba(255,74,92,.85)"; g.lineWidth = 1.5; g.beginPath(); for (let x = 0; x <= w; x += 6) { const y = h / 2 + Math.sin(x * 0.02 + t * (1.5 + k * 0.3) + k) * (h * 0.08 * (k + 1) * 0.5) * Math.sin(t * 0.7 + k); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } },
    hearts(g, w, h, t, s) { bg(g, w, h, "#2a0610"); for (let i = 0; i < 14; i++) { const x = (i * 71 + s * 11) % w, y = h - ((t * 26 + i * 41) % (h + 30)) + 15, sc = 6 + (i % 4) * 3; g.fillStyle = i % 2 ? "#ff4a5c" : "rgba(245,240,234,.7)"; g.beginPath(); g.moveTo(x, y + sc); g.bezierCurveTo(x - sc * 1.6, y - sc * 0.2, x - sc * 0.6, y - sc * 1.4, x, y - sc * 0.4); g.bezierCurveTo(x + sc * 0.6, y - sc * 1.4, x + sc * 1.6, y - sc * 0.2, x, y + sc); g.fill(); } },
    sparks(g, w, h, t) { bg(g, w, h); const cx = w / 2, cy = h / 2; for (let i = 0; i < 60; i++) { const a = i * 2.39996, k = (t * 0.6 + i / 60) % 1, r = k * Math.max(w, h) * 0.6; g.strokeStyle = "rgba(" + (i % 3 ? "255,74,92" : "245,240,234") + "," + (1 - k) + ")"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.lineTo(cx + Math.cos(a) * (r + 14), cy + Math.sin(a) * (r + 14)); g.stroke(); } },
    rain(g, w, h, t, s) { bg(g, w, h, "#120207"); for (let i = 0; i < 70; i++) { const x = (i * 37 + s * 7) % w, y = ((t * (120 + (i % 5) * 40) + i * 29) % (h + 60)) - 30; g.strokeStyle = i % 4 ? "rgba(245,240,234,.35)" : "#e0102c"; g.lineWidth = i % 4 ? 1 : 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + 22); g.stroke(); } },
    petals(g, w, h, t, s) { bg(g, w, h, "#24060c"); for (let i = 0; i < 24; i++) { const x = ((i * 53 + t * 24 + s) % (w + 40)) - 20, y = ((i * 31 + t * 18) % (h + 40)) - 20; g.save(); g.translate(x, y); g.rotate(t + i); g.fillStyle = i % 3 ? "rgba(255,74,92,.85)" : "rgba(245,240,234,.8)"; g.beginPath(); g.ellipse(0, 0, 8, 3.5, 0, 0, 7); g.fill(); g.restore(); } },
    rings(g, w, h, t) { bg(g, w, h); for (let i = 0; i < 8; i++) { const k = (t * 0.35 + i / 8) % 1; g.strokeStyle = "rgba(" + (i % 2 ? "245,240,234" : "255,74,92") + "," + (1 - k) + ")"; g.lineWidth = 2; g.beginPath(); g.arc(w / 2, h / 2, k * Math.max(w, h) * 0.6, 0, 7); g.stroke(); } },
    comet(g, w, h, t) { g.fillStyle = "rgba(5,4,6,.25)"; g.fillRect(0, 0, w, h); const x = w / 2 + Math.cos(t * 1.3) * w * 0.35, y = h / 2 + Math.sin(t * 2.1) * h * 0.3; const gr = g.createRadialGradient(x, y, 0, x, y, 26); gr.addColorStop(0, "#fff"); gr.addColorStop(0.3, "rgba(255,74,92,.8)"); gr.addColorStop(1, "rgba(255,74,92,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 26, 0, 7); g.fill(); },
    _seq(g, w, h, t) { g.clearRect(0, 0, w, h); const cols = 16, rows = 4, cw = w / cols, rh = h / rows, ph = Math.floor(t * 6) % cols; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const on = (c * (r + 3) + r) % 5 === 0 || (r === 0 && c % 4 === 0); g.fillStyle = c === ph ? (on ? "#fff" : "rgba(255,74,92,.45)") : on ? "#e0102c" : "rgba(245,240,234,.08)"; g.fillRect(c * cw + 1.5, r * rh + 1.5, cw - 3, rh - 3); } },
    _daw(g, w, h, t) { g.clearRect(0, 0, w, h); const lanes = 3, lh = h / lanes; for (let l = 0; l < lanes; l++) { g.fillStyle = "rgba(245,240,234,.06)"; g.fillRect(0, l * lh + 2, w, lh - 4); g.strokeStyle = l === 1 ? "#ff4a5c" : "rgba(245,240,234,.7)"; g.beginPath(); for (let x = 0; x < w; x += 2) { const y = l * lh + lh / 2 + Math.sin(x * 0.3 + l) * Math.sin(x * 0.03 + l * 2) * lh * 0.38; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } const px = (t * 40) % w; g.fillStyle = "#fff"; g.fillRect(px, 0, 1.5, h); },
  };

  /* ---------- wardrobe & emotions UI ---------- */
  const Wardrobe = {
    tab: "all", ready: false,
    build() {
      $("#wdEmos").innerHTML = EMOTES.map((e) => '<button class="emo-btn" data-emo="' + e.id + '"><i aria-hidden="true">' + e.icon + "</i>" + esc(e.name) + "</button>").join("");
      $("#wdTabs").innerHTML = [{ key: "all", label: "Tất cả" }].concat(ACC_SLOTS).map((t) => '<button role="tab" data-tab="' + t.key + '" aria-selected="' + (t.key === this.tab) + '">' + esc(t.label) + "</button>").join("");
      $$("[data-emo]").forEach((b) => b.addEventListener("click", () => { Audio.init(); emote(b.dataset.emo); $$("[data-emo]").forEach((x) => x.classList.toggle("on", x === b)); setTimeout(() => b.classList.remove("on"), EMO_DUR * 1000); }));
      $$("[data-tab]").forEach((b) => b.addEventListener("click", () => { this.tab = b.dataset.tab; $$("[data-tab]").forEach((x) => x.setAttribute("aria-selected", String(x === b))); this.renderGrid(); }));
      $("#wdClose").addEventListener("click", () => this.close());
      $("#wdClear").addEventListener("click", () => { Audio.init(); unequipAll(); });
      ["pointerdown", "wheel"].forEach((ev) => $("#wardrobe").addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));
      this.ready = true; this.renderGrid();
    },
    renderGrid() {
      const slotName = (k) => (ACC_SLOTS.find((x) => x.key === k) || {}).label || k;
      $("#wdGrid").innerHTML = ACC.filter((a) => this.tab === "all" || a.slot === this.tab).map((a) => '<button class="acc-btn" data-acc="' + a.id + '"><i aria-hidden="true">' + a.icon + "</i>" + esc(a.name) + "<small>" + esc(slotName(a.slot)) + "</small></button>").join("");
      $$("[data-acc]").forEach((b) => b.addEventListener("click", () => { Audio.init(); equip(b.dataset.acc); }));
      this.sync();
    },
    sync() {
      if (!this.ready || !PAT) return;
      const worn = new Set(Object.values(PAT.slots));
      $$("[data-acc]").forEach((b) => { b.classList.toggle("on", worn.has(b.dataset.acc)); b.setAttribute("aria-pressed", String(worn.has(b.dataset.acc))); });
      $("#wdCount").textContent = "· " + worn.size + " / " + ACC.length + " đang mặc";
    },
    open() { Audio.init(); $("#wardrobe").classList.add("on"); $("#wardrobe").setAttribute("aria-hidden", "false"); state.wardrobe = true; if (state.phase === "live") applyViewOffset(); say("Chọn đồ cho mình đi~"); },
    close() { $("#wardrobe").classList.remove("on"); $("#wardrobe").setAttribute("aria-hidden", "true"); state.wardrobe = false; if (state.phase === "live") applyViewOffset(); },
    toggle() { state.wardrobe ? this.close() : this.open(); },
  };

  /* ---------- contact / finale ---------- */
  function openContact() {
    if (state.station !== 6) return;
    const ct = C.contact || {};
    const rows = [];
    if (ct.email) rows.push({ k: "Gmail", v: ct.email, href: mailHref(ct.email), act: "Gửi mail" });
    if (ct.phone) rows.push({ k: "Điện thoại", v: ct.phone, href: "tel:" + ct.phone.replace(/[^\d+]/g, ""), act: "Gọi ngay", alt: { href: "https://zalo.me/" + ct.phone.replace(/[^\d]/g, ""), label: "Zalo" } });
    $("#ctList").innerHTML = rows.length
      ? rows.map((r) => '<div class="ct-row"><span>' + r.k + '</span><a class="ct-v" href="' + esc(r.href) + '"' + (r.href.startsWith("http") ? ' target="_blank" rel="noopener"' : "") + ">" + esc(r.v) + '</a><span class="ct-acts"><a class="ct-go" href="' + esc(r.href) + '">' + r.act + "</a>" + (r.alt ? '<a class="ct-go" href="' + esc(r.alt.href) + '" target="_blank" rel="noopener">' + r.alt.label + "</a>" : "") + '<button data-copy="' + esc(r.v) + '">Sao chép</button></span></div>').join("")
      : '<div class="ct-row"><span>Liên hệ</span><b>Nhắn PAT qua các kênh bên dưới</b><span></span></div>';
    $("#ctSocials").innerHTML = socialHTML() + (C.publisher ? '<a class="soc" href="' + esc(C.publisher.url) + '" target="_blank" rel="noopener"><i></i>' + esc(C.publisher.name) + "</a>" : "");
    $$("[data-copy]").forEach((b) => b.addEventListener("click", () => {
      const v = b.dataset.copy;
      const done = () => { b.textContent = "Đã chép"; setTimeout(() => (b.textContent = "Sao chép"), 1600); };
      const vEl = b.closest(".ct-row").querySelector(".ct-v"); try { navigator.clipboard.writeText(v).then(done, () => selectText(vEl)); } catch (e) { selectText(vEl); }
    }));
    $("#contactModal").classList.add("on"); state.modal = true;
    Audio.unlock(); act("heart");
  }
  function mailHref(e) { return "mailto:" + e + "?subject=" + encodeURIComponent("Liên hệ hợp tác với Phương Anh Tú (PAT)") + "&body=" + encodeURIComponent("Chào PAT,\n\n"); }
  function contactChips() {
    const ct = C.contact || {}, out = [];
    if (ct.email) out.push('<a class="soc soc-ct" href="' + esc(mailHref(ct.email)) + '"><i></i>' + esc(ct.email) + "</a>");
    if (ct.phone) out.push('<a class="soc soc-ct" href="tel:' + esc(ct.phone.replace(/[^\d+]/g, "")) + '"><i></i>' + esc(ct.phone) + "</a>");
    return out.join("");
  }
  function selectText(el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Đã chọn, nhấn Ctrl/⌘ + C để sao chép"); }

  /* ======================================================================
     11. MAP
     ====================================================================== */
  const MiniMap = {
    pts: [], proj: null,
    build() {
      const svg = $("#map");
      const all = []; for (let i = 0; i <= 120; i++) all.push(curve.getPoint(i / 120));
      const xs = all.map((p) => p.z), ys = all.map((p) => p.x);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
      this.proj = (p) => [28 + ((maxX - p.z) / (maxX - minX)) * 154, 30 + ((p.x - minY) / (maxY - minY || 1)) * 86];
      const d = all.map((p, i) => (i ? "L" : "M") + this.proj(p).map((v) => v.toFixed(1)).join(" ")).join("");
      this.all = all;
      svg.innerHTML = '<path class="m-path" d="' + d + '"/><path class="m-done" id="mDone" d=""/>' +
        STATIONS.map((s, i) => { const [x, y] = this.proj(s.pos); return '<g class="m-node" data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(s.label) + '"><circle cx="' + x + '" cy="' + y + '" r="4.5"/><text x="' + x + '" y="' + (y + (i % 2 ? 15 : -9)) + '" text-anchor="middle">' + esc(s.short) + "</text></g>"; }).join("") +
        '<circle class="m-halo" id="mHalo" r="5" cx="0" cy="0"/><circle class="m-me" id="mMe" r="3" cx="0" cy="0"/>';
      $$(".m-node", svg).forEach((n) => { const go = () => goTo(+n.dataset.i); n.addEventListener("click", go); n.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); }); });
    },
    update(u) {
      const [x, y] = this.proj(PAT.root.position);
      $("#mMe").setAttribute("cx", x); $("#mMe").setAttribute("cy", y);
      $("#mHalo").setAttribute("cx", x); $("#mHalo").setAttribute("cy", y);
      const n = Math.round(clamp(u, 0, 1) * 120);
      $("#mDone").setAttribute("d", this.all.slice(0, n + 1).map((p, i) => (i ? "L" : "M") + this.proj(p).map((v) => v.toFixed(1)).join(" ")).join(""));
      $$(".m-node").forEach((g, i) => g.classList.toggle("on", i === state.station && !state.moving));
    },
  };

  /* ======================================================================
     12. FLOW — stations, transitions, intro, origin
     ====================================================================== */
  const state = { phase: "loading", station: 0, moving: false, modal: false, u: 0 };

  function flash(a = 0.6) { const f = $("#flash"); f.style.transition = "none"; f.style.opacity = a; requestAnimationFrame(() => { f.style.transition = "opacity .9s"; f.style.opacity = 0; }); }
  async function maskCut(label) {
    const m = $("#mask"); $("span", m).textContent = label;
    const p = PAT ? projectToScreen(PAT.root.position) : [70, 55];
    const at = " at " + p[0].toFixed(1) + "% " + p[1].toFixed(1) + "%";
    await tween(520, (k) => (m.style.clipPath = "circle(" + ease.in(k) * 150 + "%" + at + ")"));
    return () => tween(700, (k) => (m.style.clipPath = "circle(" + (1 - ease.out(k)) * 150 + "% at 30% 50%)"));
  }
  // extra full-screen wipes: venetian shutter, spinning record iris, equaliser bars
  async function wipe(kind, label) {
    const w = $("#wipe"); w.className = "wipe " + kind; $(".wp-label", w).textContent = label;
    const bars = $(".wp-bars", w);
    if (!bars.children.length) bars.innerHTML = Array.from({ length: 16 }, (_, i) => '<i style="--i:' + i + '"></i>').join("");
    void w.offsetWidth; w.classList.add("in");
    Audio.swoosh(0.6);
    await sleep(reduced ? 80 : 620);
    return () => { w.classList.add("out"); setTimeout(() => (w.className = "wipe"), 900); };
  }
  function glitch() { document.body.classList.remove("glitching"); void document.body.offsetWidth; document.body.classList.add("glitching"); cam.shake = 0.25; setTimeout(() => document.body.classList.remove("glitching"), 600); }
  function projectToScreen(v) { const p = v.clone().project(camera); return [(p.x * 0.5 + 0.5) * 100, (-p.y * 0.5 + 0.5) * 100]; }

  function hidePanels() {
    $$(".panel").forEach((p) => {
      p.classList.remove("on");
      $$(".rv", p).forEach((r) => r.classList.remove("in"));
      $$("[data-tx]", p).forEach(resetText);
    });
  }
  function showPanel(i) {
    const p = $('.panel[data-st="' + i + '"]'); if (!p) return;
    p.scrollTop = 0;
    p.classList.add("on");
    const items = $$(".rv", p);
    items.forEach((el, k) => setTimeout(() => {
      if (state.station !== i) return;
      el.classList.add("in");
      if (el.hasAttribute("data-tx")) playText(el);
      $$("[data-tx]", el).forEach((x) => playText(x));
    }, 250 + k * 260));
    $("#stepNow").textContent = pad2(i + 1);
    $("#btnPrev").disabled = i === 0;
    $("#nextLabel").textContent = i === STATIONS.length - 1 ? "Xuất phát điểm" : "Đi tiếp";
    U.tint.value.set(STATIONS[i].tint);
    if (i === 6 && finale.mode === "idle") { finale.mode = "orbit"; finale.t = 0; finale.flashed = false; }
    setTimeout(() => state.station === i && say(pick(SAYINGS[i])), 1200);
  }

  async function goTo(j, opts = {}) {
    j = clamp(j, 0, STATIONS.length - 1);
    if (state.moving || state.phase !== "live" || (j === state.station && !opts.force)) return;
    const i = state.station;
    state.moving = true;
    if (Band.jam && j !== 5) Band.toggleJam();
    document.body.classList.add("navd");
    hidePanels();
    const fx = opts.fx || STATIONS[j].fx;
    const t0 = stationT[i], t1 = stationT[j];
    const steps = Math.abs(j - i);
    const dur = (opts.fast ? 1600 : 2300 + Math.min(steps - 1, 3) * 700) * (reduced ? 0.2 : 1);
    let reveal = null;
    Audio.swoosh(1);
    if (fx === "mask") reveal = await maskCut(STATIONS[j].short);
    else if (fx === "shutter" || fx === "vinyl" || fx === "eq") reveal = await wipe(fx, STATIONS[j].short);
    if (fx === "glitch") glitch();
    const y0 = cam.baseYaw, y1 = stationYaw(j);
    let dy = y1 - y0; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    const uy0 = cam.uYaw, up0 = cam.uPitch;
    let mode = TRAVEL[Math.max(i, j)];
    if (j < i && mode === "finale") mode = "wings";
    if (steps > 1) mode = "rocket";
    rideShow(mode); say(TRAVEL_SAY[mode]);
    PAT.walking = mode === "run";
    let swapped = false;
    if (reveal) reveal();
    const side = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
    const rideDur = dur * (mode === "finale" ? 1.35 : mode === "run" ? 0.9 : 1.1);
    await tween(rideDur, (p) => {
      const e = ease.io(p);
      const u = lerp(t0, t1, e);
      state.u = u;
      const pos = curve.getPoint(u);
      const tg = curve.getTangent(u).multiplyScalar(t1 > t0 ? 1 : -1);
      side.crossVectors(tg, UP).normalize();
      const lift = rideFrame(mode, p, e, pos, side, performance.now() / 1000);
      const face = Math.atan2(tg.x, tg.z);
      PAT.root.rotation.y = lerpAngle(PAT.root.rotation.y, face, 0.15);
      cam.tGoal.copy(PAT.root.position).add(new THREE.Vector3(0, 1.2 - lift * 0.35, 0));
      cam.baseYaw = y0 + dy * e;
      cam.uYaw = uy0 * (1 - e); cam.uPitch = up0 * (1 - e);
      const arc = Math.sin(p * Math.PI);
      if (mode === "finale") { cam.dist = 8.5 - e * 2.2 - arc * 1.2; cam.fovKick = arc * 14 - e * 4; soundWave.userData.draw(t0, t1, performance.now() / 1000, arc * 0.9); } // dolly in along the wave
      else if (fx === "dolly") { cam.fovKick = arc * 26; cam.dist = 7 - arc * 3.2; } // dolly-zoom (vertigo)
      else cam.dist = 7 + arc * (2 + Math.min(3, lift));
      if (!swapped && p > 0.45) { swapped = true; setInstrument(STATIONS[j].inst); }
    });
    PAT.walking = false;
    PAT.root.position.copy(curve.getPoint(t1)); PAT.root.rotation.x = 0; PAT.root.rotation.z = 0;
    rideShow(null);
    if (soundWave) soundWave.material.opacity = 0;
    cam.fovKick = 0; cam.dist = 7;
    if (mode === "finale") {
      flash(0.45); Audio.unlock();
      burst(PAT.root.position.clone().add(new THREE.Vector3(0, 0.3, 0)), 30, { tex: TEX.notes[1], speed: 3, size: 0.4, life: 1.4, up: 1 });
      setTimeout(() => { emote("love"); say("Cảm ơn bạn đã đi cùng mình!"); }, 300);
    } else if (mode !== "run") burst(PAT.root.position.clone(), 16, { tex: TEX.star, speed: 2.4, size: 0.26, life: 0.9 });
    // turn to face the viewer
    const faceY = cam.baseYaw - 0.25;
    tween(600, (p) => (PAT.root.rotation.y = lerpAngle(PAT.root.rotation.y, faceY, p)));
    if (fx === "glitch") glitch();
    if (fx === "dolly") flash(0.18);
    state.station = j; state.moving = false; state.u = t1;
    rideShow(null);
    showPanel(j);
  }
  /* ---------- how PAT travels between stations (one ride per stretch of road) ---------- */
  const TRAVEL = ["run", "run", "guitar", "wings", "rocket", "staff", "finale"];
  const TRAVEL_SAY = {
    run: "Chạy nào ♪", guitar: "Lướt guitar nè!", wings: "Bay lên thôi~", rocket: "3, 2, 1... phóng!", staff: "Trượt theo khuông nhạc ♫", finale: "Hạ cánh cùng lời cảm ơn",
  };
  let RIDE = null;
  function buildRides() {
    const R = {};
    const board = new THREE.Group(); const gt = INST.electric(); gt.scale.setScalar(2.3); gt.rotation.set(-Math.PI / 2, 0, 0); gt.position.set(0, 0.04, 0.45); board.add(gt);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.redGlow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(2.4, 1.2, 1); glow.position.y = -0.1; board.add(glow);
    PAT.root.add(board); R.guitar = board;
    const wings = ACC.find((a) => a.id === "angelwings").build(); wings.scale.setScalar(1.6); wings.position.set(0, 0.74, -0.3); PAT.body.add(wings); R.wings = wings;
    const rocket = new THREE.Group(); rocket.position.set(0, 0.62, -0.36); PAT.body.add(rocket);
    const flames = [];
    [-1, 1].forEach((s) => {
      const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.5, 16), M.white); tb.position.x = s * 0.13; rocket.add(tb);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 16), toon(0xe0102c)); cone.position.set(s * 0.13, 0.34, 0); rocket.add(cone);
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.12), toon(0xe0102c)); fin.position.set(s * 0.22, -0.2, 0); rocket.add(fin);
      const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffb070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); fl.position.set(s * 0.13, -0.42, 0); fl.scale.set(0.3, 0.6, 1); rocket.add(fl); flames.push(fl);
    });
    rocket.userData.flames = flames; R.rocket = rocket;
    const staff = new THREE.Group(); PAT.root.add(staff);
    for (let l = 0; l < 5; l++) { const ln = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 5), basic(l === 2 ? 0xff3a50 : 0xf5f0ea, { transparent: true, opacity: 0.85 })); ln.position.set(-0.28 + l * 0.14, 0.02, -2.2); staff.add(ln); }
    const clef = textSprite("𝄞", { size: 90, scale: 0.9, color: "#ff4a5c", font: "serif" }); clef.position.set(0, 0.45, 0.3); staff.add(clef);
    R.staff = staff;
    // MIDI controller for the finale (left hand) — the mic stays in the right
    const midi = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.2), toon(0x111014)); midi.add(base);
    for (let i = 0; i < 9; i++) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.02, 0.09), i % 4 === 1 ? toon(0xe0102c) : M.white); k.position.set(-0.19 + i * 0.047, 0.03, 0.04); midi.add(k); }
    for (let i = 0; i < 4; i++) { const pd = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.05), basic(0xff2a40)); pd.position.set(-0.15 + i * 0.1, 0.03, -0.05); midi.add(pd); }
    midi.position.set(0.02, -0.06, 0.12); midi.rotation.set(0.9, 0, 0); PAT.armL.hand.add(midi); R.midi = midi;
    Object.values(R).forEach((o) => (o.visible = false));
    RIDE = R;
  }
  function rideShow(mode) {
    if (!RIDE) return;
    RIDE.guitar.visible = mode === "guitar"; RIDE.wings.visible = mode === "wings"; RIDE.rocket.visible = mode === "rocket"; RIDE.staff.visible = mode === "staff";
    RIDE.midi.visible = mode === "finale" || (!mode && state.station === 6);
    PAT.travel = mode || null;
    syncAccVisibility();
  }
  // per-frame shape of each ride: lift above the road, sideways sway, body tilt, trails
  function rideFrame(mode, p, e, pos, side, t) {
    const arc = Math.sin(p * Math.PI);
    let lift = 0, sway = 0, tiltX = 0, tiltZ = 0;
    if (mode === "run") { if (Math.random() < 0.35) burst(pos.clone().add(new THREE.Vector3(0, 0.1, 0)), 1, { tex: TEX.puff, speed: 0.5, size: 0.35, life: 0.6 }); tiltX = 0.18 * arc; }
    if (mode === "guitar") { lift = arc * 2.2; sway = Math.sin(p * Math.PI * 3) * 0.8 * arc; tiltZ = Math.cos(p * Math.PI * 3) * 0.25 * arc; if (Math.random() < 0.6) burst(pos.clone().add(new THREE.Vector3(0, lift, 0)), 1, { tex: TEX.star, speed: 0.4, size: 0.25, life: 0.8 }); }
    if (mode === "wings") { lift = arc * 3.4 + Math.sin(t * 8) * 0.12 * arc; tiltX = 0.15 * arc; if (Math.random() < 0.25) burst(pos.clone().add(new THREE.Vector3(0, lift + 0.8, 0)), 1, { tex: TEX.heart, speed: 0.4, size: 0.2, life: 1 }); }
    if (mode === "rocket") {
      lift = Math.sin(Math.min(1, p * 1.4) * Math.PI * 0.5) * 2.8 * (1 - Math.pow(Math.max(0, p - 0.75) / 0.25, 2));
      tiltX = 0.6 * arc; sway = Math.sin(t * 30) * 0.03;
      RIDE.rocket.userData.flames.forEach((f) => { const k = 0.5 + Math.random() * 0.5; f.scale.set(0.3 * k + 0.1, 0.7 * k + 0.3, 1); });
      if (Math.random() < 0.8) { const w = new THREE.Vector3(); RIDE.rocket.getWorldPosition(w); w.y -= 0.5; burst(w, 1, { tex: TEX.puff, speed: 0.6, size: 0.45, life: 1.1 }); }
    }
    if (mode === "staff") { lift = 0.9 * arc + Math.sin(p * Math.PI * 4) * 0.45 * arc; sway = Math.sin(p * Math.PI * 2) * 1.1; tiltZ = -Math.cos(p * Math.PI * 2) * 0.3; if (Math.random() < 0.5) burst(pos.clone().add(new THREE.Vector3(0, lift + 0.3, 0)), 1, { tex: pick(TEX.notes), speed: 0.6, size: 0.35, life: 1.2, up: 0.6 }); }
    if (mode === "finale") {
      // ride the sound wave in from above, landing softly with mic + MIDI
      lift = (1 - e) * 4.2 + Math.sin(p * Math.PI * 6) * 0.5 * (1 - e);
      sway = Math.sin(p * Math.PI * 3) * 0.6 * (1 - e);
      if (Math.random() < 0.7) burst(pos.clone().add(new THREE.Vector3(0, lift + 0.2, 0)), 1, { tex: pick([TEX.star].concat(TEX.notes)), speed: 0.5, size: 0.3, life: 1.2 });
    }
    PAT.root.position.copy(pos).addScaledVector(side, sway); PAT.root.position.y += lift;
    PAT.root.rotation.x = tiltX; PAT.root.rotation.z = tiltZ;
    return lift;
  }
  // a wave of light the finale glides along
  let soundWave;
  function buildSoundWave() {
    const n = 160, pts = new Float32Array(n * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    soundWave = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xff4a5c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
    soundWave.frustumCulled = false; scene.add(soundWave);
    soundWave.userData.draw = (u0, u1, t, k) => {
      const a = soundWave.geometry.attributes.position;
      for (let i = 0; i < n; i++) {
        const f = i / (n - 1), pp = curve.getPoint(lerp(u0, u1, f));
        pp.y += (1 - f) * 4.2 + Math.sin(f * Math.PI * 6 - t * 6) * 0.5 * (1 - f) + Math.sin(f * 40 + t * 9) * 0.08;
        a.setXYZ(i, pp.x, pp.y, pp.z);
      }
      a.needsUpdate = true; soundWave.material.opacity = k;
    };
  }

  function lerpAngle(a, b, t) { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * t; }

  function next() { if (state.station === STATIONS.length - 1) toOrigin(); else goTo(state.station + 1); }
  function prev() { goTo(state.station - 1); }

  async function toOrigin() {
    if (state.moving) return;
    $("#contactModal").classList.remove("on"); state.modal = false;
    state.moving = true; hidePanels();
    finale.mode = "idle"; finaleStar.position.copy(finaleStar.userData.home); finaleStar.scale.setScalar(0.6);
    Audio.swoosh(1.3); glitch();
    // PAT turns into a shooting star and flies home; camera warps back along the staff
    const from = PAT.root.position.clone();
    burst(from.clone().add(new THREE.Vector3(0, 1, 0)), 30, { tex: TEX.star, speed: 3, size: 0.3, life: 1.2 });
    await tween(380, (p) => PAT.root.scale.setScalar(1.15 * (1 - ease.in(p))));
    const comet = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.star, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); comet.scale.set(1.5, 1.5, 1); scene.add(comet);
    const tFrom = stationT[state.station];
    const y0 = cam.baseYaw; let dy = stationYaw(0) - y0; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    await tween(reduced ? 300 : 2600, (p) => {
      const e = ease.io(p), u = lerp(tFrom, 0, e);
      const pos = curve.getPoint(u).add(new THREE.Vector3(0, 1.4, 0));
      comet.position.copy(pos);
      if (Math.random() < 0.8) burst(pos.clone(), 1, { tex: TEX.star, speed: 0.4, size: 0.3, life: 0.8 });
      cam.tGoal.copy(pos); cam.baseYaw = y0 + dy * e;
      cam.fovKick = Math.sin(p * Math.PI) * 30; warp.material.opacity = Math.sin(p * Math.PI) * 0.7;
      state.u = u; PAT.root.position.copy(curve.getPoint(u));
    });
    scene.remove(comet); warp.material.opacity = 0; cam.fovKick = 0;
    setInstrument("mic", true);
    PAT.root.position.copy(STATIONS[0].pos);
    await tween(700, (p) => PAT.root.scale.setScalar(1.15 * ease.back(p)));
    flash(0.5); act("jump");
    PAT.root.rotation.y = cam.baseYaw - 0.25;
    state.station = 0; state.moving = false; state.u = 0;
    rideShow(null);
    showPanel(0);
  }

  async function startJourney() {
    if (state.phase !== "intro") return;
    state.phase = "flying";
    Audio.init();
    BG.start();
    $("#intro").classList.remove("show");
    Audio.swoosh(1.5);
    act("jump");
    await sleep(reduced ? 50 : 650);
    // PAT shrinks into a light and the camera does one long dolly-in through the stars to station 01
    burst(PAT.root.position.clone().add(new THREE.Vector3(0, 1, 0)), 30, { tex: TEX.star, speed: 3, size: 0.3, life: 1.3 });
    tween(400, (p) => PAT.root.scale.setScalar(1.15 * (1 - ease.in(p))));
    const startPos = camera.position.clone();
    const s0 = STATIONS[0].pos, yawEnd = stationYaw(0);
    const endTarget = s0.clone().add(new THREE.Vector3(0, 1.2, 0));
    const endPos = endTarget.clone().add(new THREE.Vector3(Math.sin(yawEnd) * Math.cos(0.16), Math.sin(0.16), Math.cos(yawEnd) * Math.cos(0.16)).multiplyScalar(7));
    const startTarget = cam.target.clone();
    cam.mode = "free";
    state.phase = "live"; applyViewOffset(); state.phase = "flying";
    let dropped = false;
    await tween(reduced ? 400 : 3600, (p) => {
      const e = ease.io(p);
      camera.position.lerpVectors(startPos, endPos, e);
      camera.position.y += Math.sin(p * Math.PI) * 3;
      const tg = startTarget.clone().lerp(endTarget, ease.out(p));
      camera.lookAt(tg);
      camera.fov = 34 + Math.sin(p * Math.PI) * 50 + (46 - 34) * e; camera.updateProjectionMatrix();
      warp.material.opacity = Math.sin(p * Math.PI) * 0.85;
      if (!dropped && p > 0.72) {
        dropped = true;
        PAT.root.position.copy(s0).add(new THREE.Vector3(0, 6, 0));
        PAT.root.rotation.y = yawEnd - 0.25;
        PAT.root.scale.setScalar(1.15);
        tween(800, (k) => (PAT.root.position.y = s0.y + 6 * (1 - ease.out(k)) * (1 - k)), () => { PAT.root.position.copy(s0); burst(s0.clone(), 24, { tex: TEX.star, speed: 3, size: 0.28, life: 1 }); act("jump"); });
      }
    });
    warp.material.opacity = 0;
    flash(0.8);
    cam.mode = "rig"; cam.baseYaw = yawEnd; cam.uYaw = 0; cam.uPitch = 0; cam.dist = 7; cam.fov = 46; cam.fovKick = 0;
    cam.target.copy(endTarget); cam.tGoal.copy(endTarget);
    state.phase = "live";
    document.body.classList.add("live");
    applyViewOffset();
    showPanel(0);
  }

  /* ======================================================================
     13. INPUT — drag to look, wheel to travel, pinch / buttons to zoom, hover & click
     ====================================================================== */
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-9, -9);
  let hovered = null;
  function setupInput() {
    let down = false, sx = 0, sy = 0, moved = 0, lastX = 0, lastY = 0, spinV = 0;
    const pts = new Map();
    let pinch0 = 0, zoom0 = 1;
    canvas.addEventListener("pointerdown", (e) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) { const [a, b] = Array.from(pts.values()); pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = cam.zoom; }
      down = true; sx = lastX = e.clientX; sy = lastY = e.clientY; moved = 0;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = -(e.clientY / innerHeight) * 2 + 1;
      if (PAT) PAT.look.set(mouse.x, mouse.y);
      if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) { const [a, b] = Array.from(pts.values()); const d = Math.hypot(a.x - b.x, a.y - b.y); cam.zoom = clamp(zoom0 * (pinch0 / d), 0.45, 2.4); return; }
      if (!down) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (state.phase === "intro") { spinV = dx * 0.012; PAT.root.rotation.y += spinV; return; }
      if (state.phase !== "live") return;
      cam.uYaw -= dx * 0.006; cam.uPitch += dy * 0.004;
    });
    const up = (e) => {
      pts.delete(e.pointerId);
      if (!down) return; down = false;
      if (moved < 8) clickAt(e.clientX, e.clientY);
      if (state.phase === "intro") introSpin.v = spinV;
    };
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("pointerleave", () => { mouse.set(-9, -9); });

    let wheelLock = 0, acc = 0;
    window.addEventListener("wheel", (e) => {
      if (state.modal) return;
      if (e.ctrlKey || e.altKey) { e.preventDefault(); cam.zoom = clamp(cam.zoom * (1 + e.deltaY * 0.002), 0.45, 2.4); return; }
      if (state.phase !== "live") return;
      acc += e.deltaY;
      const now = performance.now();
      if (now < wheelLock) { acc = 0; return; }
      if (Math.abs(acc) > 90) { acc > 0 ? next() : prev(); acc = 0; wheelLock = now + 1500; }
    }, { passive: false });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.wardrobe) { Wardrobe.close(); return; }
      if (state.modal) { if (e.key === "Escape") closeModals(); return; }
      if (state.phase === "intro" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); startJourney(); return; }
      if (state.phase !== "live" || e.target.closest("input,textarea")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") next();
      if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
      if (e.key === "+" || e.key === "=") cam.zoom = clamp(cam.zoom * 0.85, 0.45, 2.4);
      if (e.key === "-") cam.zoom = clamp(cam.zoom * 1.18, 0.45, 2.4);
    });
    // cursor
    const cur = $("#cursor");
    window.addEventListener("pointermove", (e) => { cur.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)"; });
    document.addEventListener("pointerover", (e) => cur.classList.toggle("hot", !!e.target.closest("a,button,.gal,[role=button]")));

    $("#btnNext").addEventListener("click", next);
    $("#btnPrev").addEventListener("click", prev);
    $("#btnZoomIn").addEventListener("click", () => tweenZoom(cam.zoom * 0.75));
    $("#btnZoomOut").addEventListener("click", () => tweenZoom(cam.zoom * 1.3));
    $("#btnView").addEventListener("click", () => { const a = cam.uYaw, b = cam.uPitch, z = cam.zoom; tween(900, (p) => { const e = ease.io(p); cam.uYaw = a * (1 - e); cam.uPitch = b * (1 - e); cam.zoom = lerp(z, 1, e); }); });
    $("#btnSound").addEventListener("click", () => {
      Audio.init();
      const m = !Audio.muted; Audio.setMuted(m);
      document.body.classList.toggle("muted", m);
      if (!m) { BG.wanted = true; BG.player && BG.player.play(); }
      BG.retarget();
    });
    document.body.classList.toggle("muted", Audio.muted);
    $("#btnStart").addEventListener("click", startJourney);
    $("#btnWardrobe").addEventListener("click", () => Wardrobe.toggle());
    $("#btnWardrobeHud").addEventListener("click", () => Wardrobe.toggle());
    $("#btnAct").addEventListener("click", () => { Audio.init(); act(); });
    $("#btnSpin").addEventListener("click", () => { Audio.init(); Audio.swoosh(0.6); introSpin.v = 0.35; });
    $("#btnOrigin").addEventListener("click", toOrigin);
    $("#tkPlay").addEventListener("click", () => Ticket.toggle());
    $("#tkWave").addEventListener("click", (e) => { const p = Ticket.player; if (!p || !p.dur) return; const r = e.currentTarget.getBoundingClientRect(); p.seek(((e.clientX - r.left) / r.width) * p.dur); });
    $$("[data-close]").forEach((b) => b.addEventListener("click", closeModals));
    $$(".modal").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) closeModals(); }));
    window.addEventListener("resize", onResize);
  }
  const introSpin = { v: 0 };
  function tweenZoom(z) { const a = cam.zoom; z = clamp(z, 0.45, 2.4); tween(500, (p) => (cam.zoom = lerp(a, z, ease.out(p)))); }
  function closeModals() { if ($("#ticketModal").classList.contains("on")) Ticket.close(); $("#contactModal").classList.remove("on"); state.modal = false; }

  function clickAt(x, y) {
    if (state.modal) return;
    const v = new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(v, camera);
    const hit = ray.intersectObjects(interactive, false).find((h) => h.object.userData.onClick && isShown(h.object));
    if (hit) { Audio.init(); hit.object.userData.onClick(hit); }
  }
  function isShown(o) { while (o) { if (o.visible === false && !(o.material && o.material.visible === false && o.parent)) return false; o = o.parent; } return true; }
  function hoverTick() {
    if (mouse.x < -2 || state.modal) { setHover(null); return; }
    ray.setFromCamera(mouse, camera);
    const h = ray.intersectObjects(interactive, false).find((x) => isShown(x.object));
    setHover(h ? h.object : null);
  }
  function setHover(o) {
    if (o === hovered) return;
    if (hovered) { hovered.userData.onLeave && hovered.userData.onLeave(); const r = hovered.userData.hoverRoot; if (r && r.userData._hs) { r.scale.setScalar(r.userData._hs); r.userData._hs = null; } }
    hovered = o;
    $("#cursor").classList.toggle("hot", !!o);
    canvas.style.cursor = o ? "pointer" : "grab";
    if (o) {
      o.userData.onHover && o.userData.onHover();
      const r = o.userData.hoverRoot; if (r && !r.userData._hs) { r.userData._hs = r.scale.x; r.scale.setScalar(r.scale.x * 1.08); if (r.userData.wob != null) r.userData.wob = 0.5; }
    }
  }

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    applyViewOffset();
  }

  /* ======================================================================
     14. BOOT — preload everything before the first frame is shown
     ====================================================================== */
  function progress(p, label) {
    $("#ldbar").style.setProperty("--p", p);
    $("#ldpct").textContent = Math.round(p * 100) + "%";
    if (label) $("#ldtext").textContent = label;
  }
  async function loadFonts() {
    if (!document.fonts) return;
    const sample = "Phương Anh Tú ắằẳẵặấầẩẫậếềểễệốồổỗộớờởỡợứừửữựđ";
    const faces = ['400 16px "Be Vietnam Pro"', '700 16px "Be Vietnam Pro"', '800 40px "Be Vietnam Pro"', '900 40px "Be Vietnam Pro"', '300 40px "Fraunces"', 'italic 300 40px "Fraunces"', '800 40px "Fraunces"', '900 40px "Big Shoulders Display"', '700 30px "Dancing Script"'];
    await Promise.race([Promise.all(faces.map((f) => document.fonts.load(f, sample).catch(() => {}))), sleep(5000)]);
    await (document.fonts.ready || Promise.resolve());
  }
  function loadImages() {
    return Promise.all(C.photos.map((p) => new Promise((res) => {
      const im = new Image(); im.decoding = "async";
      im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(res);
      im.onerror = res; im.src = p.src;
    })));
  }
  async function waitThree() { let n = 0; while (!window.THREE && n++ < 300) await sleep(50); if (!window.THREE) throw new Error("three.js không tải được"); }

  async function boot() {
    progress(0.05, "Đang lên dây đàn");
    await loadFonts();
    document.body.classList.add("fonts-ok");
    progress(0.2, "Lên dây đàn");
    await waitThree();
    progress(0.3, "Gom ảnh & âm thanh");
    BG.create();
    await loadImages();
    if (window.PAT_PEAKS) C.tracks.forEach((t) => { if (t.peaks && typeof t.peaks === "string") t.peaks = window.PAT_PEAKS[t.peaks] || null; });
    Tracks.unlocked = clamp(store.get("unlocked", 0), 0, C.tracks.length);
    progress(0.42, "Dựng ngân hà");
    await frame();

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x08070a, 1);
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08070a, 0.008);
    camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.05, 2000);
    clock = new THREE.Clock();

    gradTex = new THREE.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, THREE.LuminanceFormat);
    gradTex.minFilter = gradTex.magFilter = THREE.NearestFilter; gradTex.generateMipmaps = false; gradTex.needsUpdate = true;
    M = {
      skin: toon(0xf2c4a0), hair: toon(0x16151b), black: toon(0x0e0d11), white: toon(0xf6f3ee),
      silver: toon(0xd5d9e0), gold: toon(0xd9a441), eye: basic(0x120f14), mouth: basic(0x7a1224),
      lens: new THREE.MeshBasicMaterial({ color: 0xffb21f, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }),
    };
    scene.add(new THREE.HemisphereLight(0xfff1ec, 0x2a0610, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(4, 8, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xff3048, 1.1); rim.position.set(-5, 3, -6); scene.add(rim);
    const follow = new THREE.PointLight(0xff4a5c, 1.2, 14, 2); scene.add(follow);

    makeTextures();
    progress(0.5, "Thắp sáng các vì sao");
    await frame();
    buildSky(); buildStars(); buildGalaxy(); buildWarp();
    progress(0.6, "Trải khuông nhạc");
    await frame();
    buildPath();
    STATIONS.forEach((_, i) => buildVinyl(i));
    // intro pedestal
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.1, 64), [toon(0x111014), basic(0xffffff, { map: vinylTex("PAT", "Bắt đầu") }), toon(0x111014)]);
    ped.position.set(INTRO.x, -0.06, INTRO.z); scene.add(ped);
    const pedRing = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.025, 8, 80), basic(0xff2a40)); pedRing.rotation.x = Math.PI / 2; pedRing.position.copy(ped.position); scene.add(pedRing);
    updaters.push((t, dt) => (ped.rotation.y += dt * 0.3));
    progress(0.7, "Gọi PAT dậy");
    await frame();
    PAT = buildChibi();
    prebuildAccessories();
    loadWardrobe();
    PAT.root.position.set(INTRO.x, 0, INTRO.z);
    scene.add(PAT.root);
    updaters.push(() => follow.position.copy(PAT.root.position).add(new THREE.Vector3(1.5, 3, 2.5)));
    progress(0.78, "Treo nhạc cụ");
    await frame();
    buildProps();
    buildNotes();
    buildRides();
    buildSoundWave();
    progress(0.86, "Viết từng dòng chữ");
    buildPanels();
    Gallery.build();
    Wardrobe.build();
    fxCanvases.refresh();
    MiniMap.build();
    setupInput();

    // intro framing: close-up on PAT, turntable
    cam.target.set(INTRO.x + introOff(), introTY(), INTRO.z); cam.tGoal.copy(cam.target);
    camera.position.set(INTRO.x + introOff(), 1.45, INTRO.z + introDist()); camera.lookAt(cam.target);
    camera.fov = 34; camera.updateProjectionMatrix();

    // compile every shader and upload every texture before anything is shown (no pop-in / flicker)
    progress(0.92, "Chỉnh âm");
    const hiddenList = [];
    scene.traverse((o) => { if (o.visible === false) { hiddenList.push(o); o.visible = true; } });
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
    hiddenList.forEach((o) => (o.visible = false));
    for (let k = 0; k < 3; k++) { await frame(); tick(); }
    await Promise.race([new Promise((r) => { const iv = setInterval(() => { if (BG.ready()) { clearInterval(iv); r(); } }, 100); }), sleep(8000)]);
    progress(1, "Sẵn sàng");
    await sleep(450);

    state.phase = "intro";
    $("#loader").classList.add("done");
    $("#loader").setAttribute("aria-hidden", "true");
    $("#intro").classList.add("show");
    setTimeout(() => say("Xoay mình thử đi!"), 1200);
  }

  /* ======================================================================
     15. LOOP
     ====================================================================== */
  let lastHover = 0;
  function tick() {
    const rdt = Math.min(clock.getDelta(), 0.25), dt = Math.min(rdt, 0.05);
    const t = clock.elapsedTime;
    U.time.value = t;
    runTweens(performance.now());
    if (state.phase === "intro" || state.phase === "loading") {
      introSpin.v *= 0.96;
      PAT.root.rotation.y += introSpin.v + (Math.abs(introSpin.v) < 0.002 ? Math.sin(t * 0.6) * 0.002 : 0);
      updateCameraIntro(t);
    } else if (cam.mode === "rig") {
      if (!state.moving) cam.tGoal.copy(PAT.root.position).add(new THREE.Vector3(0, 1.2, 0));
      updateCamera(rdt);
    }
    animateChibi(t, dt);
    for (const f of updaters) f(t, dt);
    tickParts(dt);
    BG.tick(dt);
    if (state.phase === "live" && performance.now() - lastHover > 50) { hoverTick(); lastHover = performance.now(); }
    if (state.phase === "live") MiniMap.update(state.u / stationT[stationT.length - 1]);
    // bubble follows head
    if ($("#bubble").classList.contains("on")) {
      const hp = new THREE.Vector3(); PAT.head.getWorldPosition(hp); hp.y += 0.9;
      const p = hp.project(camera);
      const b = $("#bubble"); b.style.left = (p.x * 0.5 + 0.5) * innerWidth + "px"; b.style.top = (-p.y * 0.5 + 0.5) * innerHeight + "px";
    }
    fxCanvases.draw(t);
    Ticket.draw(t);
    renderer.render(scene, camera);
  }
  function updateCameraIntro(t) {
    // desktop: PAT stands right of centre so the name lockup owns the left; phones: name on top, PAT below
    const ic = updateCameraIntro.c || (updateCameraIntro.c = { x: introOff(), y: introTY() });
    ic.x = lerp(ic.x, introOff(), 0.06); ic.y = lerp(ic.y, introTY(), 0.06);
    cam.target.set(INTRO.x + ic.x, ic.y, INTRO.z);
    camera.position.set(INTRO.x + ic.x + Math.sin(t * 0.3) * 0.25, 1.45 + Math.sin(t * 0.5) * 0.08, INTRO.z + introDist());
    camera.lookAt(cam.target);
  }
  const introWide = () => innerWidth > 820 && innerWidth / innerHeight > 1.05;
  const introOff = () => (introWide() ? (state.wardrobe ? -0.35 : -1.25) : 0);
  const introDist = () => (introWide() ? 5.6 : 7.4);
  const introTY = () => (introWide() ? 1.15 : state.wardrobe ? 0.2 : 1.75);
  function loop() { requestAnimationFrame(loop); if (renderer && PAT) tick(); }

  boot().then(loop).catch((e) => {
    console.error(e);
    $("#ldtext").textContent = "Không tải được không gian 3D. Hãy tải lại trang.";
  });
})();
