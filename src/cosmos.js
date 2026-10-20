import * as THREE from 'three';

// Ngôi sao là "key asset": thiên hà xoắn ốc trên trời, bầu sao lấp lánh, sao băng,
// ngôi sao sáng nhất bay trên đầu nhân vật (chính là Anh Tú), hoạt ảnh riêng cho từng dự án
// và chiếc chìa khóa vàng ở chương cuối.

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ngôi sao 4 cánh có quầng sáng (dùng cho sao chính, sao băng, lấp lánh)
export function flareTexture(rgb = '255,220,160') {
  return canvasTex(256, 256, (g) => {
    g.translate(128, 128);
    const halo = g.createRadialGradient(0, 0, 0, 0, 0, 128);
    halo.addColorStop(0, `rgba(${rgb},1)`);
    halo.addColorStop(0.08, `rgba(${rgb},0.85)`);
    halo.addColorStop(0.3, `rgba(${rgb},0.18)`);
    halo.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = halo;
    g.fillRect(-128, -128, 256, 256);
    g.globalCompositeOperation = 'lighter';
    for (const [len, wid, rot] of [[128, 5, 0], [128, 5, Math.PI / 2], [70, 3, Math.PI / 4], [70, 3, -Math.PI / 4]]) {
      g.save();
      g.rotate(rot);
      const gr = g.createLinearGradient(-len, 0, len, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.5, 'rgba(255,255,255,1)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(0, 0, len, wid, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  });
}

export function glyphTexture(ch, color, font = 'bold 92px serif') {
  return canvasTex(128, 128, (g) => {
    g.translate(64, 64);
    g.shadowColor = 'rgba(255,200,120,0.9)';
    g.shadowBlur = 14;
    g.fillStyle = color;
    g.font = font;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(ch, 0, 4);
  });
}

export function heartTexture(color = '#ff6f91') {
  return canvasTex(128, 128, (g) => {
    g.translate(64, 64);
    g.shadowColor = 'rgba(255,160,180,0.9)';
    g.shadowBlur = 14;
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(0, 38);
    g.bezierCurveTo(-60, -2, -34, -52, 0, -22);
    g.bezierCurveTo(34, -52, 60, -2, 0, 38);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.beginPath(); g.ellipse(-20, -18, 9, 6, -0.6, 0, Math.PI * 2); g.fill();
  });
}

const sprite = (map, opts = {}) => new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, fog: false, toneMapped: false, ...opts }));

/* ---------------- Thiên hà xoắn ốc ---------------- */
export function buildGalaxy(uniforms, pr, mobile) {
  const g = new THREE.Group();
  const n = mobile ? 7000 : 15000;
  const R = 120;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), rnd = new Float32Array(n);
  const core = new THREE.Color('#fff1d6'), mid = new THREE.Color('#ffb36b'), outA = new THREE.Color('#7f8cff'), outB = new THREE.Color('#ff7fc8');
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const arm = i % 4;
    const r = Math.pow(Math.random(), 1.7) * R;
    const spread = (Math.random() - 0.5) * (0.5 + 18 / (r + 6));
    const a = (arm / 4) * Math.PI * 2 + r * 0.038 + spread;
    const y = (Math.random() - 0.5) * (2 + 10 * Math.exp(-r / 20));
    pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
    const k = r / R;
    c.copy(core).lerp(mid, Math.min(1, k * 2.5)).lerp(arm % 2 ? outA : outB, THREE.MathUtils.smoothstep(k, 0.3, 0.9));
    col.set([c.r, c.g, c.b], i * 3);
    rnd[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
  const pts = new THREE.Points(geo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    uniforms: { uTime: uniforms.uTime, uPR: { value: pr } },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uPR; attribute float aRnd; varying vec3 vC; varying float vA;
      void main(){
        vec3 p = position;
        float r = length(p.xz);
        float a = uTime * (0.02 + 0.5 / (r + 12.0));
        p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.0 + 2.6 * pow(aRnd, 4.0)) * uPR * (180.0 / -mv.z) + 0.6;
        vC = color;
        vA = 0.55 + 0.45 * sin(uTime * (1.0 + aRnd * 3.0) + aRnd * 80.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vC; varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vC * smoothstep(0.5, 0.0, d) * vA, 1.0); }`,
  }));
  g.add(pts);
  // lõi thiên hà rực sáng
  const coreGlow = sprite(flareTexture('255,214,160'), { blending: THREE.AdditiveBlending, opacity: 0.9 });
  coreGlow.scale.setScalar(60);
  g.add(coreGlow);
  g.position.set(0, 70, 0);
  g.rotation.set(0.42, 0, 0.2);
  return { group: g, pts };
}

/* ---------------- Bầu sao lấp lánh ---------------- */
export function buildStarfield(uniforms, pr, mobile) {
  const n = mobile ? 1500 : 3000;
  const pos = new Float32Array(n * 3), rnd = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = Math.random(), v = 0.08 + Math.random() * 0.92; // chủ yếu phía trên đường chân trời
    const th = u * Math.PI * 2, ph = Math.acos(v);
    const r = 330;
    pos.set([Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r - 20, Math.sin(ph) * Math.sin(th) * r], i * 3);
    rnd[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
  return new THREE.Points(geo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: uniforms.uTime, uPR: { value: pr } },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uPR; attribute float aRnd; varying float vA; varying float vR;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.2 + 3.5 * pow(aRnd, 6.0)) * uPR;
        vA = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (0.8 + aRnd * 2.5) + aRnd * 100.0), 2.0);
        vR = aRnd;
      }`,
    fragmentShader: /* glsl */ `
      varying float vA; varying float vR;
      void main(){
        vec2 q = gl_PointCoord - 0.5;
        float d = length(q);
        float cross = max(0.0, 1.0 - abs(q.x * q.y) * 300.0 - d * 1.6) * step(0.92, vR);
        vec3 c = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.85, 0.65), vR);
        gl_FragColor = vec4(c * (smoothstep(0.5, 0.0, d) + cross) * vA, 1.0);
      }`,
  }));
}

/* ---------------- Sao băng ---------------- */
export class ShootingStars {
  constructor(scene, n = 3) {
    const tex = canvasTex(512, 32, (g) => {
      const gr = g.createLinearGradient(0, 0, 512, 0);
      gr.addColorStop(0, 'rgba(255,220,170,0)');
      gr.addColorStop(0.85, 'rgba(255,230,190,0.8)');
      gr.addColorStop(1, 'rgba(255,255,255,1)');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, 16); g.lineTo(500, 10); g.arc(500, 16, 6, -Math.PI / 2, Math.PI / 2); g.lineTo(0, 16); g.fill();
    });
    this.items = Array.from({ length: n }, () => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(26, 1.6), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide }));
      m.visible = false;
      m.userData = { life: 0, wait: 2 + Math.random() * 6, dir: new THREE.Vector3() };
      scene.add(m);
      return m;
    });
  }

  update(dt, camera) {
    for (const m of this.items) {
      const d = m.userData;
      if (d.life <= 0) {
        d.wait -= dt;
        m.visible = false;
        if (d.wait > 0) continue;
        // xuất hiện phía trước & phía trên máy quay để người xem bắt gặp
        const f = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
        const side = new THREE.Vector3(-f.z, 0, f.x);
        const start = camera.position.clone().addScaledVector(f, 140 + Math.random() * 60).addScaledVector(side, (Math.random() - 0.5) * 160);
        start.y += 35 + Math.random() * 35;
        m.position.copy(start);
        d.dir.copy(side).multiplyScalar(Math.random() < 0.5 ? 1 : -1).add(new THREE.Vector3(0, -0.45, 0)).normalize();
        m.lookAt(camera.position);
        const ang = Math.atan2(0.45, 1);
        m.rotateZ(d.dir.dot(side) > 0 ? -ang : Math.PI + ang);
        d.life = d.max = 1.1;
        d.wait = 3 + Math.random() * 7;
        m.visible = true;
      }
      d.life -= dt;
      m.position.addScaledVector(d.dir, dt * 120);
      const k = 1 - d.life / d.max;
      m.material.opacity = Math.sin(Math.min(1, k) * Math.PI);
    }
  }
}

/* ---------------- Ngôi sao sáng nhất: Anh Tú ---------------- */
export function buildHeroStar(name = 'Anh Tú') {
  const g = new THREE.Group();
  const flare = sprite(flareTexture('255,226,170'), { blending: THREE.AdditiveBlending });
  flare.scale.setScalar(3.4);
  g.add(flare);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4d6').multiplyScalar(3) }));
  g.add(core);
  const label = sprite(canvasTex(1024, 160, (x, w, h) => {
    x.font = 'italic 300 84px "Cormorant Garamond", serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = 'rgba(255,200,120,0.9)'; x.shadowBlur = 18;
    x.fillStyle = '#ffe9c4';
    x.fillText(`✦ ${name} ✦`, w / 2, h / 2);
  }), { opacity: 0 });
  label.scale.set(4.4, 0.7, 1);
  label.position.y = 1.1;
  g.add(label);
  // vùng bấm rộng hơn ngôi sao một chút
  const hit = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.kind = 'star';
  g.add(hit);
  return { group: g, flare, core, label, hit };
}

/* ---------------- Hoạt ảnh riêng cho từng dự án ---------------- */
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1, ...extra });

function risers(group, maps, n, spread = 0.8, size = 0.5) {
  const list = Array.from({ length: n }, (_, i) => {
    const s = sprite(maps[i % maps.length], { opacity: 0 });
    s.userData.ph = i / n;
    s.userData.x = (Math.random() - 0.5) * spread;
    s.userData.size = size;
    group.add(s);
    return s;
  });
  return (t, speed, base = 0, height = 2.2) => {
    for (const s of list) {
      const k = (t * 0.35 * speed + s.userData.ph) % 1;
      s.position.set(s.userData.x + Math.sin(k * 9 + s.userData.ph * 20) * 0.25, base + k * height, 0.2);
      s.material.opacity = Math.sin(k * Math.PI);
      s.scale.setScalar(s.userData.size * (0.6 + k * 0.6));
    }
  };
}

const steamMap = () => canvasTex(64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
});

// tài nguyên tải bất đồng bộ của các vật thể, để màn chờ đợi tải xong mới cho vào
export const ASSET_LOADS = [];
const JAR_LABEL = '/textures/ggg-jar.jpg';

const MAKERS = {
  // MV: đĩa than quay, kim đọc, nốt nhạc bay
  vinyl() {
    const g = new THREE.Group();
    const disc = new THREE.Group();
    disc.add(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.05, 48), std('#111014', { roughness: 0.25, metalness: 0.4 })));
    for (const r of [0.55, 0.7, 0.85, 1.0]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 4, 64), std('#3a3540', { metalness: 0.8 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.03; disc.add(ring);
    }
    const label = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 32), std('#e3a95c', { metalness: 0.6, emissive: '#3a2008' }));
    disc.add(label);
    disc.rotation.x = 1.15;
    g.add(disc);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.2), std('#d8d8de', { metalness: 1, roughness: 0.2 }));
    arm.position.set(0.9, 0.5, 0.4); arm.rotation.set(0.4, 0.5, 0);
    g.add(arm);
    const notes = risers(g, [glyphTexture('♪', '#ffd36e'), glyphTexture('♫', '#ffffff')], 5, 1.6, 0.55);
    return { g, update: (t, sp, dt) => { disc.rotation.y += dt * 2.2 * sp; arm.rotation.z = Math.sin(t * 2) * 0.05; notes(t, sp, 0.4); } };
  },
  // VIFON: tô mì bốc khói, đũa gắp sợi mì lên xuống
  bowl() {
    const g = new THREE.Group();
    const pts = [];
    for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI * 0.5; pts.push(new THREE.Vector2(Math.sin(a) * 1.0 + 0.02, -Math.cos(a) * 0.7)); }
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), std('#c8342b', { side: THREE.DoubleSide }));
    g.add(bowl);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.01, 0.04, 8, 48), std('#f2e6c8'));
    rim.rotation.x = Math.PI / 2; g.add(rim);
    const soup = new THREE.Mesh(new THREE.CircleGeometry(0.95, 40), std('#e8a13a', { emissive: '#4a2205' }));
    soup.rotation.x = -Math.PI / 2; soup.position.y = -0.12; g.add(soup);
    const noodleMat = std('#f5d27a', { emissive: '#3a2a05' });
    for (let i = 0; i < 7; i++) {
      const c = new THREE.CatmullRomCurve3(Array.from({ length: 6 }, (_, k) => new THREE.Vector3(Math.cos(i + k) * 0.5, -0.08 + Math.sin(k * 2 + i) * 0.03, Math.sin(i * 2 + k) * 0.5)));
      g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 30, 0.03, 5), noodleMat));
    }
    const sticks = new THREE.Group();
    for (const dx of [-0.07, 0.07]) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 2.2, 8), std('#d9b48a'));
      s.position.x = dx; s.rotation.z = dx * 0.6; sticks.add(s);
    }
    const lifted = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, -1.0, 0), new THREE.Vector3(0.1, -0.5, 0.05), new THREE.Vector3(-0.05, 0, 0)]), 20, 0.03, 5), noodleMat);
    sticks.add(lifted);
    sticks.rotation.z = -0.4;
    g.add(sticks);
    const steam = risers(g, [steamMap()], 6, 1.2, 0.9);
    g.rotation.x = 0.35;
    return { g, update: (t, sp) => { sticks.position.set(0.25, 0.9 + Math.max(0, Math.sin(t * 1.8 * sp)) * 0.5, 0); steam(t, sp * 0.7, 0.2, 2.4); } };
  },
  // VIFON TikTok: điện thoại dọc phát video, tim tung lên
  phone() {
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    const w = 0.7, h = 1.35, r = 0.14;
    shape.moveTo(-w + r, -h); shape.lineTo(w - r, -h); shape.quadraticCurveTo(w, -h, w, -h + r); shape.lineTo(w, h - r); shape.quadraticCurveTo(w, h, w - r, h);
    shape.lineTo(-w + r, h); shape.quadraticCurveTo(-w, h, -w, h - r); shape.lineTo(-w, -h + r); shape.quadraticCurveTo(-w, -h, -w + r, -h);
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 }), std('#1a1820', { metalness: 0.6, roughness: 0.3 }));
    g.add(body);
    const screenMat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: /* glsl */ `
        uniform float uT; varying vec2 vUv;
        void main(){
          vec3 a = vec3(1.0, 0.3, 0.45), b = vec3(0.15, 0.85, 0.9);
          vec3 c = mix(a, b, 0.5 + 0.5 * sin(vUv.y * 4.0 + uT * 1.5));
          c *= 0.55 + 0.45 * sin(vUv.x * 10.0 - uT * 3.0 + vUv.y * 6.0);
          vec2 p = vUv - vec2(0.5, 0.55);
          float tri = step(abs(p.y) * 1.7, 0.08 - p.x * 0.9) * step(-0.06, p.x);
          c = mix(c, vec3(1.0), tri);
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 2.5), screenMat);
    screen.position.z = 0.14;
    g.add(screen);
    const hearts = risers(g, [heartTexture('#ff4f7b'), heartTexture('#ffb347'), glyphTexture('♥', '#ff8fb0')], 7, 1.4, 0.5);
    return { g, update: (t, sp) => { screenMat.uniforms.uT.value = t * sp; g.rotation.z = Math.sin(t * 1.2) * 0.12; g.rotation.y = Math.sin(t * 0.8) * 0.3; hearts(t, sp * 1.3, 1.0, 2); } };
  },
  // VIFON: ly mì nắp bật lên xoay tròn, khói bay
  cup() {
    const g = new THREE.Group();
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.52, 1.4, 40, 1, true), std('#f7f1e6', { side: THREE.DoubleSide }));
    g.add(cup);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.71, 0.6, 0.45, 40, 1, true), std('#d3302a', { side: THREE.DoubleSide }));
    band.position.y = 0.05; g.add(band);
    const inside = new THREE.Mesh(new THREE.CircleGeometry(0.72, 32), std('#f2c86a', { emissive: '#3a2505' }));
    inside.rotation.x = -Math.PI / 2; inside.position.y = 0.55; g.add(inside);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.03, 40), std('#e3a95c', { metalness: 0.7, roughness: 0.3 }));
    g.add(lid);
    const steam = risers(g, [steamMap()], 6, 1, 0.8);
    return { g, update: (t, sp) => {
      const k = (t * 0.4 * sp) % 1;
      const pop = Math.sin(Math.min(k / 0.6, 1) * Math.PI);
      lid.position.set(pop * 0.4, 0.72 + pop * 1.1, 0);
      lid.rotation.set(pop * 1.2, t * 3, pop * 0.5);
      steam(t, sp, 0.7, 2.2);
      g.rotation.y = Math.sin(t * 0.6) * 0.3;
    } };
  },
  // G.G.G wonderglow Cooling Dewy Mask: hũ xanh nhám, nắp trắng bóng, nắp mở ra rồi đóng, bong bóng óng ánh bay lên
  beauty() {
    const g = new THREE.Group();
    const tex = new THREE.Texture();
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    ASSET_LOADS.push(new Promise((res) => new THREE.TextureLoader().load(JAR_LABEL, (t) => { tex.image = t.image; tex.needsUpdate = true; res(); }, undefined, res)));
    const jar = new THREE.Group();
    jar.rotation.y = Math.PI; // nhãn G.G.G hướng ra trước
    g.add(jar);
    const bodyMat = new THREE.MeshPhysicalMaterial({ map: tex, color: '#ffffff', roughness: 0.55, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.6 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.7, 0.8, 64, 1, true), bodyMat);
    jar.add(body);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.7, 48), new THREE.MeshStandardMaterial({ color: '#7fd0f2', roughness: 0.6 }));
    bottom.rotation.x = Math.PI / 2; bottom.position.y = -0.4; jar.add(bottom);
    // kem dưỡng bên trong, lộ ra khi mở nắp
    const cream = new THREE.Mesh(new THREE.CircleGeometry(0.68, 48), new THREE.MeshStandardMaterial({ color: '#e9f8ff', roughness: 0.25, emissive: '#3b6d86', emissiveIntensity: 0.25 }));
    cream.rotation.x = -Math.PI / 2; cream.position.y = 0.36; jar.add(cream);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.71, 0.025, 8, 64), new THREE.MeshStandardMaterial({ color: '#9fe0fb', roughness: 0.4 }));
    lip.rotation.x = Math.PI / 2; lip.position.y = 0.4; jar.add(lip);
    const lidMat = new THREE.MeshPhysicalMaterial({ color: '#f6f8fc', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
    const lid = new THREE.Group();
    const lidSide = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.48, 64), lidMat);
    lid.add(lidSide);
    const lidTop = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 10, 64), lidMat);
    lidTop.rotation.x = Math.PI / 2; lidTop.position.y = 0.24; lid.add(lidTop);
    lid.position.y = 0.64;
    jar.add(lid);
    const bubbleMat = new THREE.MeshStandardMaterial({ color: '#e8f6ff', emissive: '#4a7a99', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.45, depthWrite: false });
    const bubbles = Array.from({ length: 7 }, (_, i) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.08 + (i % 3) * 0.05, 16, 12), bubbleMat);
      b.userData.ph = i / 7; b.userData.x = (Math.random() - 0.5) * 1.2;
      g.add(b);
      return b;
    });
    const sparkle = risers(g, [glyphTexture('✦', '#bfeaff'), glyphTexture('✧', '#ffffff')], 4, 1.6, 0.4);
    return { g, update: (t, sp) => {
      jar.rotation.y = Math.PI + Math.sin(t * 0.7) * 0.6;
      g.rotation.x = 0.18;
      const k = (t * 0.25 * sp) % 1;
      const open = THREE.MathUtils.smoothstep(k, 0.1, 0.3) * (1 - THREE.MathUtils.smoothstep(k, 0.75, 0.95));
      lid.position.set(-open * 0.5, 0.64 + open * 0.9, 0);
      lid.rotation.z = open * 0.55;
      for (const b of bubbles) {
        const q = (t * 0.25 * sp + b.userData.ph) % 1;
        b.position.set(b.userData.x + Math.sin(q * 8) * 0.2, 0.3 + q * 2.4 * (0.3 + open), 0.1);
        b.scale.setScalar((Math.sin(q * Math.PI) + 0.01) * (0.4 + open * 0.6));
      }
      sparkle(t, sp, 0.6, 2);
    } };
  },
};
export const PROJECT_ANIMS = Object.keys(MAKERS);
export function makeProjectAsset(kind, i) {
  const make = MAKERS[kind] || MAKERS[PROJECT_ANIMS[i % PROJECT_ANIMS.length]];
  return make();
}

/* ---------------- Chìa khóa vàng ---------------- */
export function buildKey() {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: '#f2c062', metalness: 1, roughness: 0.22, emissive: '#6a3f0c', emissiveIntensity: 0.8 });
  const key = new THREE.Group();
  const bow = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.22, 20, 64), gold);
  bow.position.y = 1.6;
  key.add(bow);
  // ngôi sao trong vòng chìa
  const s = new THREE.Shape();
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + Math.PI / 2;
    const r = k % 2 ? 0.28 : 0.68;
    if (k) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const star = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04 }), gold);
  star.position.set(0, 1.6, -0.06);
  key.add(star);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.32, 24), gold);
  collar.position.y = 0.38;
  key.add(collar);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.6, 20), gold);
  shaft.position.y = -1.5;
  key.add(shaft);
  for (const [y, w] of [[-2.7, 0.7], [-3.1, 0.5]]) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(w, 0.26, 0.2), gold);
    tooth.position.set(w / 2, y, 0);
    key.add(tooth);
  }
  key.scale.setScalar(1.15);
  g.add(key);
  const halo = sprite(flareTexture('255,200,120'), { blending: THREE.AdditiveBlending, opacity: 0.8 });
  halo.scale.setScalar(16);
  halo.position.y = 1.6;
  g.add(halo);
  const rays = sprite(canvasTex(512, 512, (x) => {
    x.translate(256, 256);
    for (let i = 0; i < 24; i++) {
      x.rotate((Math.PI * 2) / 24);
      const gr = x.createLinearGradient(0, 0, 250, 0);
      gr.addColorStop(0, 'rgba(255,214,150,0.5)');
      gr.addColorStop(1, 'rgba(255,214,150,0)');
      x.fillStyle = gr;
      x.beginPath(); x.moveTo(0, 0); x.lineTo(250, i % 2 ? -8 : -16); x.lineTo(250, i % 2 ? 8 : 16); x.fill();
    }
  }), { blending: THREE.AdditiveBlending, opacity: 0.7 });
  rays.scale.setScalar(22);
  rays.position.y = 1.6;
  g.add(rays);
  const light = new THREE.PointLight('#ffcf80', 60, 30, 2);
  light.position.set(0, 2, 3);
  g.add(light);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 2), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.kind = 'key';
  g.add(hit);
  return { group: g, key, halo, rays, hit, gold };
}
