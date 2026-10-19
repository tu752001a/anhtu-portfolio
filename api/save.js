import { commitFile, only, verify } from './_lib.js';

export default async function handler(req, res) {
  if (!only('POST', req, res)) return;
  if (!verify(req)) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.' });
  const content = req.body?.content;
  if (!content || typeof content !== 'object' || !content.hero) return res.status(400).json({ error: 'Dữ liệu không hợp lệ.' });
  try {
    const json = JSON.stringify(content, null, 2) + '\n';
    await commitFile('public/content.json', Buffer.from(json).toString('base64'), 'Cập nhật nội dung portfolio');
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
