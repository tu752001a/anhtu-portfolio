import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { Avatar } from './avatar.js';
import { Fx } from './fx.js';
import { buildGalaxy, buildStarfield, ShootingStars, buildHeroStar, makeProjectAsset, buildKey, ASSET_LOADS } from './cosmos.js';
import { buildVehicle, LEG_VEHICLES, VEHICLE_KINDS } from './vehicles.js';

// mỗi chương nhân vật diễn một kiểu riêng khi tới nơi
const CHAPTER_ACTS = ['wave', 'cool', 'clap', 'dance', 'peace', 'heart', 'bow', 'spin'];

const FLOOR = -3.4;
// vị trí ngang của nhân vật ở từng chương (dương = bên phải)
const CHAR_SIDE = [6, 4, 4, 4, 4, -3.2, 6, 6];

// Bảng màu cho từng chương: [nền sâu, giữa, ánh sáng]
const PALETTES = [
  ['#1e0b07', '#6e2814', '#e3a95c'], // mở đầu – hổ phách
  ['#170c11', '#5c2f3a', '#d9a48f'], // về tôi – hồng hoàng hôn
  ['#06080e', '#1c2740', '#e3a95c'], // showreel – rạp chiếu
  ['#140b05', '#57360f', '#f0c27a'], // dự án – vàng
  ['#05100e', '#1b4640', '#b9d6c2'], // kỹ năng – mực ngọc
  ['#0d0815', '#3a2852', '#d6b4e0'], // khách hàng – tím
  ['#0d0c06', '#46451f', '#e8d6a0'], // quy trình – rêu
  ['#180705', '#83301a', '#ffb36b'], // kết nối – hoàng hôn
].map((p) => p.map((c) => new THREE.Color(c)));

const damp = (a, b, l, dt) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-l * dt));
const wrap = (x) => ((x % 1) + 1) % 1;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const bez = (a, b, c, d, t) => {
  const u = 1 - t;
  return new THREE.Vector3().addScaledVector(a, u * u * u).addScaledVector(b, 3 * u * u * t).addScaledVector(c, 3 * u * t * t).addScaledVector(d, t * t * t);
};

export class World {
  constructor(canvas, content, chapterCount) {
    this.canvas = canvas;
    this.content = content;
    this.count = chapterCount;
    this.clock = new THREE.Clock();
    this.progress = 0; // giá trị liên tục, có thể vượt 1 (vòng lặp)
    this.speed = 0;
    this.look = { x: 0, y: 0, tx: 0, ty: 0 };
    this.pointer = new THREE.Vector2(0, 0);
    this.pointerSmooth = new THREE.Vector2(0, 0);
    this.intro = 0; // 0 → 1 khi bước vào
    this.introTarget = 0;
    this.clickables = [];
    this.hovered = null;
    this.onProjectClick = null;
    this.onHoverChange = null;
    this.isMobile = matchMedia('(max-width: 900px)').matches;
    this.loads = [];
    this.shot = null; // cảnh quay một shot (dolly in khi vào, dolly out khi quay về đầu)
    this.zoom = { cur: 0, target: 0 };
    this.cine = 0; // 0..1: rạp chiếu tối dần ở chương showreel
    this.introPitch = 0;
    this.introSpin = 0;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.isMobile ? 1.5 : 1.75));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x1e0b07, 0.012);
    this.camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 600);

    this.uniforms = {
      uTime: { value: 0 },
      uA: { value: PALETTES[0][0].clone() },
      uB: { value: PALETTES[0][1].clone() },
      uC: { value: PALETTES[0][2].clone() },
      uCine: { value: 0 },
    };

    this.buildPath();
    this.buildSky();
    this.buildCosmos();
    this.buildFloor();
    this.buildDust();
    this.buildThreads();
    this.stations = [];
    this.buildPortal();
    this.buildPhotos();
    this.buildScreen();
    this.buildProjects();
    this.buildBlobs();
    this.buildClients();
    this.buildArches();
    this.buildKeyStation();
    this.buildCharacter();
    this.buildHotspots();
    this.layout();
    this.buildComposer();

    this.raycaster = new THREE.Raycaster();
    addEventListener('resize', () => this.resize());
  }

  /* ---------------- Đường đi khép kín ---------------- */
  buildPath() {
    const pts = [];
    const N = 24;
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2;
      const r = 78 + 16 * Math.sin(a * 3 + 0.6);
      pts.push(new THREE.Vector3(Math.cos(a) * r, 2.2 * Math.sin(a * 2), Math.sin(a) * r));
    }
    this.curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    this.curve.arcLengthDivisions = 2000;
    this.curve.updateArcLengths();
    this.length = this.curve.getLength();
  }

  frameAt(u) {
    u = wrap(u);
    const p = this.curve.getPointAt(u);
    const t = this.curve.getTangentAt(u).normalize();
    const side = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(side, t).normalize();
    return { p, t, side, up };
  }

  stationU(i) { return i / this.count; }

  /* ---------------- Bầu trời lụa ---------------- */
  buildSky() {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uCine;
        varying vec3 vDir;
        float hash(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
        float noise(vec3 x){
          vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
          return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x), mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                     mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x), mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y), f.z);
        }
        float fbm(vec3 p){ float v=0.0; float a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.02; a*=0.5; } return v; }
        void main() {
          vec3 d = normalize(vDir);
          float t = uTime * 0.025;
          vec3 q = d * 2.2;
          float w = fbm(q + vec3(t, -t*0.6, t*0.4));
          float silk = fbm(q * 1.6 + w * 2.4 + vec3(-t*0.8, t, 0.0));
          float h = d.y * 0.5 + 0.5;
          vec3 col = mix(uA, uB, smoothstep(0.25, 0.85, silk) * (0.55 + 0.45 * h));
          float vein = smoothstep(0.62, 0.78, silk) * smoothstep(0.95, 0.6, silk);
          col += uC * vein * 0.35;
          col = mix(col, uA * 0.6, smoothstep(0.2, -0.6, d.y));
          // cực quang: dải màu chảy chậm, đổi sắc theo thời gian và hoà vào tông của từng chương
          float az = atan(d.z, d.x);
          float curtain = fbm(vec3(az * 2.2 + t * 1.5, d.y * 5.0 - t * 3.0, t * 0.7));
          float band = smoothstep(0.02, 0.3, d.y) * smoothstep(0.85, 0.35, d.y);
          float rib = pow(smoothstep(0.42, 0.78, curtain), 2.0) * band;
          vec3 hue = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + az * 0.16 + uTime * 0.018 + d.y * 0.8));
          vec3 aur = mix(hue, uC, 0.35) * (0.6 + 0.4 * sin(az * 9.0 + uTime * 0.4 + curtain * 6.0));
          col += aur * rib * 0.9;
          col *= 1.0 - uCine * 0.75;
          gl_FragColor = vec4(col * 0.42, 1.0);
        }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 32), mat);
    this.scene.add(this.sky);
  }

  /* ---------------- Vũ trụ: thiên hà, bầu sao, sao băng ---------------- */
  buildCosmos() {
    const pr = this.renderer.getPixelRatio();
    this.galaxy = buildGalaxy(this.uniforms, pr, this.isMobile);
    this.scene.add(this.galaxy.group);
    this.starfield = buildStarfield(this.uniforms, pr, this.isMobile);
    this.scene.add(this.starfield);
    this.shooting = new ShootingStars(this.scene, this.isMobile ? 2 : 3);
  }

  /* ---------------- Sàn xưởng gỗ & đèn rọi ---------------- */
  buildFloor() {
    this.spots = Array.from({ length: this.count }, () => new THREE.Vector3(0, 0, 0));
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...this.uniforms, uSpots: { value: this.spots }, uFogC: { value: new THREE.Color() } },
      vertexShader: /* glsl */ `
        varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          vec4 mvPosition = viewMatrix * w;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uSpots[${this.count}]; uniform vec3 uC; uniform vec3 uA; uniform float uTime; uniform float uCine; varying vec3 vW;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main(){
          vec2 p = vW.xz;
          // ván gỗ
          float row = floor(p.y / 1.6);
          float off = h(vec2(row, 1.0)) * 9.0;
          float plank = floor((p.x + off) / 9.0);
          float id = h(vec2(plank, row));
          vec2 lp = vec2(fract((p.x + off) / 9.0), fract(p.y / 1.6));
          float grain = sin((p.x + id * 30.0) * 1.2 + sin(p.y * 6.0 + id * 9.0) * 1.4) * 0.5 + 0.5;
          vec3 wood = mix(vec3(0.16, 0.085, 0.045), vec3(0.32, 0.18, 0.09), id * 0.6 + grain * 0.25);
          float seam = smoothstep(0.0, 0.015, lp.y) * smoothstep(0.0, 0.004, lp.x);
          wood *= 0.55 + 0.45 * seam;
          // vũng sáng dưới mỗi đèn
          float light = 0.22 + 0.1 * sin(p.x * 0.02) * sin(p.y * 0.017);
          for (int i = 0; i < ${this.count}; i++) {
            float d = length(p - uSpots[i].xz);
            light += exp(-d * d / (uSpots[i].y * uSpots[i].y)) * 2.4;
          }
          vec3 col = wood * light * mix(vec3(1.0), uC * 1.4, 0.35) * 1.5 * (1.0 - uCine * 0.72);
          // phản chiếu ánh vàng nhẹ như sàn vecni
          col += uC * 0.04 * pow(grain, 8.0) * light;
          gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
        }`,
      fog: true,
    });
    Object.assign(mat.uniforms, THREE.UniformsUtils.clone(THREE.UniformsLib.fog));
    mat.fragmentShader = '#include <fog_pars_fragment>\n' + mat.fragmentShader;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR;
    this.scene.add(floor);
    this.floor = floor;

    // đèn rọi treo trần
    this.lamps = [];
    const beamMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uC; uniform float uCine; varying vec2 vUv;
        void main(){
          float rays = 0.75 + 0.25 * sin(vUv.x * 50.0 + uTime * 0.3) * sin(vUv.x * 17.0 - uTime * 0.2);
          float a = pow(vUv.y, 1.6) * 0.075 * rays * (1.0 - uCine * 0.92);
          gl_FragColor = vec4(mix(vec3(1.0, 0.88, 0.7), uC, 0.3) * a, 1.0);
        }`,
    });
    for (let i = 0; i < this.count; i++) {
      const g = new THREE.Group();
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 9, 33.4, 40, 1, true), beamMat);
      beam.position.y = -16.7;
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.4, 1.2, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#0b0705', side: THREE.DoubleSide }));
      const bulb = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a0').multiplyScalar(3) }));
      bulb.rotation.x = Math.PI / 2;
      bulb.position.y = -0.55;
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 40, 4), new THREE.MeshBasicMaterial({ color: '#2a1d14' }));
      cord.position.y = 20.5;
      g.add(beam, shade, bulb, cord);
      this.scene.add(g);
      this.lamps.push(g);
    }
  }

  /* ---------------- Điểm chạm lục giác ---------------- */
  hexTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    const hex = (r) => { x.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; x.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } x.closePath(); };
    const gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(242,182,48,0.45)'); gr.addColorStop(1, 'rgba(242,182,48,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
    hex(92); x.strokeStyle = '#f2b630'; x.lineWidth = 7; x.stroke();
    hex(40); x.fillStyle = '#ffd36b'; x.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  buildHotspots() {
    const tex = this.hexTexture();
    this.hotspots = [];
    for (let i = 0; i < this.count; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.renderOrder = 10;
      sp.userData = { station: i, phase: i * 0.7 };
      this.scene.add(sp);
      this.hotspots.push(sp);
      this.clickables.push(sp);
    }
  }

  // toạ độ 0..1 trên bản đồ nhỏ (nhìn từ trên xuống)
  mapPoint(u) {
    if (!this.mapBounds) {
      let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
      for (let i = 0; i < 200; i++) { const p = this.curve.getPointAt(i / 200); a = Math.min(a, p.x); b = Math.max(b, p.x); c = Math.min(c, p.z); d = Math.max(d, p.z); }
      const r = Math.max(b - a, d - c);
      this.mapBounds = { x: a - (r - (b - a)) / 2, z: c - (r - (d - c)) / 2, r };
    }
    const p = this.curve.getPointAt(wrap(u));
    const m = this.mapBounds;
    return [(p.x - m.x) / m.r, (p.z - m.z) / m.r];
  }

  /* ---------------- Bụi sáng ---------------- */
  buildDust() {
    const n = this.isMobile ? 1600 : 3200;
    const pos = new Float32Array(n * 3);
    const rnd = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const { p, side, up } = this.frameAt(Math.random());
      const r = 3 + Math.pow(Math.random(), 0.7) * 34;
      const a = Math.random() * Math.PI * 2;
      p.addScaledVector(side, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r * 0.6);
      pos.set([p.x, p.y, p.z], i * 3);
      rnd[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { ...this.uniforms, uPR: { value: this.renderer.getPixelRatio() } },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uPR; uniform float uCine; attribute float aRnd; varying float vA; varying vec3 vHue;
        void main() {
          vec3 p = position;
          vHue = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + aRnd + uTime * 0.03));
          p.y += sin(uTime * 0.3 + aRnd * 40.0) * 0.8;
          p.x += cos(uTime * 0.2 + aRnd * 30.0) * 0.6;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float s = mix(1.0, 4.0, pow(aRnd, 3.0));
          gl_PointSize = s * uPR * (60.0 / -mv.z);
          vA = (0.35 + 0.65 * sin(uTime * (0.6 + aRnd) + aRnd * 60.0) * 0.5 + 0.5) * smoothstep(160.0, 20.0, -mv.z) * (1.0 - uCine * 0.6);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uC; varying float vA; varying vec3 vHue;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          vec3 base = mix(vec3(1.0, 0.92, 0.8), uC, 0.5);
          gl_FragColor = vec4(mix(base, vHue * 1.2, 0.35) * a * vA, 1.0);
        }`,
    });
    this.dust = new THREE.Points(g, mat);
    this.scene.add(this.dust);
  }

  /* ---------------- Sợi chỉ dẫn đường ---------------- */
  buildThreads() {
    this.threads = new THREE.Group();
    const mk = (phase, radius, turns, color) => {
      const pts = [];
      const N = 900;
      for (let i = 0; i < N; i++) {
        const u = i / N;
        const { p, side, up } = this.frameAt(u);
        const a = u * Math.PI * 2 * turns + phase;
        p.addScaledVector(side, Math.cos(a) * radius).addScaledVector(up, Math.sin(a) * radius * 0.5 - 2.4);
        pts.push(p);
      }
      const c = new THREE.CatmullRomCurve3(pts, true);
      const geo = new THREE.TubeGeometry(c, 1800, 0.045, 5, true);
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: this.uniforms.uTime, uCol: { value: new THREE.Color(color) }, uPhase: { value: phase } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uCol; uniform float uPhase; varying vec2 vUv;
          void main(){
            float x = vUv.x * 160.0 - uTime * 0.9 + uPhase;
            float pulse = pow(0.5 + 0.5 * sin(x), 14.0);
            float base = 0.22 + 0.15 * sin(vUv.x * 900.0 + uPhase);
            gl_FragColor = vec4(uCol * (base + pulse * 2.4), 1.0);
          }`,
      });
      this.threads.add(new THREE.Mesh(geo, mat));
    };
    mk(0, 1.1, 14, '#e3a95c');
    mk(Math.PI, 1.1, 14, '#c8553d');
    mk(Math.PI / 2, 2.6, 6, '#f3e9d7');
    this.scene.add(this.threads);
  }

  /* ---------------- Tiện ích ---------------- */
  textTexture(lines, { w = 1024, h = 1024, bg = null, align = 'center' } = {}) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    if (bg) bg(g, w, h);
    g.textAlign = align;
    g.textBaseline = 'middle';
    for (const l of lines) {
      g.font = l.font;
      g.fillStyle = l.color || '#f3e9d7';
      if (l.spacing) g.letterSpacing = l.spacing;
      g.fillText(l.text, l.x ?? w / 2, l.y, w * 0.9);
      g.letterSpacing = '0px';
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  glowTexture(color = '255,190,120') {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, `rgba(${color},1)`);
    gr.addColorStop(0.25, `rgba(${color},0.35)`);
    gr.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  addStation(index, group, place) {
    this.scene.add(group);
    this.stations.push({ index, group, place });
  }

  // Đặt vật thể quanh trạm dừng, xoay về phía máy quay
  layout() {
    const portrait = this.camera.aspect < 0.9;
    const done = new Set();
    for (const s of this.stations) {
      const pl = s.place;
      const u = this.stationU(s.index) + (pl.du || 0);
      const { p, t, side, up } = this.frameAt(u);
      const sideAmt = portrait ? (pl.side || 0) * 0.25 : pl.side || 0;
      const upAmt = (pl.up || 0) + (portrait ? pl.upPortrait || 0 : 0);
      s.group.position.copy(p).addScaledVector(t, pl.fwd || 0).addScaledVector(side, sideAmt).addScaledVector(up, upAmt);
      if (pl.onView) {
        // đặt đúng giữa hướng nhìn của máy quay tại trạm
        const su = this.stationU(s.index);
        const cam = this.frameAt(su).p.add(new THREE.Vector3(0, 1.5, 0));
        const look = this.curve.getPointAt(wrap(su + 0.018)).add(new THREE.Vector3(0, 1.2, 0)).sub(cam).normalize();
        s.group.position.copy(cam).addScaledVector(look, pl.fwd).addScaledVector(side, sideAmt).addScaledVector(up, upAmt);
      }
      if (pl.face !== false) {
        const cam = this.frameAt(this.stationU(s.index)).p.add(new THREE.Vector3(0, 1.5, 0));
        s.group.lookAt(cam);
      } else {
        s.group.lookAt(s.group.position.clone().add(t));
      }
      const sc = portrait ? pl.portraitScale || 0.8 : 1;
      s.group.scale.setScalar(sc);
      if (!done.has(s.index)) {
        done.add(s.index);
        const gp = s.group.position;
        this.lamps[s.index].position.set(gp.x, 30, gp.z);
        this.spots[s.index].set(gp.x, pl.pool || 12, gp.z);
        const hp = this.frameAt(this.stationU(s.index)).p;
        this.hotspots[s.index].position.copy(gp).lerp(hp, 0.35).add(new THREE.Vector3(0, pl.hot ?? 4.5, 0));
      }
    }
  }

  /* ---------------- 0. Cổng khởi đầu ---------------- */
  buildPortal() {
    const g = new THREE.Group();
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffcf8a').multiplyScalar(2.2) });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(7, 0.035, 8, 220), ringMat);
    g.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(7.6, 0.012, 6, 220), new THREE.MeshBasicMaterial({ color: '#e3a95c', transparent: true, opacity: 0.6 }));
    g.add(ring2);

    const n = 1400;
    const pos = new Float32Array(n * 3);
    const rnd = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 7 + (Math.random() - 0.5) * 2.4 * Math.random();
      pos.set([Math.cos(a) * r, Math.sin(a) * r, (Math.random() - 0.5) * 1.2], i * 3);
      rnd[i] = Math.random();
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pg.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
    const pm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: this.uniforms.uTime, uPR: { value: this.renderer.getPixelRatio() } },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uPR; attribute float aRnd; varying float vA;
        void main(){
          vec3 p = position;
          float a = uTime * (0.05 + aRnd * 0.12);
          p.xy = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xy;
          p *= 1.0 + 0.04 * sin(uTime + aRnd * 20.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.0 + 3.0 * aRnd) * uPR * (40.0 / -mv.z);
          vA = 0.4 + 0.6 * aRnd;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(1.0, 0.8, 0.55) * smoothstep(0.5, 0.0, d) * vA, 1.0); }`,
    });
    g.add(new THREE.Points(pg, pm));

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture(), transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.setScalar(26);
    g.add(halo);
    this.portal = { g, ring, ring2 };
    this.buildName(g);
    this.addStation(0, g, { fwd: 22, up: 2.2, upPortrait: 6, portraitScale: 0.62, face: false, onView: true });
  }

  // Tên ghép từ hàng nghìn hạt sáng: tan ra khi rời cổng, tụ lại khi quay về
  buildName(parent) {
    const text = this.content.hero?.particleName || (this.content.hero?.name || 'Anh Tú').split(' ').slice(-2).join(' ');
    const lines = String(text).split('\n');
    const W = 1400, H = 330 * lines.length;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    let size = 260;
    x.font = `italic 400 ${size}px "Cormorant Garamond"`;
    const tw = Math.max(...lines.map((l) => x.measureText(l).width));
    if (tw > W * 0.92) size *= (W * 0.92) / tw;
    x.font = `italic 400 ${size}px "Cormorant Garamond"`;
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    lines.forEach((l, i) => x.fillText(l, W / 2, (H / lines.length) * (i + 0.5)));
    const img = x.getImageData(0, 0, W, H).data;
    const step = this.isMobile ? 4 : 3;
    const target = [];
    for (let py = 0; py < H; py += step) for (let px = 0; px < W; px += step) {
      if (img[(py * W + px) * 4 + 3] > 140) target.push(px, py);
    }
    const n = target.length / 2;
    const scale = 11 / W;
    const pos = new Float32Array(n * 3), scat = new Float32Array(n * 3), rnd = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos.set([(target[i * 2] - W / 2) * scale, -(target[i * 2 + 1] - H / 2) * scale, (Math.random() - 0.5) * 0.15], i * 3);
      const r = 8 + Math.random() * 40, a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
      scat.set([r * Math.sin(b) * Math.cos(a), r * Math.cos(b) * 0.6, r * Math.sin(b) * Math.sin(a)], i * 3);
      rnd[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scat, 3));
    geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: this.uniforms.uTime, uForm: { value: 0 }, uBurst: { value: 0 }, uMouse: { value: new THREE.Vector3(99, 99, 0) }, uPR: { value: this.renderer.getPixelRatio() }, uMode: { value: 0 }, uFx: { value: 1 } },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uForm; uniform float uBurst; uniform vec3 uMouse; uniform float uPR; uniform float uMode; uniform float uFx;
        attribute vec3 aScatter; attribute float aRnd; varying float vA; varying float vGlow;
        float h1(float n){ return fract(sin(n) * 43758.5453); }
        // 6 hiệu ứng chữ chạy ngẫu nhiên: 0 tụ sao, 1 mưa sao, 2 sóng, 3 nhiễu glitch, 4 lốc xoáy, 5 quét sáng
        vec3 fxStart(vec3 t, float m, float nx){
          if (m < 0.5) return aScatter * 0.35;
          if (m < 1.5) return t + vec3((aRnd - 0.5) * 1.5, 7.0 + aRnd * 6.0, (aRnd - 0.5) * 2.0);
          if (m < 2.5) return t + vec3(0.0, sin(nx * 14.0) * 1.6, 2.5 + cos(nx * 9.0) * 1.2);
          if (m < 3.5) { float row = floor(t.y * 5.0); return t + vec3((h1(row * 7.1) - 0.5) * 6.0, 0.0, (h1(row * 3.3) - 0.5) * 1.5); }
          if (m < 4.5) { float a = (1.0 + aRnd) * 6.2831; float r = length(t.xz) + 2.0 + aRnd * 3.0; return vec3(cos(a) * r, t.y + (aRnd - 0.5) * 4.0, sin(a) * r); }
          return t + vec3(-3.0 - aRnd * 2.0, 0.0, 3.5);
        }
        float fxDelay(float m, float nx){
          if (m < 0.5) return aRnd * 0.5;
          if (m < 1.5) return aRnd * 0.35 + nx * 0.25;
          if (m < 2.5) return nx * 0.6;
          if (m < 3.5) return step(0.5, aRnd) * 0.25 + aRnd * 0.1;
          if (m < 4.5) return aRnd * 0.45;
          return nx * 0.65;
        }
        void main(){
          float f = smoothstep(aRnd * 0.45, 0.55 + aRnd * 0.45, uForm);
          vec3 swirl = aScatter;
          float ang = uTime * 0.05 * (0.5 + aRnd);
          swirl.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * swirl.xz;
          float nx = clamp(position.x / 11.0 + 0.5, 0.0, 1.0);
          float dl = fxDelay(uMode, nx);
          float k = smoothstep(0.0, 1.0, clamp((uFx - dl) / 0.35, 0.0, 1.0));
          vec3 tgt = mix(fxStart(position, uMode, nx), position, k);
          if (uMode > 3.5 && uMode < 4.5) {
            float a2 = (1.0 - k) * (3.0 + aRnd * 3.0);
            tgt.xz = mat2(cos(a2), -sin(a2), sin(a2), cos(a2)) * tgt.xz;
          }
          if (uMode > 2.5 && uMode < 3.5) tgt.x += sin(uTime * 60.0 + aRnd * 30.0) * 0.08 * (1.0 - k) * step(0.02, 1.0 - k);
          vGlow = k * (1.0 - k) * 4.0;
          if (uMode > 4.5) vGlow += smoothstep(0.12, 0.0, abs(uFx * 1.4 - 0.2 - nx)) * 1.5;
          vec3 p = mix(swirl, tgt, f);
          // chạm vào tên: nổ tung thành bụi sao rồi tụ lại
          p += normalize(aScatter) * uBurst * (2.0 + aRnd * 5.0);
          p += vec3(sin(uTime * 1.3 + aRnd * 50.0), cos(uTime * 1.1 + aRnd * 40.0), sin(uTime * 0.9 + aRnd * 30.0)) * (0.03 + 0.4 * (1.0 - f));
          vec2 d = p.xy - uMouse.xy;
          float push = exp(-dot(d, d) * 1.6) * f;
          p.xy += normalize(d + 1e-4) * push * 0.9;
          p.z += push * 1.2;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.2 + 2.2 * aRnd + push * 3.0 + vGlow * 1.5) * uPR * (34.0 / -mv.z);
          vA = mix(0.35, 1.0, f) * (0.6 + 0.4 * sin(uTime * 2.0 + aRnd * 30.0)) + push + vGlow * 0.8;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA; varying float vGlow;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          vec3 c = mix(vec3(1.0, 0.86, 0.66), vec3(0.75, 0.9, 1.0), clamp(vGlow, 0.0, 1.0) * 0.6);
          gl_FragColor = vec4(c * smoothstep(0.5, 0.0, d) * vA, 1.0);
        }`,
    });
    const pts = new THREE.Points(geo, mat);
    pts.rotation.y = Math.PI; // nhóm cổng quay lưng về máy quay
    pts.position.y = lines.length > 1 ? 0.2 : 0.4;
    parent.add(pts);
    this.namePts = pts;
    this.nameBurst = 0;
    this.nameFx = { t: 3.4, wait: 3, out: 0, in: 0 };
    const hit = new THREE.Mesh(new THREE.PlaneGeometry(11, (H / W) * 11), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    hit.userData.kind = 'name';
    pts.add(hit);
    this.clickables.push(hit);
  }

  /* ---------------- 1. Khung ảnh chân dung ---------------- */
  photoMaterial() {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { map: { value: null }, uHas: { value: 0 }, uScale: { value: new THREE.Vector2(1, 1) }, uTime: this.uniforms.uTime, uFocus: { value: 1 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv; uniform float uTime;
        void main(){ vUv = uv; vec3 p = position; p.z += sin(uv.y * 3.0 + uTime) * 0.06; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D map; uniform float uHas; uniform vec2 uScale; uniform float uFocus; uniform float uTime; varying vec2 vUv;
        float rbox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) - r; }
        void main(){
          vec2 uv = (vUv - 0.5) * uScale + 0.5;
          vec3 col = vec3(0.0);
          if (uHas > 0.5) col = texture2D(map, uv).rgb;
          else col = mix(vec3(0.35, 0.18, 0.12), vec3(0.85, 0.6, 0.4), vUv.y);
          float l = dot(col, vec3(0.299, 0.587, 0.114));
          vec3 warm = mix(vec3(0.12, 0.06, 0.04), vec3(1.08, 0.94, 0.78), l);
          col = mix(col, warm, 0.35 + 0.4 * (1.0 - uFocus));
          col *= mix(0.45, 1.0, uFocus);
          float v = smoothstep(0.9, 0.2, length(vUv - 0.5));
          col *= 0.65 + 0.35 * v;
          // vệt cháy phim nhẹ
          col += vec3(1.0, 0.5, 0.2) * smoothstep(0.75, 1.0, vUv.x + 0.15 * sin(vUv.y * 6.0 + uTime * 0.5)) * 0.25;
          float d = rbox(vUv - 0.5, vec2(0.5), 0.03);
          float a = smoothstep(0.0, -0.004, d);
          float border = smoothstep(-0.02, -0.012, d) * a;
          col = mix(col, vec3(0.96, 0.9, 0.8), border * 0.9);
          gl_FragColor = vec4(col, a);
        }`,
    });
  }

  buildPhotos() {
    const g = new THREE.Group();
    const urls = (this.content.about?.photos || []).filter(Boolean).slice(0, 6);
    const list = urls.length ? urls : [null];
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    this.photos = list.map((url, i) => {
      const mat = this.photoMaterial();
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 5.6, 1, 16), mat);
      if (url) {
        this.loads.push(new Promise((res) => loader.load(url, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          const ia = tex.image.width / tex.image.height;
          const pa = 4.2 / 5.6;
          mat.uniforms.uScale.value.set(ia > pa ? pa / ia : 1, ia > pa ? 1 : ia / pa);
          mat.uniforms.map.value = tex;
          mat.uniforms.uHas.value = 1;
          res();
        }, undefined, res)));
      }
      mesh.userData.kind = 'photo';
      g.add(mesh);
      this.clickables.push(mesh);
      return { mesh, slot: i, cur: i };
    });
    this.photoGroup = g;
    this.addStation(1, g, { fwd: 15, side: 6.5, up: 1.2, upPortrait: 6.5, portraitScale: 0.6 });
  }

  // dir = 1: ảnh kế tiếp, -1: ảnh trước. Trả về số thứ tự ảnh đang ở trước.
  cyclePhoto(dir = 1) {
    const n = this.photos.length;
    for (const ph of this.photos) ph.slot = (ph.slot + n - dir) % n;
    this.photoFlip = dir;
    return this.photos.findIndex((p) => p.slot === 0);
  }

  /* ---------------- 2. Màn chiếu ---------------- */
  buildScreen() {
    const g = new THREE.Group();
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uC; varying vec2 vUv;
        void main(){
          vec2 p = vUv - 0.5; p.x *= 16.0/9.0;
          float t = uTime * 0.4;
          float leak = 0.5 + 0.5 * sin(p.x * 2.2 + t) * cos(p.y * 3.1 - t * 0.7);
          float leak2 = 0.5 + 0.5 * sin(length(p - vec2(sin(t*0.5), cos(t*0.3)) * 0.4) * 6.0 - t * 1.4);
          vec3 col = mix(vec3(0.06, 0.04, 0.05), uC, leak * 0.55);
          col += vec3(1.0, 0.45, 0.2) * pow(leak2, 6.0) * 0.6;
          float scan = 0.94 + 0.06 * sin(vUv.y * 600.0 + uTime * 20.0);
          float flick = 0.92 + 0.08 * fract(sin(floor(uTime * 18.0)) * 43758.5);
          col *= scan * flick;
          col *= smoothstep(0.75, 0.25, length(vUv - 0.5));
          float frame = step(0.012, vUv.x) * step(vUv.x, 0.988) * step(0.02, vUv.y) * step(vUv.y, 0.98);
          col = mix(vec3(0.9, 0.82, 0.7), col, frame);
          gl_FragColor = vec4(col * 1.4, 1.0);
        }`,
    });
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), mat);
    screenMesh.userData.kind = 'screen';
    g.add(screenMesh);
    this.clickables.push(screenMesh);
    // showreel phát thẳng trên màn chiếu (tắt tiếng), chạm để xem có tiếng
    const src = this.content.showreel?.video;
    if (src && /\.(mp4|webm|mov)(\?|#|$)/i.test(src)) {
      const v = document.createElement('video');
      v.crossOrigin = 'anonymous';
      v.muted = true; v.loop = false; v.playsInline = true; v.preload = 'auto';
      v.src = src;
      const tex = new THREE.VideoTexture(v);
      tex.colorSpace = THREE.SRGBColorSpace;
      const vmat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
      this.reelMat = vmat;
      v.addEventListener('playing', () => { screenMesh.material = vmat; });
      v.addEventListener('ended', () => { this.reelDone = true; });
      v.addEventListener('error', () => { screenMesh.material = mat; this.reelVideo = null; });
      this.reelVideo = v;
      // đợi có khung hình đầu để khi tới nơi phim chiếu ngay, không giật
      this.loads.push(new Promise((res) => {
        if (v.readyState >= 2) return res();
        v.addEventListener('loadeddata', res, { once: true });
        v.addEventListener('error', res, { once: true });
        setTimeout(res, 7000);
      }));
    }
    // máy chiếu phía sau khán giả: chùm sáng hình chóp phủ đúng khung màn, bật khi vào "rạp"
    const proj = new THREE.Group();
    proj.position.set(0, 5.5, 34);
    const projBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 2.2), new THREE.MeshStandardMaterial({ color: '#1b1714', roughness: 0.5, metalness: 0.6 }));
    proj.add(projBody);
    for (const z of [-0.6, 0.6]) {
      const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.12, 28), new THREE.MeshStandardMaterial({ color: '#2a2420', metalness: 0.7, roughness: 0.3 }));
      reel.rotation.z = Math.PI / 2; reel.position.set(0, 1.3, z);
      proj.add(reel);
    }
    this.projReels = proj.children.slice(1);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4dc').multiplyScalar(4), toneMapped: false, transparent: true }));
    lens.position.set(0, 0, -1.11); lens.rotation.y = Math.PI;
    proj.add(lens);
    g.add(proj);
    const L0 = new THREE.Vector3(0, 5.5, 32.8);
    const corners = [[-8, -4.5], [8, -4.5], [8, 4.5], [-8, 4.5]].map(([x, y]) => new THREE.Vector3(x, y, 0.05));
    const P = [], UV = [], I = [];
    corners.forEach((c, i) => {
      const n = corners[(i + 1) % 4];
      const k = P.length / 3;
      P.push(L0.x, L0.y, L0.z, c.x, c.y, c.z, n.x, n.y, n.z);
      UV.push(0.5, 0, 0, 1, 1, 1);
      I.push(k, k + 1, k + 2);
    });
    const coneGeo = new THREE.BufferGeometry();
    coneGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    coneGeo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
    coneGeo.setIndex(I);
    const coneMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uTime: this.uniforms.uTime, uOn: { value: 0 } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uOn; varying vec2 vUv;
        void main(){
          float flick = 0.9 + 0.1 * sin(uTime * 37.0) * sin(uTime * 23.0);
          float dust = 0.75 + 0.25 * sin(vUv.x * 80.0 + uTime * 0.7) * sin(vUv.y * 40.0 - uTime * 0.5);
          float a = (0.05 + 0.1 * (1.0 - vUv.y)) * dust * flick * uOn;
          gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * a, 1.0);
        }`,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    g.add(cone);
    this.screen = { g, cone, lens, screenMesh };
    this.addStation(2, g, { fwd: 30, side: 4, up: 3, upPortrait: 6, portraitScale: 0.55 });
  }

  /* ---------------- 3. Phòng trưng bày dự án ---------------- */
  buildProjects() {
    const g = new THREE.Group();
    const items = this.content.projects?.items || [];
    const n = Math.max(items.length, 1);
    this.projectFrames = items.map((it, i) => {
      const num = String(i + 1).padStart(2, '0');
      const tex = this.textTexture(
        [
          { text: num, font: 'italic 300 150px "Cormorant Garamond"', color: '#e3a95c', y: 250 },
          { text: (it.title || '').split('—')[0].trim(), font: '400 84px "Cormorant Garamond"', y: 560 },
          { text: (it.client || '').toUpperCase(), font: '300 34px "Be Vietnam Pro"', color: 'rgba(243,233,215,0.6)', y: 690, spacing: '8px' },
          { text: (it.type || '').toUpperCase(), font: '300 26px "Be Vietnam Pro"', color: 'rgba(227,169,92,0.8)', y: 1060, spacing: '6px' },
        ],
        {
          w: 1024, h: 1365,
          bg: (x, w, h) => {
            const gr = x.createLinearGradient(0, 0, w, h);
            gr.addColorStop(0, '#2a1810'); gr.addColorStop(1, '#0f0906');
            x.fillStyle = gr; x.fillRect(0, 0, w, h);
            x.strokeStyle = 'rgba(243,233,215,0.35)'; x.lineWidth = 3; x.strokeRect(40, 40, w - 80, h - 80);
            x.beginPath(); x.moveTo(w / 2 - 60, 900); x.lineTo(w / 2 + 60, 900); x.strokeStyle = '#e3a95c'; x.stroke();
          },
        },
      );
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.8), mat);
      const a = (i - (n - 1) / 2) * 0.42;
      mesh.position.set(Math.sin(a) * 11, Math.sin(i * 1.7) * 1.2, -Math.cos(a) * 11 + 11);
      mesh.lookAt(0, mesh.position.y, 14);
      mesh.userData = { kind: 'project', project: i, base: mesh.position.clone(), hover: 0 };
      g.add(mesh);
      this.clickables.push(mesh);
      // hoạt ảnh đặc trưng của từng dự án lơ lửng phía trên khung
      const asset = makeProjectAsset(it.anim, i);
      asset.g.position.copy(mesh.position).add(new THREE.Vector3(0, 3.6, 0));
      asset.g.scale.setScalar(0.95);
      g.add(asset.g);
      mesh.userData.asset = asset;
      return mesh;
    });
    this.addStation(3, g, { fwd: 26, side: 11, up: 1, upPortrait: 5, portraitScale: 0.55 });
  }

  /* ---------------- 4. Giọt màu kỹ năng ---------------- */
  buildBlobs() {
    const g = new THREE.Group();
    const all = (this.content.skills?.groups || []).flatMap((gr) => gr.items || []);
    const n = Math.min(Math.max(all.length, 4), 10);
    const geo = new THREE.IcosahedronGeometry(1, 24);
    this.blobs = [];
    for (let i = 0; i < n; i++) {
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: this.uniforms.uTime, uSeed: { value: i * 1.37 }, uC: this.uniforms.uC, uB: this.uniforms.uB },
        vertexShader: /* glsl */ `
          uniform float uTime; uniform float uSeed; varying vec3 vN; varying vec3 vV; varying float vD;
          void main(){
            vec3 p = position;
            float t = uTime * 0.6 + uSeed;
            float d = sin(p.x * 3.0 + t) * sin(p.y * 3.4 + t * 1.3) * sin(p.z * 2.8 + t * 0.7);
            d += 0.5 * sin(p.x * 6.0 - t * 1.6 + p.z * 4.0);
            p += normal * d * 0.18;
            vD = d;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vN = normalize(normalMatrix * normal);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uC; uniform vec3 uB; uniform float uSeed; varying vec3 vN; varying vec3 vV; varying float vD;
          void main(){
            float f = pow(1.0 - max(dot(vN, vV), 0.0), 2.2);
            vec3 iri = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + f * 0.8 + vD * 0.4 + uSeed * 0.1));
            vec3 col = mix(uB * 0.6, uC, 0.35 + 0.3 * vD);
            col = mix(col, iri * uC * 1.4, f);
            col += f * 0.6;
            gl_FragColor = vec4(col, 1.0);
          }`,
      });
      const m = new THREE.Mesh(geo, mat);
      const s = 0.55 + ((i * 37) % 10) / 10 * 0.9;
      m.scale.setScalar(s);
      m.userData = { kind: 'blob', r: 3 + (i % 3) * 1.6, a: (i / n) * Math.PI * 2, y: ((i * 53) % 7) / 7 * 4 - 2, sp: 0.12 + (i % 4) * 0.04, s, poke: 0 };
      g.add(m);
      this.clickables.push(m);
      this.blobs.push(m);
    }
    this.addStation(4, g, { fwd: 18, side: 7, up: 1, upPortrait: 5, portraitScale: 0.6 });
  }

  /* ---------------- 5. Vòng tên khách hàng ---------------- */
  buildClients() {
    const g = new THREE.Group();
    const names = (this.content.clients?.groups || []).flatMap((gr) => gr.items || []).map((x) => (typeof x === 'string' ? { name: x } : x));
    this.clientSprites = names.map(({ name, url }, i) => {
      const tex = this.textTexture([{ text: name, font: 'italic 300 120px "Cormorant Garamond"', y: 128 }], { w: 1024, h: 256 });
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      sp.scale.set(7, 1.75, 1);
      sp.userData = { kind: 'client', url, a: (i / names.length) * Math.PI * 2, y: Math.sin(i * 2.1) * 2.2, poke: 0 };
      g.add(sp);
      if (url) this.clickables.push(sp);
      return sp;
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(8, 0.01, 4, 200), new THREE.MeshBasicMaterial({ color: '#d6b4e0', transparent: true, opacity: 0.4 }));
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    this.clientRing = g;
    this.addStation(5, g, { fwd: 24, side: -9, up: 0.5, upPortrait: 5, portraitScale: 0.55, face: false });
  }

  /* ---------------- 6. Cổng vòm quy trình ---------------- */
  buildArches() {
    this.arches = [];
    const steps = this.content.process?.steps || [];
    steps.forEach((_, i) => {
      const g = new THREE.Group();
      const geo = new THREE.TorusGeometry(5.5, 0.03, 6, 120, Math.PI);
      const arch = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#e8d6a0'), transparent: true, opacity: 0.45 }));
      arch.position.y = -1;
      g.add(arch);
      for (const sx of [-5.5, 5.5]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 6, 6), arch.material);
        leg.position.set(sx, -4, 0);
        g.add(leg);
      }
      const tex = this.textTexture([{ text: String(i + 1).padStart(2, '0'), font: 'italic 300 180px "Cormorant Garamond"', color: '#e8d6a0', y: 128 }], { w: 512, h: 256 });
      const num = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      num.scale.set(2.4, 1.2, 1);
      num.position.y = 5.6;
      g.add(num);
      this.arches.push(g);
      this.addStation(6, g, { du: 0.014 + i * 0.02, up: 1.6, face: false, portraitScale: 1 });
    });
  }

  /* ---------------- 7. Chìa khóa vàng bay lên ---------------- */
  buildKeyStation() {
    const k = buildKey();
    this.keyObj = k;
    this.keyRise = 0;
    this.keyOpen = 0;
    this.clickables.push(k.hit);
    this.addStation(7, k.group, { onView: true, fwd: 26, side: -9, up: 1, upPortrait: 8, portraitScale: 0.7 });
  }

  /* ---------------- Nhân vật ---------------- */
  buildCharacter() {
    this.scene.add(new THREE.HemisphereLight('#ffe2b8', '#2a160c', 1.1));
    const fill = new THREE.DirectionalLight('#ffe9cc', 0.9);
    fill.position.set(0, 1, 0);
    this.scene.add(fill, fill.target);
    this.fill = fill;
    this.hero = new Avatar();
    this.scene.add(this.hero.root);
    this.clickables.push(this.hero.hit);
    this.fx = new Fx(this);
    this.hero.onEmote = (kind) => this.fx.emote(kind, this.hero.root.position);
    this.heroStar = buildHeroStar((this.content.hero?.name || 'Anh Tú').split(' ').slice(-2).join(' '));
    this.scene.add(this.heroStar.group);
    this.clickables.push(this.heroStar.hit);
    this.actQueue = null;
    this.actCycle = 0;
    const foot = new THREE.Vector3();
    this.hero.onStep = (side) => {
      if (this.intro < 0.9) return;
      (side > 0 ? this.hero.legL : this.hero.legR).an.getWorldPosition(foot);
      this.fx.step(foot);
    };
    this.lastIdx = 0;
    this.charSide = CHAR_SIDE[0];
    this.introAngle = 0;
    // phương tiện cho từng chặng: gắn dưới chân nhân vật, bật lên khi lên đường
    this.vehicles = {};
    for (const k of VEHICLE_KINDS) {
      const v = buildVehicle(k);
      v.pop = 0;
      this.hero.root.add(v.g);
      this.vehicles[k] = v;
    }
    this.legKind = null;
  }

  /* ---------------- Tải trước & làm nóng ---------------- */
  // Đợi mọi ảnh, video, texture; biên dịch shader và vẽ thử từng trạm để lúc vào không giật hình
  async prepare(onProgress = () => {}) {
    const loads = [...this.loads, ...ASSET_LOADS];
    let done = 0;
    const tick = () => onProgress(0.6 * (++done / Math.max(loads.length, 1)));
    await Promise.all(loads.map((p) => p.then(tick, tick)));
    onProgress(0.62);
    // bật mọi thứ đang ẩn để shader và texture đều được biên dịch, nạp lên GPU
    const hidden = [];
    this.scene.traverse((o) => { if (!o.visible) { hidden.push(o); o.visible = true; } });
    this.hero.mat.face.map = this.hero.faces.normal;
    for (const t of Object.values(this.hero.faces)) this.renderer.initTexture(t);
    this.scene.traverse((o) => {
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) for (const k of ['map', 'emissiveMap']) if (m[k] && m[k].image && !m[k].isVideoTexture) this.renderer.initTexture(m[k]);
    });
    try {
      if (this.renderer.compileAsync) await this.renderer.compileAsync(this.scene, this.camera);
      else this.renderer.compile(this.scene, this.camera);
    } catch (e) { console.warn(e); }
    onProgress(0.8);
    // vẽ thử ở từng trạm (cả hậu kỳ) rồi trả lại như cũ
    const pos = this.camera.position.clone(), q = this.camera.quaternion.clone();
    for (let i = 0; i < this.count; i++) {
      const u = this.stationU(i);
      this.camera.position.copy(this.frameAt(u).p).add(new THREE.Vector3(0, 1.5, 0));
      this.camera.lookAt(this.curve.getPointAt(wrap(u + 0.018)).add(new THREE.Vector3(0, 0.4, 0)));
      this.composer.render();
      onProgress(0.8 + 0.18 * ((i + 1) / this.count));
      await new Promise((r) => requestAnimationFrame(r));
    }
    for (const o of hidden) o.visible = false;
    this.camera.position.copy(pos); this.camera.quaternion.copy(q);
    this.clock.getDelta();
    this.warm = true;
    onProgress(1);
  }

  /* ---------------- Cảnh quay một shot ---------------- */
  // 'in': sau màn chờ, máy quay vút lên rồi lao thẳng vào trang chính
  // 'home': từ chương cuối bay vọt lên không trung, lượn qua vòng hành trình rồi đáp về trang đầu
  startShot(kind) {
    this.shot = { kind, t: 0, dur: kind === 'in' ? 3.6 : 4.6, from: this.camera.position.clone(), fromQ: this.camera.quaternion.clone(), fromTarget: this.camera.position.clone().add(new THREE.Vector3(0, 0, -10).applyQuaternion(this.camera.quaternion)) };
    if (kind === 'home') {
      this.fx.burst(this.hero.root.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 40);
      this.shot.poof = false;
    }
  }

  shotBusy() { return !!this.shot && this.shot.t / this.shot.dur < 0.86; }

  /* ---------------- Hậu kỳ ---------------- */
  buildComposer() {
    const r = this.renderer;
    this.composer = new EffectComposer(r);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    // chặn điểm ảnh lỗi (NaN/Inf) trên một số GPU: nếu lọt vào bloom chúng loang thành mảng đen chớp tắt
    this.composer.addPass(new ShaderPass({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; varying vec2 vUv;
        void main(){
          vec4 c = texture2D(tDiffuse, vUv);
          bvec4 bad = bvec4(isnan(c.r) || isinf(c.r), isnan(c.g) || isinf(c.g), isnan(c.b) || isinf(c.b), isnan(c.a) || isinf(c.a));
          if (any(bad) || !(c.r + c.g + c.b < 1e4)) c = vec4(0.0, 0.0, 0.0, 1.0);
          gl_FragColor = vec4(clamp(c.rgb, 0.0, 48.0), clamp(c.a, 0.0, 1.0));
        }`,
    }));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), this.isMobile ? 0.5 : 0.7, 0.7, 0.72);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.finalPass = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uSpeed: { value: 0 }, uTime: this.uniforms.uTime },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; uniform float uSpeed; uniform float uTime; varying vec2 vUv;
        void main(){
          vec2 d = vUv - 0.5;
          float k = 0.0025 + uSpeed * 0.012;
          vec3 col;
          col.r = texture2D(tDiffuse, vUv + d * k).r;
          col.g = texture2D(tDiffuse, vUv).g;
          col.b = texture2D(tDiffuse, vUv - d * k).b;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.composer.addPass(this.finalPass);
  }

  resize() {
    this.isMobile = matchMedia('(max-width: 900px)').matches;
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.fov = this.camera.aspect < 0.9 ? 68 : 55;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    this.composer.setSize(innerWidth, innerHeight);
    this.layout();
  }

  /* ---------------- Tương tác ---------------- */
  pick(clientX, clientY) {
    const v = new THREE.Vector2((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(v, this.camera);
    const hit = this.raycaster.intersectObjects(this.clickables, false)[0];
    return hit ? hit.object : null;
  }

  hover(clientX, clientY) {
    const obj = this.pick(clientX, clientY);
    if (obj !== this.hovered) {
      this.hovered = obj;
      this.onHoverChange?.(!!obj);
    }
  }

  click(clientX, clientY) {
    const obj = this.pick(clientX, clientY);
    if (!obj) return false;
    const ud = obj.userData;
    ud.poke = 1;
    if (ud.station !== undefined) this.onHotspot?.(ud.station);
    else if (ud.kind === 'project') this.onProjectClick?.(ud.project);
    else if (ud.kind === 'hero') this.heroAct();
    else if (ud.kind === 'star') {
      this.fx.burst(this.heroStar.group.position, 36);
      this.hero.act('spin');
    } else if (ud.kind === 'name') {
      this.nameBurst = 1;
      this.fx.burst(new THREE.Vector3().setFromMatrixPosition(this.namePts.matrixWorld), 30);
    } else if (ud.kind === 'photo') this.onPhoto?.(this.cyclePhoto(1));
    else if (ud.kind === 'key') this.unlockKey();
    else if (ud.kind === 'prop') ud.spinBoost = 6;
    this.onPick?.(ud.kind, ud);
    return true;
  }

  // chạm nhân vật: lần lượt các màn diễn dễ thương, bắt đầu từ màn của chương hiện tại
  heroAct() {
    const list = ['wave', 'heart', 'peace', 'dance', 'cool', 'clap', 'spin', 'bow'];
    this.actCycle = (this.actCycle + 1) % list.length;
    let name = list[this.actCycle];
    if (name === this.hero.actName) name = list[(this.actCycle + 1) % list.length];
    this.hero.act(name);
    this.fx.burst(this.hero.root.position.clone().add(new THREE.Vector3(0, 2, 0)), 14);
  }

  unlockKey() {
    if (this.keyOpen > 0) return;
    this.keyOpen = 0.001;
    this.fx.burst(new THREE.Vector3().setFromMatrixPosition(this.keyObj.key.matrixWorld), 48);
    this.hero.act('heart');
    this.onKey?.();
  }

  /* ---------------- Vòng lặp ---------------- */
  update(progress, speed) {
    const rawDt = this.clock.getDelta();
    const dt = this.debugDt || Math.min(rawDt, 0.05);
    if (this.debugDt) this.clock.elapsedTime += this.debugDt - rawDt;
    const time = this.clock.elapsedTime;
    this.uniforms.uTime.value = time;
    if (this.shot) this.shot.t += dt;
    const shotK = this.shot ? Math.min(this.shot.t / this.shot.dur, 1) : 1;
    // intro: 0 ở màn chờ, chạy theo cú dolly in, = 1 khi đã vào
    this.intro = this.introTarget < 1 ? 0 : this.shot?.kind === 'in' ? ease(shotK) : 1;

    // màu theo chương (nội suy tròn)
    const f = wrap(progress) * this.count;
    const i0 = Math.floor(f) % this.count, i1 = (i0 + 1) % this.count;
    const k = THREE.MathUtils.smoothstep(f - Math.floor(f), 0.25, 0.75);
    ['uA', 'uB', 'uC'].forEach((key, j) => {
      const target = PALETTES[i0][j].clone().lerp(PALETTES[i1][j], k);
      this.uniforms[key].value.lerp(target, 1 - Math.exp(-3 * dt));
    });
    this.scene.fog.color.copy(this.uniforms.uA.value).multiplyScalar(1.2);

    // máy quay chạy theo đường
    const u = wrap(progress);
    const fr = this.frameAt(u);
    const ahead = this.curve.getPointAt(wrap(u + 0.018));
    const camPos = fr.p.clone().add(new THREE.Vector3(0, 1.5, 0));

    this.pointerSmooth.lerp(this.pointer, 1 - Math.exp(-3 * dt));
    this.look.x = damp(this.look.x, this.look.tx, 4, dt);
    this.look.y = damp(this.look.y, this.look.ty, 4, dt);
    this.camera.position.copy(camPos);
    const target = ahead.add(new THREE.Vector3(0, 0.4, 0));
    this.camera.lookAt(target);
    // nhìn quanh: kéo chuột + thị sai nhẹ
    this.camera.rotateY(-this.look.x - this.pointerSmooth.x * 0.06);
    this.camera.rotateX(this.look.y + this.pointerSmooth.y * 0.04);
    this.camera.rotateZ(-speed * 0.8 + Math.sin(time * 0.3) * 0.01);
    // phóng to / thu nhỏ: đẩy máy quay tới hoặc lùi lại theo hướng nhìn
    this.zoom.cur = damp(this.zoom.cur, this.zoom.target, 5, dt);
    this.camera.translateZ(-this.zoom.cur);
    const tourPos = this.camera.position.clone(), tourQ = this.camera.quaternion.clone();
    const tourTarget = tourPos.clone().add(new THREE.Vector3(0, 0, -12).applyQuaternion(tourQ));

    // nhân vật đi trước máy quay một đoạn
    const portrait = this.camera.aspect < 0.9;
    const curIdx = Math.round(wrap(progress) * this.count) % this.count;
    this.charSide = damp(this.charSide, portrait ? 1.1 : CHAR_SIDE[curIdx], 1.5, dt);
    const cf = this.frameAt(u + (portrait ? 14 : 12) / this.length);
    const flatT = cf.t.clone().setY(0).normalize();
    const flatS = new THREE.Vector3().crossVectors(flatT, new THREE.Vector3(0, 1, 0)).normalize();
    const hr = this.hero.root;
    hr.position.copy(cf.p).addScaledVector(flatS, this.charSide);
    hr.position.y = FLOOR;
    hr.lookAt(hr.position.clone().add(flatT));
    const walk = THREE.MathUtils.clamp((speed * this.length) / Math.max(dt, 1e-3), -24, 24);
    const idleAtHero = curIdx === 0 && this.intro > 0.9;
    // chặng đang đi: mỗi chặng một phương tiện riêng
    const tr = this.travel;
    const kind = tr && tr.active && this.intro > 0.9 && !this.shot ? LEG_VEHICLES[((tr.leg % this.count) + this.count) % this.count] : null;
    if (kind !== this.legKind) {
      if (kind || this.legKind) this.fx.burst(hr.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 16);
      this.legKind = kind;
    }
    const veh = kind ? this.vehicles[kind] : null;
    for (const v of Object.values(this.vehicles)) {
      v.pop = damp(v.pop, v === veh ? 1 : 0, v === veh ? 6 : 10, dt);
      v.g.visible = v.pop > 0.02;
      if (!v.g.visible) continue;
      const k = v.pop;
      v.g.scale.setScalar(k * (1 + Math.sin(k * Math.PI) * 0.18));
      v.g.rotation.y = this.hero.yaw;
      v.update(dt, Math.abs(walk) / 1.25);
    }
    this.hero.update(dt, time, this.intro > 0.5 ? walk : 0, {
      faceCamera: Math.PI * 0.82,
      wave: idleAtHero && this.hero.idleTime > 1.5 && Math.sin(time * 0.6) > 0.3 ? 1 : 0,
      look: this.pointerSmooth,
      ride: veh && veh.pop > 0.3 ? { pose: veh.pose, seat: veh.seat } : null,
    });
    if (curIdx !== this.lastIdx) {
      this.lastIdx = curIdx;
      this.fx.burst(hr.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
      this.actQueue = { name: CHAPTER_ACTS[curIdx % CHAPTER_ACTS.length], at: time + 1.2 };
    }
    // tới chương mới: đứng lại rồi diễn màn riêng của chương đó
    if (this.actQueue && time > this.actQueue.at && this.hero.moveAmt < 0.2 && this.intro > 0.9) {
      this.hero.act(this.actQueue.name);
      this.actQueue = null;
    }
    // ngôi sao sáng nhất (chính là Anh Tú) bay lượn trên đầu nhân vật
    const hs = this.heroStar;
    const sp = hs.hit.userData;
    sp.poke = Math.max(0, (sp.poke || 0) - dt * 1.5);
    const hov = this.hovered === hs.hit ? 1 : 0;
    hs.group.position.copy(hr.position).add(new THREE.Vector3(Math.cos(time * 0.7) * 1.2, 5.6 + Math.sin(time * 1.3) * 0.35, Math.sin(time * 0.7) * 1.2));
    hs.flare.scale.setScalar(3.2 + Math.sin(time * 3) * 0.4 + sp.poke * 4 + hov * 1.2);
    hs.flare.material.rotation = time * 0.3;
    hs.core.rotation.set(time, time * 1.3, 0);
    hs.label.material.opacity = damp(hs.label.material.opacity, hov || sp.poke > 0 || this.hero.idleTime > 4 ? 1 : 0, 4, dt);
    hs.group.visible = hr.visible;
    this.galaxy.group.rotation.y = time * 0.01;
    this.shooting.update(dt, this.camera);
    this.fx.update(dt, time, this.hero);
    this.fill.position.copy(this.camera.position).add(new THREE.Vector3(0, 6, 0));
    this.fill.target.position.copy(hr.position);

    this.threads.visible = this.intro > 0.55;

    // màn hình chờ: máy quay bay vòng quanh nhân vật, người xem kéo để xoay, cuộn để lại gần
    const focus = hr.position.clone().add(new THREE.Vector3(0, 2.2, 0));
    let fovKick = 0;
    if (this.introTarget < 1) {
      this.introSpin = damp(this.introSpin, 0, 2.5, dt);
      this.introAngle += dt * 0.16 + this.introSpin * dt;
      const back = this.introAngle + Math.PI * 0.35;
      const r = (5.4 + Math.sin(time * 0.3) * 0.8) * (portrait ? 1.65 : 1) * (1 - this.zoom.cur * 0.06);
      const pitch = 0.09 + this.introPitch + Math.sin(time * 0.25) * 0.06;
      this.camera.position.copy(focus).add(new THREE.Vector3(Math.sin(back) * r * Math.cos(pitch), Math.sin(pitch) * r, Math.cos(back) * r * Math.cos(pitch)));
      this.camera.lookAt(focus);
    } else if (this.shot) {
      const S = this.shot, t = shotK;
      if (S.kind === 'in') {
        // dolly in một mạch: vút lên cao sau lưng nhân vật rồi lao thẳng vào trang chính
        const e = ease(t);
        const away = S.from.clone().sub(focus).setY(0).normalize();
        const fwd = tourTarget.clone().sub(tourPos).setY(0).normalize();
        const c1 = S.from.clone().addScaledVector(away, 9).add(new THREE.Vector3(0, 14, 0));
        const c2 = tourPos.clone().addScaledVector(fwd, -30).add(new THREE.Vector3(0, 12, 0));
        this.camera.position.copy(bez(S.from, c1, c2, tourPos, e));
        this.camera.lookAt(focus.clone().lerp(tourTarget, THREE.MathUtils.smoothstep(t, 0.2, 0.85)));
        this.camera.quaternion.slerp(tourQ, THREE.MathUtils.smoothstep(t, 0.78, 1));
        fovKick = Math.sin(Math.PI * Math.min(t * 1.15, 1)) * 24;
      } else {
        // dolly out: bay vòng lên không trung theo vòng hành trình, nhìn xuống toàn cảnh rồi đáp về trang đầu
        const e = THREE.MathUtils.smootherstep(t, 0, 1);
        const a0 = Math.atan2(S.from.z, S.from.x), a1 = Math.atan2(tourPos.z, tourPos.x);
        let da = a1 - a0;
        while (da < 0) da += Math.PI * 2;
        const ang = a0 + da * e;
        const r0 = Math.hypot(S.from.x, S.from.z), r1 = Math.hypot(tourPos.x, tourPos.z);
        const lift = Math.pow(Math.sin(Math.PI * e), 0.8);
        const rad = THREE.MathUtils.lerp(r0, r1, e) * (1 + 0.35 * lift);
        const y = THREE.MathUtils.lerp(S.from.y, tourPos.y, e) + 52 * lift;
        this.camera.position.set(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
        // nhìn về cổng khởi đầu đang sáng ở phía trước, thấy vòng đèn, sàn gỗ và thiên hà phía trên
        const look = S.fromTarget.clone().lerp(tourTarget, THREE.MathUtils.smoothstep(t, 0.05, 0.6)).add(new THREE.Vector3(0, 6 * lift, 0));
        // bớt sương khi ở trên cao để thấy trọn vòng hành trình và thiên hà
        this.scene.fog.density = 0.012 * (1 - lift * 0.8);
        this.camera.lookAt(look);
        this.camera.quaternion.slerp(tourQ, THREE.MathUtils.smoothstep(t, 0.82, 1));
        fovKick = lift * 16;
        // nhân vật biến mất thành bụi sao lúc cất cánh, xuất hiện lại khi đáp xuống
        const show = t < 0.04 || t > 0.8;
        if (show && !hr.visible) this.fx.burst(hr.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 44);
        hr.visible = show;
      }
      if (t >= 1) { this.shot = null; hr.visible = true; this.scene.fog.density = 0.012; }
    }
    // cú "warp": mở rộng góc nhìn khi bay nhanh
    const baseFov = this.camera.aspect < 0.9 ? 68 : 55;
    const fov = baseFov + Math.min(Math.abs(speed) * 900, 18) + fovKick;
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = damp(this.camera.fov, fov, 6, dt);
      this.camera.updateProjectionMatrix();
    }

    // tên hạt sáng: tụ lại ở cổng khởi đầu, tan ra khi rời đi
    const dist = Math.min(u, 1 - u) * this.count;
    const form = THREE.MathUtils.smoothstep(0.75, 0.05, dist) * this.intro;
    const nu = this.namePts.material.uniforms;
    nu.uForm.value = damp(nu.uForm.value, form, 2.5, dt);
    this.nameBurst = Math.max(0, this.nameBurst - dt * 0.8);
    // đổi hiệu ứng chữ ngẫu nhiên khi tên đã hiện rõ ở trang chính
    const NF = this.nameFx;
    if (nu.uForm.value > 0.9 && !this.shot) {
      NF.t += dt;
      if (NF.t > 3.4 + NF.wait) {
        NF.t = 0; NF.wait = 5 + Math.random() * 4;
        NF.out = NF.in;
        let m; do { m = Math.floor(Math.random() * 6); } while (m === NF.in);
        NF.in = m;
      }
      if (NF.t < 0.7) { nu.uMode.value = NF.out; nu.uFx.value = 1 - NF.t / 0.7; }
      else { nu.uMode.value = NF.in; nu.uFx.value = Math.min((NF.t - 0.7) / 2.6, 1); }
    } else { nu.uFx.value = 1; NF.t = 3.4; NF.wait = 2.5; }
    nu.uBurst.value = Math.sin(this.nameBurst * Math.PI) * (this.nameBurst > 0 ? 1 : 0);
    if (nu.uForm.value > 0.01) {
      this.namePts.updateMatrixWorld();
      const v = new THREE.Vector2(this.pointer.x, this.pointer.y);
      this.raycaster.setFromCamera(v, this.camera);
      const n = new THREE.Vector3(0, 0, 1).transformDirection(this.namePts.matrixWorld);
      const o = new THREE.Vector3().setFromMatrixPosition(this.namePts.matrixWorld);
      const hit = this.raycaster.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(n, o), new THREE.Vector3());
      if (hit) nu.uMouse.value.lerp(this.namePts.worldToLocal(hit), 0.2);
    }

    // vật thể
    const { ring, ring2 } = this.portal;
    ring.rotation.z = time * 0.1;
    ring2.rotation.x = Math.sin(time * 0.3) * 0.2;
    ring2.rotation.y = Math.cos(time * 0.25) * 0.2;

    const n = this.photos.length;
    this.photos.forEach((ph) => {
      ph.cur = damp(ph.cur, ph.slot, 5, dt);
      const s = ph.cur;
      const m = ph.mesh;
      m.position.set(s * 1.5, Math.sin(time * 0.5 + s) * 0.15 - s * 0.2, -s * 1.1);
      m.rotation.z = s * 0.07 + Math.sin(time * 0.4 + s) * 0.02;
      m.rotation.y = -s * 0.12 + (s < 0.5 ? (ph.slot === 0 ? (s - ph.slot) * 2.2 * (this.photoFlip || 1) : 0) : 0);
      m.material.uniforms.uFocus.value = 1 - Math.min(s, 1) * 0.65;
      m.renderOrder = n - Math.round(s);
    });

    // rạp chiếu: tới showreel thì xung quanh tối dần, máy chiếu bật; hết phim hoặc rời đi thì sáng lại
    const d2 = Math.min(Math.abs(u - 2 / this.count), 1 - Math.abs(u - 2 / this.count)) * this.count;
    if (d2 > 1.2 && this.reelDone) { this.reelDone = false; if (this.reelVideo) this.reelVideo.currentTime = 0; }
    const cineOn = d2 < 0.35 && this.intro > 0.9 && (!this.reelDone || this.reelHtmlPlaying) && !!(this.reelVideo || this.reelHtmlPlaying);
    this.cine = damp(this.cine, cineOn ? 1 : 0, cineOn ? 1.3 : 2, dt);
    this.uniforms.uCine.value = this.cine;
    this.renderer.toneMappingExposure = 1.05 - this.cine * 0.32;
    this.screen.cone.material.uniforms.uOn.value = 0.1 + this.cine * 0.9;
    this.screen.lens.material.opacity = 0.2 + this.cine * 0.8;
    for (const r of this.projReels) r.rotation.x += dt * this.cine * 2;
    this.hero.key.intensity = 200 * (1 - this.cine * 0.55);

    this.projectFrames.forEach((m) => {
      const ud = m.userData;
      ud.hover = damp(ud.hover, this.hovered === m ? 1 : 0, 8, dt);
      m.position.copy(ud.base);
      m.position.y += Math.sin(time * 0.6 + ud.project) * 0.25;
      m.position.z += ud.hover * 1.2;
      ud.poke = Math.max(0, (ud.poke || 0) - dt * 2);
      m.scale.setScalar(1 + ud.hover * 0.08 + Math.sin(ud.poke * Math.PI) * 0.1);
      const a = ud.asset;
      a.t = (a.t || 0) + dt * (1 + ud.hover * 2.5);
      a.update(a.t, 1 + ud.hover * 1.5, dt * (1 + ud.hover * 2.5));
      a.g.position.y = ud.base.y + 3.6 + Math.sin(time * 0.6 + ud.project) * 0.25 + ud.hover * 0.6;
      a.g.scale.setScalar(0.95 + ud.hover * 0.25);
    });

    this.blobs.forEach((b) => {
      const d = b.userData;
      const a = d.a + time * d.sp;
      b.position.set(Math.cos(a) * d.r, d.y + Math.sin(time * 0.5 + d.a) * 0.6, Math.sin(a) * d.r);
      // chạm vào giọt màu: nảy "boing"
      d.poke = Math.max(0, (d.poke || 0) - dt * 1.4);
      const hov = this.hovered === b ? 0.15 : 0;
      const j = Math.sin(d.poke * 18) * d.poke * 0.35;
      b.scale.set(d.s * (1 + j + hov), d.s * (1 - j + hov), d.s * (1 + j + hov));
      b.position.y += Math.sin(d.poke * Math.PI) * 1.5;
    });

    this.clientRing.rotation.y = time * 0.12;
    this.clientSprites.forEach((sp) => {
      const a = sp.userData.a;
      sp.position.set(Math.cos(a) * 8, sp.userData.y, Math.sin(a) * 8);
      const facing = Math.sin(a + time * 0.12);
      sp.material.opacity = 0.25 + 0.75 * (0.5 + 0.5 * facing);
      const ud = sp.userData;
      ud.poke = Math.max(0, (ud.poke || 0) - dt * 1.5);
      const hv = this.hovered === sp ? 0.18 : 0;
      ud.h = damp(ud.h || 0, hv, 8, dt);
      sp.scale.set(7 * (1 + ud.h + Math.sin(ud.poke * Math.PI) * 0.3), 1.75 * (1 + ud.h + Math.sin(ud.poke * Math.PI) * 0.3), 1);
    });

    this.arches.forEach((g, i) => { g.children[0].rotation.z = Math.sin(time * 0.4 + i) * 0.02; });
    // chìa khóa: bay lên khi tới chương cuối, xoay toả sáng; mở khoá thì quay nhanh rồi rực sáng
    const K = this.keyObj;
    const nearEnd = Math.min(Math.abs(u - 7 / this.count), 1 - Math.abs(u - 7 / this.count)) * this.count;
    this.keyRise = damp(this.keyRise, nearEnd < 0.9 ? 1 : 0, 1.4, dt);
    if (this.keyOpen > 0) this.keyOpen = Math.min(1, this.keyOpen + dt * 0.8);
    const kh = this.hovered === K.hit ? 1 : 0;
    const rise = this.keyRise;
    K.key.position.y = -9 * (1 - rise) + Math.sin(time * 1.2) * 0.35;
    K.key.rotation.y += dt * (0.6 + kh * 1.5 + Math.sin(this.keyOpen * Math.PI) * 14);
    K.key.rotation.z = Math.sin(time * 0.7) * 0.12;
    K.halo.material.opacity = rise * (0.55 + 0.25 * Math.sin(time * 2.4) + kh * 0.3 + this.keyOpen * 0.4);
    K.halo.scale.setScalar(14 + this.keyOpen * 10 + kh * 3);
    K.halo.position.y = K.key.position.y + 1.8;
    K.rays.position.y = K.halo.position.y;
    K.rays.material.rotation = time * 0.15;
    K.rays.material.opacity = rise * (0.22 + this.keyOpen * 0.3);
    K.rays.scale.setScalar(20 + this.keyOpen * 16);
    K.gold.emissiveIntensity = 0.7 + 0.4 * Math.sin(time * 3) + this.keyOpen * 1.2 + kh * 0.6;

    // showreel phát trên màn chiếu khi ở gần chương 3
    if (this.reelVideo) {
      const want = d2 < 1.3 && this.intro > 0.9 && !this.reelPaused && !this.reelDone;
      if (want && this.reelVideo.paused) this.reelVideo.play().catch(() => {});
      if (!want && !this.reelVideo.paused) this.reelVideo.pause();
    }
    this.hotspots.forEach((h) => {
      const on = h.userData.station !== curIdx;
      const hov = this.hovered === h ? 1 : 0;
      h.material.opacity = damp(h.material.opacity, on ? 0.95 : 0, 4, dt);
      h.scale.setScalar((1.5 + Math.sin(time * 2.4 + h.userData.phase) * 0.15 + hov * 0.5) * (this.isMobile ? 1.3 : 1));
    });

    this.finalPass.uniforms.uSpeed.value = Math.min(Math.abs(speed) * 20, 1);
    this.adapt(rawDt);
    if (this.quality > 0) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  // Tự giảm chất lượng trên máy yếu để luôn mượt
  adapt(dt) {
    if (this.quality === undefined) { const q = new URLSearchParams(location.search).get('q'); this.quality = q ? +q : 2; this.frames = 0; this.acc = 0; }
    this.frames++;
    this.acc += dt;
    if (this.frames < 45 && this.acc < 1.2) return;
    const avg = this.acc / this.frames;
    this.frames = 0; this.acc = 0;
    // chỉ hạ chất lượng khi đã vào trang và chậm liên tục; không bao giờ tắt hậu kỳ (tránh nháy hình)
    this.slow = avg > 0.04 ? (this.slow || 0) + 1 : 0;
    if (this.slow >= 2 && this.quality > 1 && this.intro >= 1 && !this.shot) {
      this.slow = 0;
      this.quality--;
      const pr = this.quality === 1 ? 1 : 0.75;
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, pr));
      this.renderer.setSize(innerWidth, innerHeight);
      this.composer.setPixelRatio(Math.min(devicePixelRatio, pr));
      this.composer.setSize(innerWidth, innerHeight);
    }
  }
}
