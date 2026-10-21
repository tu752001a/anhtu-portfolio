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

## Hành trình 14 chặng
Khởi hành → Chân dung → 5 chặng Track (mỗi single một chặng) → Quà tặng (breakdance) → EP 075 → Music Video → On Air 01, On Air 02 (mỗi quảng cáo một chặng) → Phòng thu → Ngôi sao. Thêm single hay quảng cáo vào `content.js` thì web tự thêm chặng mới. Cuối mỗi chặng có một dòng gợi ý bí mật về chặng sau; bản đồ góc phải chỉ hiện "?" cho những chặng người xem chưa tới.

## Chibi
Chibi 3D dựng theo hình mẫu 2D bạn gửi (áo dạ đen cúc vàng, cổ tay lông, tóc rẽ ngôi, khuyên tai), không có má hồng. Chương Chân dung có thẻ "Chibi PAT" gồm hình mẫu 2D và bảng nhiều góc nhìn (`photos/pat-chibi.png`, `photos/pat-chibi-angles.jpg`).

## Track: single và EP
- Track **không có** `ep` là single. Mỗi single là một chặng riêng; ngôi sao của nó sáng lên khi người xem tới chặng đó, theo thứ tự phát hành.
- Track **có** `ep: "EP 075"` thuộc EP, chỉ mở sau khi người xem đi đủ 5 ngôi sao và mở hộp quà ở chặng Quà tặng (chibi breakdance 30 giây: Windmill, Headspin, 1990, Airflare, Halo, Freeze, rồi dẫn tới EP 075).
- Mỗi track gồm: `title`, `artists`, `producer` (Music Producer), `date` (dd/mm/yyyy), `genre`, `audio`, `highlight`, `smartLink` (nút nghe duy nhất, dẫn tới mọi nền tảng), `dur`, `story` (câu chuyện bài hát, viết như người kể chuyện), `journey` (tiến trình ra đời).
- **Highlight**: `highlight: [giây bắt đầu, giây kết thúc]`, ví dụ `[83, 123]`. Web chỉ phát đoạn này (30–45 giây) rồi nhắc người nghe bấm smart link để nghe trọn bài. Mình đã tự chọn đoạn sôi động nhất mỗi bài, bạn đổi số tuỳ ý.
- **Music Producer**: Karrot cho mọi single, souL cho toàn bộ EP 075. Câu chuyện của souL nằm ở `producerStory` trong khối EP.
- Track và EP chỉ hiện smart link, không hiện nút Spotify hay Apple Music riêng.
- Đã bỏ ISRC, UPC và tông bài theo yêu cầu.

## Music Video
`musicVideos.featured` là MV được ghim (Đừng Như Thế, MV animation), hiện lớn nhất và nổi lơ lửng trong không gian 3D. `musicVideos.list` là 5 MV theo đúng thứ tự: Thức Tỉnh, Không Màu, Em Đau, Full EP 075, Sau Lớp Mặt Nạ (Phonk Version). Mỗi MV cần `youtubeId` (đoạn mã sau `youtu.be/`). Bấm "Xem trên kênh YouTube" sẽ hiện lời tri ân (`musicVideos.thanks`) kèm nút đăng ký kênh trước khi mở video.

## Chân dung
`photos` là danh sách ảnh trong thư mục `photos/`, hiện thành card nghệ sĩ bo góc.

## Chuyển cảnh
Mỗi chương có một kiểu chuyển cảnh riêng: dolly in/out, vẩy mực, glitch, xé giấy, match cut (vào Music Video), glitch đỏ đen (rời Music Video), whip pan.

## Nhạc quảng cáo
Mỗi quảng cáo là một chặng "On Air": khung phát sóng có đèn ON AIR, timecode chạy theo video, 4 khung hình kèm chú thích (bấm để tua tới đoạn đó) và bảng mô tả. Trong `ads: [ ... ]`, mỗi video gồm `stills` (ảnh khung hình, `t` là giây, `cap` là chú thích), `brand`, `title`, `kind`, `shape` (`"wide"` cho video ngang, `"tall"` cho video dọc TikTok), `video`, `poster`, `credits`, `story`. Thêm video mới: tải file `.mp4` vào `video/` rồi chép một khối có sẵn.

## Nhạc nền
`bgMusic.quietSeconds: 20`. Khi bất kỳ bài hát, video hay ban nhạc nào phát, nhạc nền tự giảm dần rồi tắt, và chỉ bật lại sau 20 giây không còn âm thanh. Tiếng click nhỏ của giao diện không làm tắt nhạc nền.

## Theo dõi nhanh
`follow` trong `content.js` tạo các nút ở chương Phòng thu: Đăng ký kênh YouTube (mở sẵn hộp xác nhận đăng ký), Theo dõi TikTok, Facebook, Instagram. Các nền tảng không cho trang web tự bấm theo dõi thay người xem, nên mỗi nút mở đúng trang để họ bấm một lần.

## Liên hệ
Phần liên hệ nằm ở cuối cùng hành trình (chương Ngôi sao): `contact.email`, `contact.phone`, `contact.zalo`. Euphoria Media Vietnam chỉ hiện một dòng nhỏ "Đơn vị phân phối" ở dưới cùng, tách khỏi phần liên hệ. Bấm email mở trình gửi thư, bấm số điện thoại để gọi, nút Zalo mở chat. Chương cuối có nút "Gửi lời nhắn cho PAT" dẫn thẳng tới Zalo; lời mời nằm ở `messageInvite`.

## Chương cuối
Chibi ôm guitar thùng, lần lượt tạo 7 dáng biểu diễn kiểu idol để tri ân người nghe.

## Tủ đồ & cảm xúc
Người xem bấm "Tủ đồ & cảm xúc" để thay 40 món (30 phụ kiện và 10 bạn đồng hành) và 8 biểu cảm cho chibi. Nút "Đeo kính vàng" bật/tắt kính. Lựa chọn được nhớ trên trình duyệt của họ.

## Đã bỏ
Số stream và bảng số liệu đã bỏ, thay bằng ban nhạc 3D chơi được (bấm pad hoặc phím A S D F G H J K L ; ').
