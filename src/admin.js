import './admin.css';

const LABELS = {
  site: 'Thông tin trang', intro: 'Màn hình chờ', hero: 'Mở đầu', about: 'Về tôi', showreel: 'Showreel',
  projects: 'Dự án', skills: 'Kỹ năng', clients: 'Khách hàng', process: 'Quy trình', contact: 'Kết nối', footer: 'Chân trang',
  title: 'Tiêu đề', brand: 'Logo chữ', description: 'Mô tả', greeting: 'Lời chào', enterLabel: 'Chữ trên nút vào', hint: 'Dòng gợi ý',
  eyebrow: 'Dòng nhỏ phía trên', name: 'Tên', taglines: 'Khẩu hiệu', heading: 'Tiêu đề chương', subheading: 'Tiêu đề phụ',
  lead: 'Câu dẫn (chữ lớn)', paragraphs: 'Các đoạn văn', facts: 'Thông tin nhanh', label: 'Nhãn', value: 'Giá trị',
  photos: 'Ảnh chân dung', note: 'Ghi chú khi chưa có video', video: 'Link video', items: 'Danh sách', type: 'Thể loại',
  client: 'Khách hàng', date: 'Ngày', groups: 'Nhóm', services: 'Dịch vụ', steps: 'Các bước', text: 'Nội dung',
  email: 'Email', phone: 'Số điện thoại', socials: 'Mạng xã hội', url: 'Đường dẫn', loopLabel: 'Chữ nút quay về đầu',
  motto: 'Phương châm', copyright: 'Bản quyền',
};
const LONG = new Set(['description', 'intro', 'text', 'lead', 'paragraphs']);
const IMAGE = new Set(['photos', 'image', 'photo', 'thumbnail']);
const HELP = {
  video: 'Dán link YouTube, TikTok, Vimeo, Google Drive hoặc file .mp4. Trang sẽ tự chuyển thành video nhúng.',
  photos: 'Ảnh đầu tiên nằm trước. Bấm "Tải ảnh" để thay ảnh từ máy.',
};
const label = (k) => LABELS[k] ?? k;

const $ = (s) => document.querySelector(s);
let token = sessionStorage.getItem('admin-token') || '';
let data = null;
let tab = 'hero';
let dirty = false;

function toast(msg, err = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' err' : '');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.className = 'toast'), err ? 6000 : 3200);
}

function setDirty(v) {
  dirty = v;
  const s = $('#state');
  s.textContent = v ? '● Có thay đổi chưa lưu' : 'Đã đồng bộ';
  s.classList.toggle('dirty', v);
}

async function api(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  let json = {};
  try { json = await res.json(); } catch { /* trang tĩnh khi chạy local */ }
  if (res.status === 401 && path !== '/api/login') { logout(); }
  if (!res.ok) throw new Error(json.error || (res.status === 404 ? 'Không tìm thấy API (chỉ chạy khi đã triển khai lên Vercel).' : `Lỗi ${res.status}`));
  return json;
}

/* ---------------- Đăng nhập ---------------- */
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  $('#loginMsg').textContent = '';
  try {
    const { token: t } = await api('/api/login', { password: $('#password').value });
    token = t;
    sessionStorage.setItem('admin-token', t);
    await start();
  } catch (err) {
    $('#loginMsg').textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

function logout() {
  token = '';
  sessionStorage.removeItem('admin-token');
  $('#app').hidden = true;
  $('#login').hidden = false;
}
$('#logoutBtn').addEventListener('click', logout);

/* ---------------- Trình chỉnh sửa ---------------- */
async function start() {
  data = await fetch('/content.json', { cache: 'no-store' }).then((r) => r.json());
  $('#login').hidden = true;
  $('#app').hidden = false;
  setDirty(false);
  renderTabs();
  render();
}

function renderTabs() {
  $('#tabs').innerHTML = '';
  for (const k of Object.keys(data)) {
    const b = document.createElement('button');
    b.textContent = label(k);
    b.className = k === tab ? 'active' : '';
    b.onclick = () => { tab = k; renderTabs(); render(); };
    $('#tabs').append(b);
  }
}

function render() {
  const root = $('#editor');
  root.innerHTML = '';
  root.append(node(data, tab, label(tab), tab));
}

function blank(v) {
  if (Array.isArray(v)) return [];
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  return typeof v === 'string' ? '' : v;
}

function el(tag, props = {}, ...kids) {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids.filter(Boolean));
  return e;
}

// Tạo ô nhập cho mọi kiểu dữ liệu: chữ, danh sách, nhóm
function node(parent, key, title, ctxKey) {
  const v = parent[key];
  if (Array.isArray(v)) {
    const box = el('div', { className: 'group' });
    const add = el('button', { className: 'ghost', textContent: '+ Thêm' });
    add.onclick = () => {
      const tpl = v.length ? blank(v[v.length - 1]) : '';
      v.push(tpl);
      setDirty(true);
      render();
    };
    box.append(el('div', { className: 'head' }, el('b', { textContent: title }), add));
    if (HELP[ctxKey]) box.append(el('p', { className: 'help', textContent: HELP[ctxKey], style: 'margin:-6px 0 12px' }));
    v.forEach((_, i) => {
      const item = el('div', { className: 'item' });
      const bar = el('div', { className: 'item-bar' }, el('span', { textContent: String(i + 1).padStart(2, '0') }));
      const mk = (txt, fn, dis) => { const b = el('button', { className: 'ghost', textContent: txt, disabled: dis }); b.onclick = fn; return b; };
      bar.append(
        mk('↑', () => { [v[i - 1], v[i]] = [v[i], v[i - 1]]; setDirty(true); render(); }, i === 0),
        mk('↓', () => { [v[i + 1], v[i]] = [v[i], v[i + 1]]; setDirty(true); render(); }, i === v.length - 1),
        mk('Xoá', () => { if (confirm('Xoá mục này?')) { v.splice(i, 1); setDirty(true); render(); } }),
      );
      item.append(bar, typeof v[i] === 'object' && v[i] !== null ? objectFields(v[i], key) : leaf(v, i, '', key));
      box.append(item);
    });
    return box;
  }
  if (v && typeof v === 'object') {
    const box = el('div', { className: 'group' }, el('div', { className: 'head' }, el('b', { textContent: title })));
    box.append(objectFields(v, key));
    return box;
  }
  return leaf(parent, key, title, ctxKey);
}

function objectFields(obj, ctx) {
  const frag = el('div');
  for (const k of Object.keys(obj)) frag.append(node(obj, k, label(k), k === 'items' ? ctx : k));
  return frag;
}

function leaf(parent, key, title, ctxKey) {
  const val = parent[key];
  const wrap = el('div', { className: 'field' });
  if (title) wrap.append(el('label', { textContent: title }));
  if (typeof val === 'boolean') {
    const c = el('input', { type: 'checkbox', checked: val });
    c.onchange = () => { parent[key] = c.checked; setDirty(true); };
    wrap.append(c);
    return wrap;
  }
  const long = LONG.has(key) || LONG.has(ctxKey) || String(val ?? '').length > 90;
  const input = el(long ? 'textarea' : 'input', { value: val ?? '' });
  input.oninput = () => { parent[key] = typeof val === 'number' ? Number(input.value) : input.value; setDirty(true); };
  if (IMAGE.has(key) || IMAGE.has(ctxKey)) {
    const img = el('img', { className: 'thumb', src: val || '', alt: '' });
    const up = el('button', { className: 'ghost', textContent: 'Tải ảnh' });
    up.onclick = () => pickImage(async (file, preview) => {
      img.src = preview;
      up.disabled = true;
      try {
        const { path } = await api('/api/upload', { name: file.name.replace(/\.[^.]+$/, ''), type: file.type, data: preview.split(',')[1] });
        parent[key] = path;
        input.value = path;
        setDirty(true);
        toast('Đã tải ảnh lên. Bấm "Lưu & xuất bản" để áp dụng.');
      } catch (e) { toast(e.message, true); } finally { up.disabled = false; }
    });
    input.addEventListener('input', () => (img.src = input.value));
    wrap.append(el('div', { className: 'row' }, input, img, up));
  } else wrap.append(input);
  if (HELP[key] && title) wrap.append(el('p', { className: 'help', textContent: HELP[key] }));
  return wrap;
}

// Chọn ảnh, thu nhỏ còn tối đa 1800px để tải nhanh
function pickImage(cb) {
  const f = el('input', { type: 'file', accept: 'image/*' });
  f.onchange = () => {
    const file = f.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 1800 / Math.max(img.width, img.height));
      const c = el('canvas', { width: Math.round(img.width * s), height: Math.round(img.height * s) });
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const out = c.toDataURL('image/jpeg', 0.86);
      URL.revokeObjectURL(img.src);
      cb({ name: file.name, type: 'image/jpeg' }, out);
    };
    img.src = URL.createObjectURL(file);
  };
  f.click();
}

$('#saveBtn').addEventListener('click', async (e) => {
  const b = e.currentTarget;
  b.disabled = true;
  b.textContent = 'Đang lưu…';
  try {
    await api('/api/save', { content: data });
    setDirty(false);
    toast('Đã lưu! Trang sẽ cập nhật sau khoảng 1 phút.');
  } catch (err) {
    toast(err.message, true);
  } finally {
    b.disabled = false;
    b.textContent = 'Lưu & xuất bản';
  }
});

$('#downloadBtn').addEventListener('click', () => {
  const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })), download: 'content.json' });
  a.click();
});

addEventListener('beforeunload', (e) => { if (dirty) e.preventDefault(); });

if (token) start();
