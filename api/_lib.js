import crypto from 'node:crypto';

const TTL = 1000 * 60 * 60 * 12; // phiên đăng nhập 12 giờ

function secret() {
  const base = process.env.ADMIN_SECRET || `${process.env.ADMIN_PASSWORD}:${process.env.GITHUB_TOKEN}`;
  return crypto.createHash('sha256').update(base).digest();
}

export function sign() {
  const exp = String(Date.now() + TTL);
  const mac = crypto.createHmac('sha256', secret()).update(exp).digest('base64url');
  return `${exp}.${mac}`;
}

export function verify(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [exp, mac] = token.split('.');
  if (!exp || !mac || Number(exp) < Date.now()) return false;
  const good = crypto.createHmac('sha256', secret()).update(exp).digest('base64url');
  return good.length === mac.length && crypto.timingSafeEqual(Buffer.from(good), Buffer.from(mac));
}

export function checkPassword(pw) {
  const real = process.env.ADMIN_PASSWORD || '';
  if (!real || typeof pw !== 'string') return false;
  const a = crypto.createHash('sha256').update(pw).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

export function configured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

// Ghi một file vào kho GitHub; Vercel sẽ tự triển khai lại sau mỗi commit
export async function commitFile(path, base64, message) {
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const api = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'portfolio-admin',
  };
  let sha;
  const cur = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers });
  if (cur.ok) sha = (await cur.json()).sha;
  const res = await fetch(api, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: base64, branch, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

export function only(method, req, res) {
  if (req.method !== method) {
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return true;
}
