// Lượt xem thời gian thực của video dự án (YouTube, TikTok).
// GET /api/views?u=url1|url2 → { views: { [url]: number | null } }
// Có YOUTUBE_API_KEY thì dùng YouTube Data API, không thì đọc số lượt xem từ trang video.
// Kết quả được cache ở CDN 60 giây để vừa "thời gian thực" vừa không bị nền tảng chặn.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const memo = new Map(); // cache trong lúc hàm còn "ấm"

async function get(url) {
  const r = await fetch(url, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9', cookie: 'CONSENT=YES+1; SOCS=CAI' },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

async function youtube(id) {
  const key = process.env.YOUTUBE_API_KEY;
  if (key) {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${id}&key=${key}`, { signal: AbortSignal.timeout(8000) });
    const j = await r.json();
    const n = Number(j.items?.[0]?.statistics?.viewCount);
    if (Number.isFinite(n)) return n;
  }
  const html = await get(`https://www.youtube.com/watch?v=${id}&hl=en`);
  const m = html.match(/"viewCount"\s*:\s*"(\d+)"/) || html.match(/"viewCount"\s*:\s*\{"simpleText"\s*:\s*"([\d,.]+)/);
  return m ? Number(m[1].replace(/[^\d]/g, '')) : null;
}

async function tiktok(url, id) {
  const html = await get(url);
  // số lượt xem nằm trong khối dữ liệu của đúng video này
  const at = html.indexOf(`"id":"${id}"`);
  const scope = at >= 0 ? html.slice(at, at + 20000) : html;
  const m = scope.match(/"playCount"\s*:\s*"?(\d+)"?/) || html.match(/"playCount"\s*:\s*"?(\d+)"?/);
  return m ? Number(m[1]) : null;
}

async function viewsOf(url) {
  const hit = memo.get(url);
  if (hit && Date.now() - hit.t < 60000) return hit.n;
  let n = null;
  try {
    let m;
    if ((m = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/))) n = await youtube(m[1]);
    else if ((m = url.match(/^https:\/\/(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/))) n = await tiktok(m[0], m[1]);
  } catch (e) {
    console.warn('views', url, e.message);
  }
  if (n === null && hit) n = hit.n; // giữ số cũ nếu lần này bị chặn
  memo.set(url, { n, t: Date.now() });
  return n;
}

export default async function handler(req, res) {
  const raw = String(req.query?.u || '');
  const urls = [...new Set(raw.split('|').map((s) => s.trim()).filter((s) => /^https:\/\/(www\.)?(youtube\.com|youtu\.be|tiktok\.com)\//.test(s)))].slice(0, 12);
  const out = {};
  await Promise.all(urls.map(async (u) => { out[u] = await viewsOf(u); }));
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).json({ views: out, at: Date.now() });
}
