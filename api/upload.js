import { commitFile, only, verify } from './_lib.js';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

export default async function handler(req, res) {
  if (!only('POST', req, res)) return;
  if (!verify(req)) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.' });
  const { name = 'image', type, data } = req.body || {};
  const ext = TYPES[type];
  if (!ext || typeof data !== 'string') return res.status(400).json({ error: 'Chỉ nhận ảnh JPG, PNG, WEBP, GIF.' });
  const slug = String(name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image';
  const file = `uploads/${Date.now()}-${slug}.${ext}`;
  try {
    await commitFile(`public/${file}`, data, `Tải ảnh ${file}`);
    res.status(200).json({ path: `/${file}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
