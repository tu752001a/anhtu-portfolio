# Website Phương Anh Tú · PAT — Hướng dẫn

Web đang chạy: https://phuonganhtu-pat.vercel.app
Mã nguồn: GitHub `tu752001a/anhtu-portfolio`, nhánh `pat-3d-site` (nhánh `main` cũ không bị đụng tới).
Vercel project: `phuonganhtu-pat`.

## Thư mục gồm
- `index.html`: giao diện (không cần sửa)
- `app.js`: hiệu ứng 3D, chibi, ban nhạc, âm thanh, chuyển cảnh (không cần sửa)
- `content.js`: **TẤT CẢ NỘI DUNG**, gồm tiểu sử, thông điệp, 12 track, EP 075, nhạc quảng cáo, liên hệ, mạng xã hội, lời cảm ơn
- `audio/`: 12 bài (MP3), nhạc nền `pat-bg.mp3`, và `peaks.js` (dạng sóng của từng bài)
- `video/`: video quảng cáo `livotec.mp4`, `bcons.mp4` và ảnh bìa `.jpg`
- `photos/`: ảnh của bạn

## Vì sao chỉ bạn sửa được?
Web là trang tĩnh. Muốn đổi nội dung phải sửa `content.js` trong GitHub của bạn rồi đăng lại trên Vercel.

## Để mỗi lần sửa là web tự cập nhật (làm 1 lần)
Vercel → project `phuonganhtu-pat` → Settings → Git (Environments → Production) → đổi **Production Branch** từ `main` sang `pat-3d-site`.
Từ đó mỗi commit lên nhánh `pat-3d-site` sẽ tự lên link chính sau khoảng 1 phút.

## Sửa nhanh trên GitHub
1. Mở https://github.com/tu752001a/anhtu-portfolio/blob/pat-3d-site/content.js
2. Bấm biểu tượng bút chì, sửa, rồi **Commit changes**.

## Thông điệp chính
`artist.mission` là câu "Chỉ cần bản thân muốn, mọi thứ đều có thể thực hiện…". Câu này hiện ở phần mở đầu và chương cuối.

## Track: single và EP
- Track **không có** `ep` là single. Chỉ single nằm trong chòm sao, mở khoá theo thứ tự ngày phát hành.
- Track **có** `ep: "EP 075"` thuộc EP, chỉ mở sau khi người xem mở hết single và nhận hộp quà (chibi nhảy hiphop 30 giây rồi dẫn thẳng tới EP 075).
- Mỗi track gồm: `title`, `artists`, `date` (dd/mm/yyyy), `genre`, `audio`, `smartLink` (nút đỏ, trước Spotify), `spotify`, `dur`, `story` (câu chuyện bài hát), `journey` (tiến trình ra đời).
- Đã bỏ ISRC, UPC và tông bài theo yêu cầu.

## Nhạc quảng cáo
Trong `ads: [ ... ]`, mỗi video gồm `brand`, `title`, `kind`, `shape` (`"wide"` cho video ngang, `"tall"` cho video dọc TikTok), `video`, `poster`, `credits`, `story`. Thêm video mới: tải file `.mp4` vào `video/` rồi chép một khối có sẵn.

## Nhạc nền
`bgMusic.quietSeconds: 20`. Khi bất kỳ bài hát, video hay ban nhạc nào phát, nhạc nền tự giảm dần rồi tắt, và chỉ bật lại sau 20 giây không còn âm thanh. Tiếng click nhỏ của giao diện không làm tắt nhạc nền.

## Liên hệ
Phần liên hệ riêng nằm ngay dưới các nền tảng mạng xã hội: `contact.email`, `contact.phone`, `contact.zalo`. Bấm email mở trình gửi thư, bấm số điện thoại để gọi, nút Zalo mở chat. Chương cuối có nút "Gửi lời nhắn cho PAT" dẫn thẳng tới Zalo; lời mời nằm ở `messageInvite`.

## Tủ đồ & cảm xúc
Người xem bấm "Tủ đồ & cảm xúc" để thay 40 món (30 phụ kiện và 10 bạn đồng hành) và 8 biểu cảm cho chibi. Nút "Đeo kính vàng" bật/tắt kính. Lựa chọn được nhớ trên trình duyệt của họ.

## Đã bỏ
Số stream và bảng số liệu đã bỏ, thay bằng ban nhạc 3D chơi được (bấm pad hoặc phím A S D F G H J K L ; ').
