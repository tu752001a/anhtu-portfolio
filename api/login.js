import { checkPassword, configured, only, sign } from './_lib.js';

export default async function handler(req, res) {
  if (!only('POST', req, res)) return;
  if (!configured()) return res.status(500).json({ error: 'Chưa cấu hình biến môi trường ADMIN_PASSWORD, GITHUB_TOKEN, GITHUB_REPO trên Vercel.' });
  const ok = checkPassword(req.body?.password);
  // chậm lại một chút để hạn chế dò mật khẩu
  await new Promise((r) => setTimeout(r, ok ? 100 : 900));
  if (!ok) return res.status(401).json({ error: 'Sai mật khẩu.' });
  res.status(200).json({ token: sign() });
}
