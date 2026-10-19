// Đổi link video thường (YouTube, TikTok, Vimeo, Google Drive, mp4) thành link nhúng
export function toEmbed(url) {
  if (!url) return null;
  const u = String(url).trim();
  let m;
  if ((m = u.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/))) {
    return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0`, vertical: /shorts\//.test(u) };
  }
  if ((m = u.match(/tiktok\.com\/(?:.*\/video\/|player\/v1\/|embed\/v2\/)(\d+)/))) {
    return { kind: 'iframe', src: `https://www.tiktok.com/player/v1/${m[1]}?autoplay=1&controls=1&description=1`, vertical: true };
  }
  if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/))) {
    return { kind: 'iframe', src: `https://player.vimeo.com/video/${m[1]}?autoplay=1`, vertical: false };
  }
  if ((m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/))) {
    return { kind: 'iframe', src: `https://drive.google.com/file/d/${m[1]}/preview`, vertical: false };
  }
  if (/\.(mp4|webm|mov)(\?|$)/i.test(u)) return { kind: 'video', src: u, vertical: false };
  return { kind: 'iframe', src: u, vertical: false };
}
