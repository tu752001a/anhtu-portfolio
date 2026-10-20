import * as THREE from 'three';

// Phương tiện chibi cho từng chặng đường. Toạ độ theo khung nhân vật: +z là phía trước, y = 0 là mặt đất.
// Mỗi phương tiện trả về { g, seat, pose, update(dt, speed) }:
//   seat: độ cao hông khi ngồi (hông đứng là 0.76), pose: 'pedal' | 'ride' | 'skate' | 'drive'

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.15, ...o });
const glow = (color, k = 2.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false });
const CHROME = mat('#e8e8ee', { metalness: 1, roughness: 0.18 });
const TIRE = mat('#16151a', { roughness: 0.8 });
const DARK = mat('#22202a', { roughness: 0.6 });

function wheel(r, tube = r * 0.18, rim = '#d9d9e0', spokes = 6) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 28), TIRE);
  g.add(tire);
  const rimMat = mat(rim, { metalness: 0.8, roughness: 0.25 });
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.22, tube * 2.4, 14), rimMat);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  for (let i = 0; i < spokes; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(r * 1.9, r * 0.05, r * 0.05), rimMat);
    s.rotation.z = (i / spokes) * Math.PI;
    g.add(s);
  }
  g.rotation.y = Math.PI / 2; // trục bánh theo trục x của xe
  const spin = new THREE.Group();
  spin.add(g);
  spin.userData.r = r;
  return spin;
}

function tube(a, b, r, m) {
  const d = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), m);
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return mesh;
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function roller(wheels) {
  return (dt, speed) => { for (const w of wheels) w.rotation.x += (speed * dt) / w.userData.r; };
}

const BUILD = {
  // đạp xe đạp: khung xanh bạc hà, giỏ mây phía trước
  bicycle() {
    const g = new THREE.Group();
    const frame = mat('#3fc1b0', { metalness: 0.3, roughness: 0.35 });
    const w1 = wheel(0.34, 0.035), w2 = wheel(0.34, 0.035);
    w1.position.set(0, 0.36, 0.58); w2.position.set(0, 0.36, -0.52);
    g.add(w1, w2);
    const crank = V(0, 0.38, 0.0), seat = V(0, 0.82, -0.14), head = V(0, 0.86, 0.46);
    g.add(tube(V(0, 0.36, -0.52), crank, 0.03, frame), tube(crank, seat, 0.032, frame), tube(seat, head, 0.03, frame),
      tube(crank, head, 0.034, frame), tube(V(0, 0.36, -0.52), seat, 0.026, frame), tube(head, V(0, 0.36, 0.58), 0.03, frame));
    const bar = tube(V(-0.3, 1.02, 0.42), V(0.3, 1.02, 0.42), 0.022, CHROME);
    g.add(bar, tube(head, V(0, 1.02, 0.42), 0.025, CHROME));
    const saddle = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.16, 4, 10), DARK);
    saddle.rotation.x = Math.PI / 2; saddle.position.set(0, 0.86, -0.16);
    g.add(saddle);
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.18, 12, 1, true), mat('#c99a5b', { side: THREE.DoubleSide, roughness: 0.9 }));
    basket.position.set(0, 1.0, 0.62);
    g.add(basket);
    const pedals = new THREE.Group();
    pedals.position.copy(crank);
    for (const s of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.2), CHROME);
      arm.position.set(0.1 * s, 0, 0.1 * s); pedals.add(arm);
    }
    g.add(pedals);
    const roll = roller([w1, w2]);
    return { g, seat: 0.9, pose: 'pedal', update: (dt, sp) => { roll(dt, sp); pedals.rotation.x += (sp * dt) / 0.6; } };
  },

  // xe gắn máy kiểu Vespa: kem & đỏ, đèn tròn
  scooter() {
    const g = new THREE.Group();
    const body = mat('#f3e3c3', { roughness: 0.3 }), red = mat('#c8342b', { roughness: 0.3 });
    const w1 = wheel(0.24, 0.07, '#bfbfc6', 5), w2 = wheel(0.24, 0.07, '#bfbfc6', 5);
    w1.position.set(0, 0.26, 0.62); w2.position.set(0, 0.26, -0.6);
    g.add(w1, w2);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.7), body);
    floor.position.set(0, 0.32, 0.05); g.add(floor);
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 16), body);
    back.scale.set(0.75, 0.62, 1.15); back.position.set(0, 0.48, -0.48); g.add(back);
    const shield = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.5, 6, 14), body);
    shield.scale.set(1, 1, 0.45); shield.position.set(0, 0.68, 0.5); shield.rotation.x = -0.25; g.add(shield);
    const fender = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), red);
    fender.position.set(0, 0.34, 0.62); g.add(fender);
    const seat = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.4, 6, 12), mat('#5a2a1c', { roughness: 0.7 }));
    seat.rotation.x = Math.PI / 2; seat.position.set(0, 0.74, -0.38); g.add(seat);
    g.add(tube(V(0, 0.95, 0.56), V(0, 1.08, 0.52), 0.035, CHROME), tube(V(-0.3, 1.1, 0.5), V(0.3, 1.1, 0.5), 0.025, CHROME));
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), glow('#fff2c4', 3));
    lamp.position.set(0, 1.12, 0.6); g.add(lamp);
    const roll = roller([w1, w2]);
    return { g, seat: 0.78, pose: 'ride', update: (dt, sp) => roll(dt, sp) };
  },

  // mô tô phân khối lớn: đen nhám, bình xăng cam, ống xả crôm
  bigbike() {
    const g = new THREE.Group();
    const black = mat('#1a1a20', { roughness: 0.35, metalness: 0.5 }), orange = mat('#ff7a1a', { roughness: 0.25, metalness: 0.4 });
    const w1 = wheel(0.38, 0.11, '#7d7d86', 8), w2 = wheel(0.4, 0.13, '#7d7d86', 8);
    w1.position.set(0, 0.42, 0.82); w2.position.set(0, 0.44, -0.78);
    g.add(w1, w2);
    const tank = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), orange);
    tank.scale.set(0.85, 0.7, 1.25); tank.position.set(0, 0.95, 0.22); g.add(tank);
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.36, 0.5), black);
    engine.position.set(0, 0.55, 0.0); g.add(engine);
    for (const s of [-1, 1]) {
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 12), CHROME);
      cyl.rotation.z = Math.PI / 2; cyl.position.set(0.22 * s, 0.6, 0.12); g.add(cyl);
    }
    g.add(tube(V(0.22, 0.42, -0.1), V(0.26, 0.5, -0.95), 0.06, CHROME));
    const seat = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.45, 6, 12), mat('#2a1d18', { roughness: 0.8 }));
    seat.rotation.x = Math.PI / 2 - 0.1; seat.position.set(0, 0.86, -0.32); g.add(seat);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.4), orange);
    tail.position.set(0, 0.9, -0.72); tail.rotation.x = 0.25; g.add(tail);
    const brake = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.02), glow('#ff2a2a', 3));
    brake.position.set(0, 0.92, -0.93); g.add(brake);
    g.add(tube(V(0, 0.42, 0.82), V(0, 1.2, 0.5), 0.045, CHROME), tube(V(-0.36, 1.22, 0.42), V(0.36, 1.22, 0.42), 0.03, black));
    const fairing = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 12), black);
    fairing.scale.set(1, 0.85, 0.8); fairing.position.set(0, 1.12, 0.62); g.add(fairing);
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.11, 18), glow('#e9f4ff', 3.5));
    lamp.position.set(0, 1.12, 0.795); g.add(lamp);
    const roll = roller([w1, w2]);
    return { g, seat: 0.86, pose: 'ride', update: (dt, sp) => roll(dt, sp) };
  },

  // ván trượt: chặng 5 → 6
  skate() {
    const g = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.75, 6, 14), mat('#7b4dff', { roughness: 0.4 }));
    deck.rotation.x = Math.PI / 2; deck.scale.set(1, 1, 0.2); deck.position.y = 0.17; g.add(deck);
    const grip = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.9), mat('#111014', { roughness: 1 }));
    grip.rotation.x = -Math.PI / 2; grip.position.y = 0.215; g.add(grip);
    const wheels = [];
    for (const z of [-0.36, 0.36]) for (const x of [-0.15, 0.15]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 14), glow(x < 0 ? '#ffd36e' : '#65f0ff', 1.6));
      w.rotation.z = Math.PI / 2;
      const s = new THREE.Group(); s.position.set(x, 0.07, z); s.add(w); s.userData.r = 0.06;
      g.add(s); wheels.push(s);
    }
    const roll = roller(wheels);
    return { g, seat: 0.98, pose: 'skate', update: (dt, sp) => { roll(dt, sp); g.rotation.z = Math.sin(performance.now() * 0.004) * 0.05; } };
  },

  // tuk-tuk: ba bánh, mui xanh, thân vàng
  tuktuk() {
    const g = new THREE.Group();
    const yellow = mat('#ffc928', { roughness: 0.35 }), green = mat('#1f8a5c', { roughness: 0.5 });
    const wf = wheel(0.24, 0.08), wl = wheel(0.26, 0.09), wr = wheel(0.26, 0.09);
    wf.position.set(0, 0.26, 0.95); wl.position.set(-0.62, 0.28, -0.7); wr.position.set(0.62, 0.28, -0.7);
    g.add(wf, wl, wr);
    const nose = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.4, 6, 14), yellow);
    nose.scale.set(1, 1, 0.8); nose.position.set(0, 0.62, 0.78); nose.rotation.x = -0.35; g.add(nose);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 1.9), yellow);
    floor.position.set(0, 0.42, -0.15); g.add(floor);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.55, 0.9), yellow);
    cabin.position.set(0, 0.76, -0.62); g.add(cabin);
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.45), mat('#7a2e1c', { roughness: 0.8 }));
    bench.position.set(0, 1.08, -0.5); g.add(bench);
    // mui che phía sau, để đầu chibi lộ ra ở ghế lái
    for (const [x, z] of [[-0.6, -1.05], [0.6, -1.05], [-0.6, -0.25], [0.6, -0.25]]) g.add(tube(V(x, 1.0, z), V(x, 2.55, z), 0.03, CHROME));
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.1, 1.1), green);
    roof.position.set(0, 2.6, -0.62); g.add(roof);
    const fringe = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.14, 0.04), mat('#ff4f7b'));
    fringe.position.set(0, 2.5, -0.07); g.add(fringe);
    g.add(tube(V(-0.32, 1.05, 0.52), V(0.32, 1.05, 0.52), 0.025, CHROME));
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), glow('#fff2c4', 3));
    lamp.position.set(0, 0.86, 1.02); g.add(lamp);
    const roll = roller([wf, wl, wr]);
    return { g, seat: 0.82, pose: 'ride', update: (dt, sp) => roll(dt, sp) };
  },

  // siêu xe mui trần: đỏ, đèn LED, viền vàng
  supercar() {
    const g = new THREE.Group();
    const paint = new THREE.MeshPhysicalMaterial({ color: '#d1121f', roughness: 0.22, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.08 });
    const side = new THREE.Shape();
    side.moveTo(-1.55, 0.18);
    side.lineTo(1.6, 0.18);
    side.quadraticCurveTo(1.72, 0.3, 1.6, 0.42);
    side.lineTo(0.6, 0.62);
    side.quadraticCurveTo(0.1, 0.72, -0.2, 0.66);
    side.lineTo(-1.2, 0.74);
    side.quadraticCurveTo(-1.6, 0.66, -1.55, 0.18);
    const geo = new THREE.ExtrudeGeometry(side, { depth: 1.5, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3, curveSegments: 10 });
    geo.translate(0, 0, -0.75);
    geo.rotateY(-Math.PI / 2); // mũi xe hướng +z
    const body = new THREE.Mesh(geo, paint);
    g.add(body);
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 0.9), DARK);
    cockpit.position.set(0, 0.66, -0.15); g.add(cockpit);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.34), new THREE.MeshPhysicalMaterial({ color: '#9fd3ff', transmission: 0.5, transparent: true, opacity: 0.45, roughness: 0.05 }));
    glass.position.set(0, 0.86, 0.38); glass.rotation.x = -0.9; g.add(glass);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.28), DARK);
    wing.position.set(0, 1.0, -1.5); g.add(wing);
    for (const s of [-1, 1]) g.add(tube(V(0.5 * s, 0.7, -1.45), V(0.5 * s, 1.0, -1.5), 0.03, DARK));
    const trim = mat('#f2b630', { metalness: 1, roughness: 0.25 });
    for (const s of [-1, 1]) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 2.6), trim);
      t.position.set(0.84 * s, 0.42, 0); g.add(t);
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.04), glow('#eaf6ff', 4));
      hl.position.set(0.48 * s, 0.4, 1.66); hl.rotation.y = 0.15 * s; g.add(hl);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.04), glow('#ff2140', 3.5));
      tl.position.set(0.5 * s, 0.62, -1.62); g.add(tl);
    }
    const ws = [];
    for (const [x, z] of [[-0.8, 1.05], [0.8, 1.05], [-0.8, -1.0], [0.8, -1.0]]) {
      const w = wheel(0.3, 0.1, '#f2b630', 5);
      w.position.set(x, 0.3, z); g.add(w); ws.push(w);
    }
    const roll = roller(ws);
    return { g, seat: 0.42, pose: 'drive', update: (dt, sp) => roll(dt, sp) };
  },
};

// chặng i → i+1 (tính theo chỉ số 0..7)
export const LEG_VEHICLES = [null, 'bicycle', 'scooter', 'bigbike', 'skate', 'tuktuk', 'supercar', null];
export const VEHICLE_KINDS = Object.keys(BUILD);

export function buildVehicle(kind) {
  const v = BUILD[kind]();
  v.kind = kind;
  v.g.visible = false;
  return v;
}
