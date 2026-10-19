import * as THREE from 'three';

// Hiệu ứng vui mắt quanh nhân vật chibi: bụi sao dưới chân, tim & nốt nhạc bay lên,
// cuộn phim và bảng clapper trôi lơ lửng trong xưởng
const SPARKS = 90;

function symbolTexture(draw) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.translate(64, 64);
  g.shadowColor = 'rgba(255,200,120,0.9)';
  g.shadowBlur = 14;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const heart = (color) => symbolTexture((g) => {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, 38);
  g.bezierCurveTo(-60, -2, -34, -52, 0, -22);
  g.bezierCurveTo(34, -52, 60, -2, 0, 38);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.beginPath(); g.ellipse(-20, -18, 9, 6, -0.6, 0, Math.PI * 2); g.fill();
});
const glyph = (ch, color) => symbolTexture((g) => {
  g.fillStyle = color;
  g.font = 'bold 92px serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(ch, 0, 4);
});

function clapperTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#f5efe2';
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#16131a';
  for (let x = -40; x < 256; x += 56) {
    g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 28, 0); g.lineTo(x + 56, 0); g.lineTo(x + 28, 64); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Fx {
  constructor(world) {
    this.world = world;
    const scene = world.scene;

    /* ---- bụi sao: một Points, mỗi hạt tự sống rồi tắt ---- */
    this.sp = Array.from({ length: SPARKS }, () => ({ life: 0, max: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), size: 1, hue: 0 }));
    this.spNext = 0;
    const g = new THREE.BufferGeometry();
    this.spPos = new Float32Array(SPARKS * 3);
    this.spA = new Float32Array(SPARKS * 3); // alpha, size, hue
    g.setAttribute('position', new THREE.BufferAttribute(this.spPos, 3));
    g.setAttribute('aInfo', new THREE.BufferAttribute(this.spA, 3));
    this.sparks = new THREE.Points(g, new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uPR: { value: world.renderer.getPixelRatio() }, uTime: world.uniforms.uTime },
      vertexShader: /* glsl */ `
        uniform float uPR; attribute vec3 aInfo; varying vec3 vInfo;
        void main() {
          vInfo = aInfo;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aInfo.y * uPR * (260.0 / -mv.z) * step(0.001, aInfo.x);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; varying vec3 vInfo;
        void main() {
          vec2 q = gl_PointCoord - 0.5;
          float r = vInfo.z * 6.28 + uTime * 2.0;
          q = mat2(cos(r), -sin(r), sin(r), cos(r)) * q;
          // ngôi sao 4 cánh + lõi tròn
          float star = max(0.0, 1.0 - abs(q.x * q.y) * 90.0 - length(q) * 2.0);
          float core = smoothstep(0.18, 0.0, length(q));
          vec3 gold = vec3(1.0, 0.78, 0.35), pink = vec3(1.0, 0.55, 0.7), mint = vec3(0.6, 1.0, 0.85);
          vec3 c = vInfo.z < 0.6 ? gold : (vInfo.z < 0.85 ? pink : mint);
          gl_FragColor = vec4(c * (star + core) * vInfo.x * 1.6, 1.0);
        }`,
    }));
    this.sparks.frustumCulled = false;
    scene.add(this.sparks);

    /* ---- tim & nốt nhạc bay lên khi đứng chờ ---- */
    const texs = [heart('#ff6f91'), heart('#ffb347'), glyph('♪', '#ffd36e'), glyph('♫', '#ffffff'), glyph('★', '#ffe08a')];
    this.symTex = texs;
    this.syms = texs.concat(texs).map((map) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, opacity: 0, fog: false, toneMapped: false }));
      s.visible = false;
      s.userData = { life: 0, max: 2.6, base: new THREE.Vector3(), drift: 0 };
      scene.add(s);
      return s;
    });
    this.symNext = 0;
    this.symTimer = 0;
    this.emoteTex = { heart: texs[0], note: texs[2], note2: texs[3], star: texs[4], sparkle: glyph('✦', '#ffe08a') };

    /* ---- cuộn phim & bảng clapper trôi lơ lửng ---- */
    this.props = [];
    const gold = new THREE.MeshStandardMaterial({ color: '#d9a650', metalness: 0.85, roughness: 0.3, emissive: '#3a2008' });
    const dark = new THREE.MeshStandardMaterial({ color: '#1b1820', metalness: 0.3, roughness: 0.6 });
    const film = new THREE.MeshStandardMaterial({ color: '#2a1d14', roughness: 0.5, emissive: '#1a0d04' });
    const reelShape = () => {
      const s = new THREE.Shape();
      s.absarc(0, 0, 1, 0, Math.PI * 2, false);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const h = new THREE.Path();
        h.absarc(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.24, 0, Math.PI * 2, true);
        s.holes.push(h);
      }
      const hub = new THREE.Path();
      hub.absarc(0, 0, 0.1, 0, Math.PI * 2, true);
      s.holes.push(hub);
      return s;
    };
    const reelGeo = new THREE.ExtrudeGeometry(reelShape(), { depth: 0.06, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 24 });
    const makeReel = () => {
      const r = new THREE.Group();
      const a = new THREE.Mesh(reelGeo, gold);
      a.position.z = 0.16;
      const b = new THREE.Mesh(reelGeo, gold);
      b.position.z = -0.22;
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.3, 32), film);
      core.rotation.x = Math.PI / 2;
      // dải phim tuôn ra một đoạn
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.3, 12, 1), new THREE.MeshStandardMaterial({ color: '#3a2a1c', side: THREE.DoubleSide, emissive: '#160a02' }));
      const sp = strip.geometry.attributes.position;
      for (let i = 0; i < sp.count; i++) {
        const x = sp.getX(i);
        sp.setXYZ(i, x, sp.getY(i) - 0.72, Math.sin(x * 2.2) * 0.25);
      }
      strip.geometry.computeVertexNormals();
      strip.position.x = 1.1;
      strip.rotation.x = Math.PI / 2;
      strip.rotation.z = 0.0;
      r.add(a, b, core, strip);
      return r;
    };
    const clapTex = clapperTexture();
    const stripe = new THREE.MeshStandardMaterial({ map: clapTex, roughness: 0.5 });
    const makeClapper = () => {
      const c = new THREE.Group();
      const slate = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 0.1), dark);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.08), new THREE.MeshBasicMaterial({ color: '#f5efe2' }));
      label.position.set(0, 0.1, 0.06);
      const label2 = label.clone();
      label2.position.y = -0.3;
      const base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 0.12), stripe);
      base.position.y = 0.9;
      const arm = new THREE.Group();
      arm.position.set(-1, 1.06, 0);
      const top = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 0.12), stripe);
      top.position.set(1, 0.15, 0);
      arm.add(top);
      c.add(slate, label, label2, base, arm);
      c.userData.arm = arm;
      return c;
    };
    const n = world.isMobile ? 8 : 14;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n + (Math.random() - 0.5) * 0.03;
      const { p, side } = world.frameAt(u);
      const sgn = i % 2 ? 1 : -1;
      const obj = i % 3 === 1 ? makeClapper() : makeReel();
      obj.position.copy(p).addScaledVector(side, sgn * (9 + Math.random() * 6));
      obj.position.y = -0.5 + Math.random() * 6.5;
      obj.scale.setScalar(0.7 + Math.random() * 0.5);
      obj.rotation.set(Math.random() * 0.6, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.6);
      obj.userData.base = obj.position.clone();
      obj.userData.spin = (Math.random() - 0.5) * 0.6;
      obj.userData.ph = Math.random() * 10;
      // vùng bấm: chạm vào thì đạo cụ xoay vù vù
      const hit = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
      hit.userData = { kind: 'prop', spinBoost: 0 };
      obj.add(hit);
      obj.userData.hit = hit;
      world.clickables.push(hit);
      scene.add(obj);
      this.props.push(obj);
    }
  }

  spark(p, v, life, size) {
    const s = this.sp[this.spNext];
    this.spNext = (this.spNext + 1) % SPARKS;
    s.p.copy(p);
    s.v.copy(v);
    s.life = s.max = life;
    s.size = size;
    s.hue = Math.random();
  }

  // bước chân: vài hạt sao bắn ra hai bên gót
  step(foot) {
    const p = foot.clone();
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2;
      this.spark(p, new THREE.Vector3(Math.cos(a) * 0.9, 1.2 + Math.random() * 1.4, Math.sin(a) * 0.9), 0.7 + Math.random() * 0.5, 0.35 + Math.random() * 0.3);
    }
  }

  // tung chùm sao quanh nhân vật (khi tới chương mới, khi nhảy)
  burst(center, n = 24) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const v = new THREE.Vector3(Math.cos(a) * 2.6, 1.5 + Math.random() * 2.5, Math.sin(a) * 2.6);
      this.spark(center, v, 1 + Math.random() * 0.6, 0.45 + Math.random() * 0.35);
    }
  }

  // biểu cảm của màn diễn: một biểu tượng to bật lên trên đầu
  emote(kind, at) {
    const s = this.syms[this.symNext];
    this.symNext = (this.symNext + 1) % this.syms.length;
    s.material.map = this.emoteTex[kind] || this.emoteTex.star;
    s.userData.life = s.userData.max;
    s.userData.base.set(at.x, at.y + 4.4, at.z);
    s.userData.drift = 0;
    s.userData.big = 1.8;
    s.visible = true;
    this.burst(new THREE.Vector3(at.x, at.y + 3.6, at.z), 12);
  }

  update(dt, time, hero) {
    // hạt sao
    for (let i = 0; i < SPARKS; i++) {
      const s = this.sp[i];
      if (s.life > 0) {
        s.life -= dt;
        s.v.y -= 2.2 * dt;
        s.v.multiplyScalar(1 - 1.5 * dt);
        s.p.addScaledVector(s.v, dt);
      }
      const k = Math.max(0, s.life / s.max);
      this.spPos.set([s.p.x, s.p.y, s.p.z], i * 3);
      this.spA.set([k > 0 ? Math.min(1, k * 2.5) : 0, s.size * (0.6 + 0.4 * k), s.hue], i * 3);
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
    this.sparks.geometry.attributes.aInfo.needsUpdate = true;

    // tim, nốt nhạc nổi lên từ đầu khi nhân vật đứng chờ
    const head = hero.root.position;
    this.symTimer -= dt;
    if (hero.idleTime > 2.5 && this.symTimer < 0) {
      this.symTimer = 0.9 + Math.random() * 0.6;
      const s = this.syms[this.symNext];
      this.symNext = (this.symNext + 1) % this.syms.length;
      s.material.map = this.symTex[Math.floor(Math.random() * this.symTex.length)];
      s.userData.life = s.userData.max;
      s.userData.base.set(head.x + (Math.random() - 0.5) * 1.6, head.y + 3.6, head.z + (Math.random() - 0.5) * 1.6);
      s.userData.drift = Math.random() * 6;
      s.userData.big = 1;
      s.visible = true;
    }
    for (const s of this.syms) {
      const d = s.userData;
      if (d.life <= 0) { s.visible = false; continue; }
      d.life -= dt;
      const k = 1 - d.life / d.max; // 0 → 1
      s.position.copy(d.base);
      s.position.y += k * 2.4;
      s.position.x += Math.sin(time * 3 + d.drift) * 0.25;
      const pop = Math.min(1, k * 6);
      s.scale.setScalar(0.55 * (d.big || 1) * (0.4 + 0.6 * pop) * (1 + Math.sin(time * 8 + d.drift) * 0.06));
      s.material.opacity = Math.min(1, k * 6) * Math.min(1, (1 - k) * 3);
    }

    // đạo cụ trôi
    for (const o of this.props) {
      const d = o.userData;
      o.position.y = d.base.y + Math.sin(time * 0.6 + d.ph) * 0.5;
      const hu = d.hit.userData;
      hu.spinBoost = Math.max(0, hu.spinBoost - dt * 3);
      o.rotation.y += (d.spin + hu.spinBoost * 3) * dt;
      o.rotation.x += hu.spinBoost * dt * 1.5;
      o.rotation.z = Math.sin(time * 0.4 + d.ph) * 0.25;
      if (d.arm) d.arm.rotation.z = Math.max(0, Math.sin(time * 1.4 + d.ph)) * 0.5; // clapper đập nhịp
    }
  }
}
