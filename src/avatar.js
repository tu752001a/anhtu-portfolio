import * as THREE from 'three';

// Nhân vật anime của Anh Tú: tóc đen dày rối, kính vàng gọng trắng, khuyên tai bạc, áo khoác lông đen
const damp = (a, b, l, dt) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-l * dt));

function toonRamp() {
  const d = new Uint8Array([95, 95, 95, 255, 175, 175, 175, 255, 245, 245, 245, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

// số ngẫu nhiên cố định để tóc lần nào cũng giống nhau
function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

// Vẽ khuôn mặt chibi: mắt to sắc nét (dễ thương mà vẫn ngầu), không má hồng
// mode: 'normal' | 'happy' (^ ^) | 'wink' | 'star' (mắt lấp lánh)
function faceTexture(mode = 'normal') {
  const W = 1024, H = 768;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const cx = W / 2;
  const closed = (ex, ey) => {
    g.strokeStyle = '#120c0a'; g.lineCap = 'round'; g.lineWidth = 20;
    g.beginPath(); g.moveTo(ex - 85, ey + 30); g.quadraticCurveTo(ex, ey - 80, ex + 85, ey + 30); g.stroke();
  };
  const star = (x, y, r, rot = 0) => {
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = rot + (k / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = k % 2 ? r * 0.45 : r;
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath(); g.fill();
  };
  for (const sx of [-1, 1]) {
    const ex = cx + sx * 175, ey = 360;
    if (mode === 'happy' || (mode === 'wink' && sx === 1)) closed(ex, ey);
    else {
      g.save();
      g.translate(ex, ey); g.scale(1.28, 1.22); g.translate(-ex, -ey);
      // tròng mắt
      g.save();
      g.beginPath();
      g.ellipse(ex, ey + 10, 62, 70, 0, 0, Math.PI * 2);
      g.clip();
      const ir = g.createLinearGradient(0, ey - 70, 0, ey + 80);
      ir.addColorStop(0, '#0d0705'); ir.addColorStop(0.5, '#3d2214'); ir.addColorStop(1, '#b8743e');
      g.fillStyle = ir;
      g.fillRect(ex - 80, ey - 80, 160, 170);
      g.fillStyle = '#080404';
      if (mode === 'star') { g.fillStyle = '#ffd36e'; star(ex, ey + 8, 44, 0.1); }
      else { g.beginPath(); g.ellipse(ex, ey + 6, 24, 32, 0, 0, Math.PI * 2); g.fill(); }
      g.restore();
      // viền mi trên dày, đuôi mắt xếch nhẹ cho "ngầu"
      g.strokeStyle = '#0d0908'; g.lineCap = 'round'; g.lineWidth = 18;
      g.beginPath();
      g.moveTo(ex - sx * 92, ey - 14);
      g.quadraticCurveTo(ex - sx * 10, ey - 78, ex + sx * 88, ey - 52);
      g.lineTo(ex + sx * 118, ey - 58);
      g.stroke();
      g.lineWidth = 5;
      g.beginPath(); g.moveTo(ex - sx * 60, ey + 84); g.quadraticCurveTo(ex, ey + 92, ex + sx * 64, ey + 74); g.stroke();
      // ánh sáng trong mắt
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(ex + sx * 20, ey - 18, 18, 22, 0.4, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(ex - sx * 22, ey + 42, 8, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    // lông mày đậm, hơi chau
    g.strokeStyle = '#141015'; g.lineWidth = 16; g.lineCap = 'round';
    g.beginPath(); g.moveTo(ex - sx * 75, ey - 160); g.quadraticCurveTo(ex, ey - 182, ex + sx * 85, ey - 176); g.stroke();
  }
  // mũi chấm nhỏ
  g.fillStyle = 'rgba(190,110,90,0.6)';
  g.beginPath(); g.arc(cx, 520, 6, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#5a2824'; g.lineCap = 'round'; g.lineWidth = 7;
  if (mode === 'happy' || mode === 'star') {
    // miệng cười há
    g.fillStyle = '#a8403f';
    g.beginPath(); g.moveTo(cx - 40, 575); g.quadraticCurveTo(cx, 650, cx + 40, 575); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#e88080';
    g.beginPath(); g.ellipse(cx, 615, 18, 9, 0, 0, Math.PI * 2); g.fill();
  } else {
    // nhếch mép một bên: dễ thương mà ngầu
    g.beginPath();
    g.moveTo(cx - 30, 585); g.quadraticCurveTo(cx + 6, 596, cx + 34, 572);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Lọn tóc: hình lá cong, dẹt, nhọn đầu
function lockGeometry() {
  const geo = new THREE.ConeGeometry(1, 1, 10, 6, false);
  geo.translate(0, -0.5, 0); // gốc ở trên, ngọn chỉ xuống -y
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const t = -v.y; // 0 ở gốc → 1 ở ngọn
    v.z *= 0.45; // dẹt
    v.z += t * t * 0.35; // cong ra phía trước
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// khối lông xù: làm gồ ghề bề mặt để có viền mềm, bông
function fluffy(geo, amount, seed = 1) {
  const p = geo.attributes.position;
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  geo.computeVertexNormals();
  const N = geo.attributes.normal;
  const key = new Map();
  const R = rng(seed);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    n.fromBufferAttribute(N, i);
    const k = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    if (!key.has(k)) key.set(k, (Math.sin(v.x * 23 + v.y * 17) * Math.sin(v.z * 19 - v.y * 11) * 0.5 + 0.5) * 0.7 + R() * 0.3);
    v.addScaledVector(n, key.get(k) * amount);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// Các "màn diễn" dễ thương: mỗi hàm trả về tư thế theo k (0 → 1) và thời gian t (giây)
const ACTS = {
  wave: { dur: 2.2, emote: 'heart', pose: (k, t) => ({ aRz: -2.5, aRx: 0, eRx: 0, eRz: -0.4 + Math.sin(t * 14) * 0.45, nz: 0.18, face: 'happy' }) },
  cool: { dur: 2.4, emote: 'sparkle', pose: (k, t) => ({ aRx: -2.3, aRz: 0.25, eRx: -1.5, eRz: 0.5, aLz: 0.5, eLx: -1.2, eLz: -0.9, nz: -0.16, nx: -0.12, face: k > 0.45 ? 'wink' : 'normal' }) },
  clap: { dur: 2.2, emote: 'note', pose: (k, t) => { const o = Math.abs(Math.sin(t * 11)); return { aLx: -1.1, aRx: -1.1, aLz: -0.1 + o * 0.35, aRz: 0.1 - o * 0.35, eLx: -0.9, eRx: -0.9, eLz: -0.5, eRz: 0.5, by: o * 0.05, face: 'happy' }; } },
  dance: { dur: 2.8, emote: 'note2', pose: (k, t) => { const b = Math.sin(t * 8); return { aLz: 2.3 + b * 0.5, aRz: -2.3 + b * 0.5, aLx: 0, aRx: 0, eLx: 0, eRx: 0, eLz: -0.3, eRz: 0.3, by: Math.abs(b) * 0.14, nz: b * 0.22, sz: b * 0.12, face: 'star' }; } },
  peace: { dur: 2.4, emote: 'star', pose: (k, t) => ({ aRz: -2.1, aRx: -0.4, eRx: -0.2, eRz: -1.5, aLz: 0.6, aLx: 0.2, eLx: -1.3, eLz: -1.0, nz: -0.24, face: 'wink' }) },
  heart: { dur: 2.6, emote: 'heart', pose: (k, t) => ({ aLx: -1.35, aRx: -1.35, aLz: -0.35, aRz: 0.35, eLx: -1.1, eRx: -1.1, eLz: -0.6, eRz: 0.6, nz: 0.22 * Math.sin(t * 3), by: Math.abs(Math.sin(t * 6)) * 0.06, face: 'happy' }) },
  bow: { dur: 2.2, emote: 'star', pose: (k) => ({ sx: Math.sin(Math.min(k * 1.4, 1) * Math.PI) * 0.75, aLx: 0.2, aRx: 0.2, aLz: 0.1, aRz: -0.1, eLx: -0.2, eRx: -0.2, eLz: 0, eRz: 0, face: 'happy' }) },
  spin: { dur: 1.6, emote: 'sparkle', pose: (k) => ({ by: Math.sin(k * Math.PI) * 0.9, spin: THREE.MathUtils.smoothstep(k, 0.1, 0.85) * Math.PI * 2, aLz: 1.4, aRz: -1.4, aLx: 0, aRx: 0, eLx: 0, eRx: 0, eLz: 0, eRz: 0, face: 'star' }) },
};
export const ACT_NAMES = Object.keys(ACTS);

export class Avatar {
  constructor() {
    const ramp = toonRamp();
    const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...extra });
    this.mat = {
      skin: toon('#f6d2b4'),
      hair: toon('#23212b'),
      fur: toon('#25232b'),
      cloth: toon('#141318'),
      pants: toon('#1b1a20'),
      white: toon('#f5f2ec'),
      silver: new THREE.MeshStandardMaterial({ color: '#e3e6ea', metalness: 1, roughness: 0.2 }),
      gold: new THREE.MeshStandardMaterial({ color: '#d9a650', metalness: 1, roughness: 0.3 }),
      lens: new THREE.MeshBasicMaterial({ color: '#f7b52a', transparent: true, opacity: 0.42, depthWrite: false }),
      face: new THREE.MeshBasicMaterial({ map: faceTexture(), transparent: true, depthWrite: false }),
      outline: new THREE.MeshBasicMaterial({ color: '#0b0807', side: THREE.BackSide }),
    };
    const M = this.mat;
    this.faces = { normal: M.face.map, happy: faceTexture('happy'), wink: faceTexture('wink'), star: faceTexture('star') };

    // khối có viền đen kiểu anime (inverted hull)
    const part = (geo, mat, outline = 0.035) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(geo, mat));
      if (outline) {
        const o = new THREE.Mesh(geo, M.outline);
        o.scale.setScalar(1 + outline);
        g.add(o);
      }
      return g;
    };
    const cap = (r, len, mat, ol) => part(new THREE.CapsuleGeometry(r, len, 8, 18), mat, ol);
    const sph = (r, mat, ol) => part(new THREE.SphereGeometry(r, 32, 24), mat, ol);
    const fur = (r, len, ol = 0.06, amt = 0.05, seed = 1) => part(fluffy(new THREE.CapsuleGeometry(r, len, 10, 22), amt, seed), M.fur, ol);

    this.root = new THREE.Group();
    this.body = new THREE.Group();
    this.root.add(this.body);

    /* ---- hông & chân: quần đen ống côn, giày đen đế trắng ---- */
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.76;
    this.body.add(this.pelvis);
    const hips = sph(0.3, M.pants, 0.04);
    hips.scale.set(1.05, 0.62, 0.78);
    this.pelvis.add(hips);
    const leg = (side) => {
      const hp = new THREE.Group();
      hp.position.set(0.15 * side, -0.05, 0);
      this.pelvis.add(hp);
      const th = cap(0.14, 0.16, M.pants, 0.05);
      th.position.y = -0.17;
      hp.add(th);
      const kn = new THREE.Group();
      kn.position.y = -0.34;
      hp.add(kn);
      const sh = cap(0.12, 0.1, M.pants, 0.06);
      sh.position.y = -0.13;
      kn.add(sh);
      const an = new THREE.Group();
      an.position.y = -0.26;
      kn.add(an);
      const shoe = cap(0.13, 0.16, M.cloth, 0.07);
      shoe.rotation.x = Math.PI / 2;
      shoe.position.set(0, -0.02, 0.08);
      an.add(shoe);
      const sole = part(new THREE.BoxGeometry(0.26, 0.06, 0.44), M.white, 0.06);
      sole.position.set(0, -0.13, 0.08);
      an.add(sole);
      return { hp, kn, an };
    };
    this.legL = leg(1);
    this.legR = leg(-1);

    /* ---- thân: áo ba lỗ đen, dây chuyền, áo khoác lông mở ---- */
    this.spine = new THREE.Group();
    this.spine.position.y = 0.1;
    this.pelvis.add(this.spine);
    const tank = cap(0.26, 0.2, M.cloth, 0);
    tank.scale.set(1.1, 1, 0.8);
    tank.position.y = 0.3;
    this.spine.add(tank);
    const chest = part(new THREE.SphereGeometry(0.12, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.skin, 0);
    chest.scale.set(1, 1.6, 0.6);
    chest.position.set(0, 0.5, 0.15);
    chest.rotation.x = Math.PI;
    this.spine.add(chest);
    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.011, 6, 30, Math.PI), M.silver);
    chain.rotation.set(Math.PI * 0.6, 0, Math.PI);
    chain.position.set(0, 0.56, 0.13);
    this.spine.add(chain);
    for (const sx of [-1, 1]) {
      const flap = fur(0.25, 0.18, 0.06, 0.07, sx + 3);
      flap.scale.set(0.95, 1, 1);
      flap.position.set(0.15 * sx, 0.3, -0.02);
      flap.rotation.z = -0.1 * sx;
      this.spine.add(flap);
    }
    const collar = part(fluffy(new THREE.TorusGeometry(0.26, 0.12, 14, 32), 0.06, 9), M.fur, 0.06);
    collar.rotation.x = Math.PI / 2.2;
    collar.position.set(0, 0.58, -0.04);
    collar.scale.set(1.15, 1, 0.85);
    this.spine.add(collar);

    /* ---- tay áo lông phồng, cổ tay xù ---- */
    const arm = (side) => {
      const sh = new THREE.Group();
      sh.position.set(0.36 * side, 0.52, -0.02);
      this.spine.add(sh);
      const shoulder = part(fluffy(new THREE.SphereGeometry(0.19, 20, 16), 0.05, side + 5), M.fur, 0.06);
      sh.add(shoulder);
      const up = fur(0.14, 0.1, 0.06, 0.06, side + 7);
      up.position.y = -0.14;
      sh.add(up);
      const el = new THREE.Group();
      el.position.y = -0.28;
      sh.add(el);
      const fo = fur(0.13, 0.08, 0.06, 0.06, side + 11);
      fo.position.y = -0.1;
      el.add(fo);
      const cuff = part(fluffy(new THREE.TorusGeometry(0.11, 0.065, 10, 20), 0.05, side + 13), M.fur, 0.07);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.y = -0.21;
      el.add(cuff);
      const hand = sph(0.1, M.skin, 0.07);
      hand.scale.set(1, 1.05, 0.9);
      hand.position.y = -0.31;
      el.add(hand);
      if (side === 1) {
        const watch = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.02, 6, 16), M.gold);
        watch.rotation.x = Math.PI / 2;
        watch.position.y = -0.25;
        el.add(watch);
      }
      return { sh, el };
    };
    this.armL = arm(1);
    this.armR = arm(-1);

    /* ---- cổ & đầu ---- */
    this.neck = new THREE.Group();
    this.neck.position.y = 0.6;
    this.spine.add(this.neck);
    const neckM = cap(0.075, 0.16, M.skin, 0);
    neckM.position.y = 0.1;
    this.neck.add(neckM);
    this.head = new THREE.Group();
    this.head.position.y = 0.64;
    this.head.scale.setScalar(1.55);
    this.neck.add(this.head);
    const skull = sph(0.4, M.skin, 0.03);
    skull.scale.set(0.87, 1, 0.95);
    this.head.add(skull);
    const jaw = part(new THREE.SphereGeometry(0.3, 24, 18), M.skin, 0.03);
    jaw.scale.set(0.9, 0.92, 0.95);
    jaw.position.set(0, -0.15, 0.0);
    this.head.add(jaw);
    // mặt vẽ tay phủ lên phần trước đầu
    const faceGeo = new THREE.SphereGeometry(0.42, 32, 24, Math.PI * 0.5 - 0.95, 1.9, Math.PI * 0.32, Math.PI * 0.5);
    const face = new THREE.Mesh(faceGeo, M.face);
    face.scale.set(0.88, 1, 0.97);
    face.renderOrder = 2;
    this.head.add(face);
    // khuyên tai bạc hình mũi nhọn
    for (const sx of [-1, 1]) {
      const ear = sph(0.065, M.skin, 0.08);
      ear.scale.set(0.45, 1, 0.75);
      ear.position.set(0.36 * sx, -0.02, 0.0);
      this.head.add(ear);
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.008, 6, 16), M.silver);
      hoop.position.set(0.38 * sx, -0.1, 0.02);
      hoop.rotation.y = Math.PI / 2;
      this.head.add(hoop);
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.1, 8), M.silver);
      spike.rotation.x = Math.PI;
      spike.position.set(0.38 * sx, -0.18, 0.02);
      this.head.add(spike);
    }

    // kính phi công: tròng vàng trong, gọng trắng
    const glasses = new THREE.Group();
    glasses.position.set(0, -0.04, 0.43);
    glasses.scale.setScalar(1.12);
    this.head.add(glasses);
    const rr = (w, h, r) => {
      const s = new THREE.Shape();
      s.moveTo(-w / 2 + r, -h / 2);
      s.lineTo(w / 2 - r, -h / 2);
      s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
      s.lineTo(w / 2, h / 2 - r);
      s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
      s.lineTo(-w / 2 + r, h / 2);
      s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
      s.lineTo(-w / 2, -h / 2 + r);
      s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
      return s;
    };
    for (const sx of [-1, 1]) {
      const g = new THREE.Group();
      g.position.set(0.155 * sx, 0, 0);
      g.rotation.y = 0.3 * sx;
      const frame = rr(0.29, 0.2, 0.06);
      frame.holes.push(rr(0.25, 0.16, 0.045));
      g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(frame, { depth: 0.022, bevelEnabled: false }), M.white));
      const lens = new THREE.Mesh(new THREE.ShapeGeometry(rr(0.255, 0.165, 0.045)), M.lens);
      lens.position.z = 0.012;
      lens.renderOrder = 3;
      g.add(lens);
      const temple = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.022, 0.34), M.white);
      temple.position.set(0.145 * sx, 0.05, -0.17);
      temple.rotation.y = -0.3 * sx;
      g.add(temple);
      glasses.add(g);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.022, 0.022), M.white);
    bridge.position.set(0, 0.075, 0.02);
    glasses.add(bridge);

    // tóc 7/3 kiểu Hàn: rẽ ngôi lệch, một bên vuốt dựng lên, mái còn lại rủ chéo ngang trán
    this.hair = new THREE.Group();
    this.head.add(this.hair);
    const capGeo = new THREE.SphereGeometry(0.44, 36, 22, 0, Math.PI * 2, 0, Math.PI * 0.56);
    const hairCap = part(fluffy(capGeo, 0.025, 21), M.hair, 0.035);
    hairCap.rotation.x = -0.3;
    hairCap.position.set(0, 0.05, -0.04);
    this.hair.add(hairCap);
    const nape = sph(0.36, M.hair, 0.03);
    nape.scale.set(0.98, 0.8, 0.8);
    nape.position.set(0, -0.05, -0.16);
    this.hair.add(nape);

    // vệt bóng tóc kiểu anime (angel ring)
    const sheen = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.016, 6, 40, Math.PI * 0.8), new THREE.MeshBasicMaterial({ color: '#8a879e', transparent: true, opacity: 0.6 }));
    sheen.rotation.set(-Math.PI / 2 - 0.3, 0, Math.PI * 0.1);
    sheen.position.set(0, 0.25, 0.0);
    this.hair.add(sheen);
    const lockGeo = lockGeometry();
    const H = rng(37);
    const locks = [];
    const add = (pos, dir, len, w, twist = 0) => locks.push({ pos, dir: dir.normalize(), len, w, twist });
    const PART = 0.14; // đường ngôi lệch phải (phần "3")
    // phần "7": mái dày rủ chéo từ ngôi sang bên trái, che chân mày, hở kính
    for (let i = 0; i < 10; i++) {
      const t = i / 9; // 0 ở ngôi → 1 ở thái dương trái
      const x = PART - t * 0.44;
      add(new THREE.Vector3(x, 0.34 - t * 0.08, 0.24 - t * 0.08),
        new THREE.Vector3(-0.55 - t * 0.15, -1, 0.28), 0.2 + t * 0.07 + H() * 0.02, 0.11 + H() * 0.02, -0.3 + (H() - 0.5) * 0.2);
    }
    // lớp mái phủ trên cùng, mượt và chéo theo cùng hướng
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const x = PART - 0.05 - t * 0.36;
      add(new THREE.Vector3(x, 0.41, 0.1), new THREE.Vector3(-0.7, -0.6, 0.35), 0.24 + H() * 0.04, 0.12, -0.3);
    }
    // phần "3": vuốt dựng lên và hất ra sau, để lộ trán
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const x = PART + 0.03 + t * 0.22;
      add(new THREE.Vector3(x, 0.3 + t * 0.02, 0.27 - t * 0.08),
        new THREE.Vector3(0.3 + t * 0.3, 0.55, -0.85), 0.15 + (1 - Math.abs(t - 0.4)) * 0.05, 0.11, 0.2);
    }
    // đỉnh đầu: lọn chải tách đôi theo đường ngôi
    for (let i = 0; i < 26; i++) {
      const th = Math.acos(1 - H() * 0.75), ph = H() * Math.PI * 2;
      const n = new THREE.Vector3(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph));
      if (n.z > 0.4 && n.y < 0.8) continue; // phía trước đã có mái
      const root = n.clone().multiplyScalar(0.42).add(new THREE.Vector3(0, 0.05, -0.03));
      const away = root.x < PART ? -1 : 1;
      const dir = new THREE.Vector3(away * 0.25, -0.9, -0.5).addScaledVector(n, 0.12);
      add(root, dir, 0.22 + H() * 0.05, 0.12 + H() * 0.02, away * 0.3);
    }
    // hai bên cắt gọn (two-block)
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
      add(new THREE.Vector3(0.37 * sx, 0.18, 0.08 - i * 0.12), new THREE.Vector3(0.15 * sx, -1, -0.1), 0.14, 0.09, 0);
    }
    // gáy
    for (let i = 0; i < 7; i++) {
      const x = (i / 6 - 0.5) * 0.56;
      add(new THREE.Vector3(x, 0.02, -0.32), new THREE.Vector3(x * 0.5, -1, -0.3), 0.2 + H() * 0.04, 0.1, 0);
    }
    const lockIn = new THREE.InstancedMesh(lockGeo, M.hair, locks.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion();
    const down = new THREE.Vector3(0, -1, 0);
    locks.forEach((l, i) => {
      q.setFromUnitVectors(down, l.dir);
      q2.setFromAxisAngle(l.dir, l.twist);
      q.premultiply(q2);
      m4.compose(l.pos, q, new THREE.Vector3(l.w, l.len, l.w));
      lockIn.setMatrixAt(i, m4);
    });
    this.hair.add(lockIn);

    // bóng mềm dưới chân
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g2 = c.getContext('2d');
    const gr = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,0.7)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g2.fillStyle = gr;
    g2.fillRect(0, 0, 128, 128);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.02;
    this.root.add(this.shadow);

    // ánh sáng riêng
    this.key = new THREE.SpotLight('#fff0dc', 200, 30, 0.6, 0.7, 2);
    this.key.position.set(1.5, 9, 5);
    this.key.target = this.body;
    this.root.add(this.key);
    this.rim = new THREE.PointLight('#f2b630', 30, 10, 2);
    this.rim.position.set(-2, 4, -2.5);
    this.root.add(this.rim);

    this.root.scale.setScalar(1.25);
    // vùng bấm vô hình để chạm vào nhân vật
    this.hit = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 1.5, 4, 8), new THREE.MeshBasicMaterial({ visible: false }));
    this.hit.position.y = 1.5;
    this.hit.userData.kind = 'hero';
    this.root.add(this.hit);
    this.actName = null;
    this.actT = 0;
    this.onEmote = null;
    this.blinkT = 2;
    this.hopT = 0;
    this.hopNext = 4;
    this.onStep = null;
    this.lastStep = 0;
    this.phase = 0;
    this.moveAmt = 0;
    this.idleTime = 0;
    this.yaw = 0;
    this.wave = 0;
    this.lookTarget = new THREE.Vector2();
  }

  act(name) {
    if (!ACTS[name]) return;
    this.actName = name;
    this.actT = 0;
    this.hopT = 0;
    this.onEmote?.(ACTS[name].emote);
  }

  update(dt, time, speed, { faceCamera = 0, wave = 0, look = null } = {}) {
    const s = Math.abs(speed);
    this.moveAmt = damp(this.moveAmt, Math.min(s / 14, 1), 6, dt);
    this.phase += THREE.MathUtils.clamp(speed, -16, 16) * dt * 1.1;
    this.idleTime = s < 0.4 ? this.idleTime + dt : 0;
    const m = this.moveAmt;
    const run = THREE.MathUtils.smoothstep(m, 0.45, 1);
    const sw = Math.sin(this.phase), cw = Math.cos(this.phase);
    const stride = 0.6 * m + 0.25 * run;

    this.legL.hp.rotation.x = sw * stride;
    this.legR.hp.rotation.x = -sw * stride;
    this.legL.kn.rotation.x = Math.max(0, -cw) * (1.0 * m + 0.6 * run);
    this.legR.kn.rotation.x = Math.max(0, cw) * (1.0 * m + 0.6 * run);
    this.legL.an.rotation.x = -this.legL.hp.rotation.x * 0.3;
    this.legR.an.rotation.x = -this.legR.hp.rotation.x * 0.3;

    // đứng yên: hai tay đan trước ngực như ảnh chụp; đi: tay vung
    const pose = 1 - m;
    const idleSway = Math.sin(time * 1.2) * 0.03;
    this.armL.sh.rotation.x = THREE.MathUtils.lerp(-sw * (0.5 + 0.4 * run), -0.55 + idleSway, pose);
    this.armR.sh.rotation.x = THREE.MathUtils.lerp(sw * (0.5 + 0.4 * run), -0.55 - idleSway, pose);
    this.armL.sh.rotation.z = THREE.MathUtils.lerp(0.18, -0.15, pose);
    this.armR.sh.rotation.z = THREE.MathUtils.lerp(-0.18, 0.15, pose);
    this.armL.el.rotation.x = THREE.MathUtils.lerp(-(0.3 + 0.7 * run), -1.75, pose);
    this.armR.el.rotation.x = THREE.MathUtils.lerp(-(0.3 + 0.7 * run), -1.75, pose);
    this.armL.el.rotation.z = THREE.MathUtils.lerp(0, -0.35, pose);
    this.armR.el.rotation.z = THREE.MathUtils.lerp(0, 0.35, pose);

    // vẫy tay chào
    this.wave = damp(this.wave, wave, 3, dt);
    if (this.wave > 0.01) {
      const w = this.wave;
      this.armR.sh.rotation.z = THREE.MathUtils.lerp(this.armR.sh.rotation.z, -2.5, w);
      this.armR.sh.rotation.x = THREE.MathUtils.lerp(this.armR.sh.rotation.x, 0, w);
      this.armR.el.rotation.x = THREE.MathUtils.lerp(this.armR.el.rotation.x, 0, w);
      this.armR.el.rotation.z = THREE.MathUtils.lerp(this.armR.el.rotation.z, -0.4 + Math.sin(time * 7) * 0.45, w);
    }

    // nhún nhảy lạch bạch: nảy mỗi bước, lắc hông qua lại, co giãn thân
    const bounce = Math.abs(cw);
    let hop = 0;
    if (this.idleTime > 3 && !this.actName) {
      this.hopNext -= dt;
      if (this.hopNext < 0 && this.hopT <= 0) { this.hopT = 0.7; this.hopNext = 3.5 + Math.random() * 3; }
    }
    if (this.hopT > 0) {
      this.hopT = Math.max(0, this.hopT - dt);
      const k = 1 - this.hopT / 0.7; // 0 → 1
      hop = k > 0.2 ? Math.sin(((k - 0.2) / 0.8) * Math.PI) * 0.35 : 0;
      const squat = k < 0.2 ? Math.sin((k / 0.2) * Math.PI) : 0;
      this.body.scale.set(1 + squat * 0.12, 1 - squat * 0.15 + hop * 0.2, 1 + squat * 0.12);
      this.armL.sh.rotation.z = THREE.MathUtils.lerp(this.armL.sh.rotation.z, 1.2, hop * 2.5);
      this.armR.sh.rotation.z = THREE.MathUtils.lerp(this.armR.sh.rotation.z, -1.2, hop * 2.5);
    } else {
      const sq = (1 - bounce) * 0.07 * m; // chạm đất thì bẹp ra một chút
      this.body.scale.set(1 + sq, 1 - sq + Math.sin(time * 2.2) * 0.012 * pose, 1 + sq);
    }
    this.body.position.y = bounce * (0.16 + 0.06 * run) * m + Math.sin(time * 2.2) * 0.015 * pose + hop;
    this.body.rotation.z = sw * 0.13 * m; // lạch bạch
    this.spine.rotation.x = 0.04 * m + 0.12 * run;
    this.spine.rotation.y = sw * 0.1 * m;
    this.pelvis.rotation.y = -sw * 0.08 * m;
    this.pelvis.rotation.z = 0;
    // tóc nảy theo bước chân
    this.hair.rotation.x = -cw * 0.05 * m - run * 0.05;
    this.hair.position.y = bounce * 0.02 * m;
    // báo mỗi bước chân để cảnh rắc bụi sao
    const step = Math.sign(sw);
    if (m > 0.15 && step !== this.lastStep) { this.lastStep = step; this.onStep?.(step); }

    // màn diễn: hoà dần vào tư thế hiện tại rồi trả lại
    let face = null, spin = 0, actNz = 0, actNx = 0;
    if (this.actName) {
      const A = ACTS[this.actName];
      this.actT += dt;
      const k = this.actT / A.dur;
      if (k >= 1) this.actName = null;
      else {
        const w = Math.min(1, k * 7, (1 - k) * 6);
        const P = A.pose(k, this.actT, time);
        const L = THREE.MathUtils.lerp;
        const map = [['aLx', this.armL.sh, 'x'], ['aLz', this.armL.sh, 'z'], ['aRx', this.armR.sh, 'x'], ['aRz', this.armR.sh, 'z'],
          ['eLx', this.armL.el, 'x'], ['eLz', this.armL.el, 'z'], ['eRx', this.armR.el, 'x'], ['eRz', this.armR.el, 'z']];
        for (const [key, o, ax] of map) if (P[key] !== undefined) o.rotation[ax] = L(o.rotation[ax], P[key], w);
        if (P.sx) this.spine.rotation.x += P.sx * w;
        if (P.sz) this.body.rotation.z += P.sz * w;
        if (P.by) this.body.position.y += P.by * w;
        spin = P.spin || 0;
        actNz = (P.nz || 0) * w;
        actNx = (P.nx || 0) * w;
        face = P.face;
      }
    }

    // chớp mắt, cười híp mắt khi vẫy tay
    this.blinkT -= dt;
    if (this.blinkT < -0.12) this.blinkT = 2.5 + Math.random() * 2.5;
    const happy = this.blinkT < 0 || this.wave > 0.45 || hop > 0.05;
    const fmap = this.faces[face && !(this.blinkT < 0 && face === 'normal') ? face : happy ? 'happy' : 'normal'];
    if (this.mat.face.map !== fmap) { this.mat.face.map = fmap; this.mat.face.needsUpdate = true; }

    const turn = THREE.MathUtils.smoothstep(this.idleTime, 0.8, 2.2) * faceCamera;
    this.yaw = damp(this.yaw, speed < -0.4 ? Math.PI : turn, 3.2, dt);
    this.body.rotation.y = this.yaw + spin;

    if (look) this.lookTarget.lerp(look, 1 - Math.exp(-4 * dt));
    this.neck.rotation.y = this.lookTarget.x * 0.5 * (0.3 + (turn / Math.PI) * 0.7) + Math.sin(time * 0.5) * 0.06 * pose;
    // ngẩng nhẹ, hất cằm kiểu chụp hình khi đứng yên
    this.neck.rotation.x = -this.lookTarget.y * 0.25 - 0.04 * pose - 0.05 * run;
    // nghiêng đầu dễ thương khi đứng chờ
    this.neck.rotation.z = (Math.sin(time * 0.7) * 0.14 + this.wave * 0.18) * pose - sw * 0.06 * m + actNz;
    this.neck.rotation.x += actNx;

    this.shadow.scale.setScalar(0.85 - this.body.position.y * 0.8);
  }
}
