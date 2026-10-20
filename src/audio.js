// Nhạc nền + SFX. Nhạc đã chuẩn hoá ~-18 LUFS, phát ở mức nhỏ (gain 0.42 ≈ -25 LUFS) cho cảm giác bay bổng.
// Khi có âm thanh khác trên trang (showreel, video dự án) nhạc nền nhỏ dần rồi tạm dừng,
// xong việc thì nhạc nhẹ nhàng lớn lại và phát tiếp đúng đoạn đang dừng.

const MUSIC_GAIN = 0.42;
const KEY = 'at-sound';

export class SoundScape {
  constructor(src) {
    this.src = src;
    this.ctx = null;
    this.el = null;
    this.duckers = new Set();
    this.enabled = (() => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } })();
    this.started = false;
    this.listeners = [];
  }

  // tải trọn file trước (blob) để khi phát không bị khựng do đang tải
  async preload(onProgress) {
    if (!this.src) return;
    try {
      const res = await fetch(this.src);
      if (!res.ok) throw new Error(res.status);
      const total = +res.headers.get('content-length') || 0;
      if (!res.body || !total) { this.blobUrl = URL.createObjectURL(await res.blob()); return; }
      const reader = res.body.getReader();
      const chunks = [];
      let got = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); got += value.length;
        onProgress?.(got / total);
      }
      this.blobUrl = URL.createObjectURL(new Blob(chunks, { type: 'audio/mpeg' }));
    } catch (e) {
      console.warn('Không tải được nhạc nền', e);
      this.blobUrl = this.src; // vẫn phát trực tiếp nếu tải trước thất bại
    }
  }

  // gọi trong cú chạm của người dùng (nút Bước vào) để trình duyệt cho phép phát tiếng
  start() {
    if (this.started || !this.blobUrl) return;
    this.started = true;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = AC ? new AC() : null;
    const el = new Audio();
    el.src = this.blobUrl;
    el.loop = true;
    el.preload = 'auto';
    el.crossOrigin = 'anonymous';
    this.el = el;
    if (this.ctx) {
      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0;
      this.ctx.createMediaElementSource(el).connect(this.gain).connect(this.ctx.destination);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 1;
      this.sfx.connect(this.ctx.destination);
    } else el.volume = 0;
    if (this.enabled) this.resume(2.8);
    this.emit();
  }

  level() { return this.enabled && this.duckers.size === 0 ? MUSIC_GAIN : 0; }

  fadeTo(v, sec) {
    if (this.ctx) {
      const g = this.gain.gain, now = this.ctx.currentTime;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(v, now + sec);
    } else if (this.el) {
      const from = this.el.volume, t0 = performance.now();
      const step = () => {
        const k = Math.min((performance.now() - t0) / (sec * 1000), 1);
        this.el.volume = from + (v - from) * k;
        if (k < 1) requestAnimationFrame(step);
      };
      step();
    }
  }

  resume(sec = 1.8) {
    if (!this.el) return;
    clearTimeout(this.pauseT);
    this.ctx?.resume();
    const p = this.el.play();
    p?.catch?.(() => {});
    this.fadeTo(this.level(), sec);
  }

  pause(sec = 0.9) {
    if (!this.el) return;
    this.fadeTo(0, sec);
    clearTimeout(this.pauseT);
    // dừng hẳn sau khi nhỏ dần để lúc quay lại phát tiếp đúng đoạn đang ngắt
    this.pauseT = setTimeout(() => this.el.pause(), sec * 1000 + 60);
  }

  // id: nguồn âm thanh khác đang phát (showreel, video dự án...)
  duck(id, on) {
    const had = this.duckers.size > 0;
    if (on) this.duckers.add(id); else this.duckers.delete(id);
    const has = this.duckers.size > 0;
    if (!this.enabled || had === has) return;
    if (has) this.pause(0.9); else this.resume(2.4);
  }

  toggle() {
    this.enabled = !this.enabled;
    try { localStorage.setItem(KEY, this.enabled ? 'on' : 'off'); } catch {}
    if (!this.started) { this.emit(); return; }
    if (this.enabled && this.duckers.size === 0) this.resume(1.2);
    else this.pause(0.6);
    this.emit();
  }

  onChange(fn) { this.listeners.push(fn); fn(this); }
  emit() { for (const f of this.listeners) f(this); }

  // tiếng "vút" rất khẽ khi lướt qua mỗi chương: tiếng ồn trắng lọc dải, quét tần số, tăng giảm mềm
  swoosh(strength = 1) {
    if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return;
    const ctx = this.ctx, now = ctx.currentTime, dur = 0.9;
    if (!this.noise) {
      const b = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = b;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(380, now);
    bp.frequency.exponentialRampToValueAtTime(2600, now + dur * 0.55);
    bp.frequency.exponentialRampToValueAtTime(900, now + dur);
    const g = ctx.createGain();
    const peak = 0.05 * strength;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + dur * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) {
      pan.pan.setValueAtTime(-0.5, now);
      pan.pan.linearRampToValueAtTime(0.5, now + dur);
      src.connect(bp).connect(g).connect(pan).connect(this.sfx);
    } else src.connect(bp).connect(g).connect(this.sfx);
    src.start(now);
    src.stop(now + dur + 0.05);
  }
}
