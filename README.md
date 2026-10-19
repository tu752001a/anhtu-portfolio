# Portfolio 3D — Trần Thanh Anh Tú

Website portfolio dạng không gian 3D: màn hình chờ, bay qua 8 chương (Mở đầu → Về tôi → Showreel → Dự án → Kỹ năng → Khách hàng → Quy trình → Kết nối) trên một đường khép kín, chương cuối dẫn về lại cổng khởi đầu.

- Nội dung nằm trong một file duy nhất: `public/content.json`.
- Trang quản trị `/admin` chỉ mở được bằng mật khẩu của bạn. Bấm **Lưu & xuất bản** thì nội dung được ghi vào GitHub và Vercel tự cập nhật trang sau khoảng 1 phút. Người xem chỉ đọc được, không sửa được gì.

## Đưa lên mạng (Vercel)

1. Tạo một repository trống trên GitHub (ví dụ `anhtu-portfolio-3d`) và tải toàn bộ thư mục này lên (trừ `node_modules`, `dist`).
2. Tạo GitHub token: GitHub → Settings → Developer settings → Fine-grained tokens → Generate. Chỉ chọn repository vừa tạo, quyền **Contents: Read and write**.
3. Vào vercel.com → Add New → Project → chọn repository đó. Vercel tự nhận Vite.
4. Trước khi bấm Deploy, thêm Environment Variables:
   - `ADMIN_PASSWORD` — mật khẩu đăng nhập trang quản trị (đặt dài, khó đoán)
   - `GITHUB_TOKEN` — token ở bước 2
   - `GITHUB_REPO` — `tên-github/tên-repo`, ví dụ `tu752001a/anhtu-portfolio`
   - `GITHUB_BRANCH` — (tuỳ chọn) mặc định `main`
5. Deploy. Trang quản trị ở `https://<tên-miền>/admin`.

## Sửa nội dung

- Vào `/admin`, đăng nhập, sửa theo từng mục ở cột trái, bấm **Lưu & xuất bản**.
- Link video: dán link YouTube, TikTok, Vimeo, Google Drive hoặc .mp4; trang tự chuyển thành video nhúng.
- Ảnh: bấm **Tải ảnh** cạnh ô ảnh, ảnh được nén và lưu vào `public/uploads/`.
- Nút **Tải JSON** để sao lưu nội dung về máy.

## Chạy thử trên máy

```bash
npm install
npm run dev
```

Trang quản trị cần các API của Vercel nên chỉ đăng nhập được sau khi triển khai (hoặc chạy `vercel dev`).

Thêm `?q=0` vào cuối địa chỉ để xem bản nhẹ (tắt hiệu ứng phát sáng). Trên máy yếu trang tự giảm chất lượng để giữ mượt.

Lệnh `npx vite build -c vite.preview.config.js` tạo bản một file để xem thử.
