# CareDose — HTML/CSS version

Bạn yêu cầu chuyển bundle (React/Tailwind từ Figma) sang **HTML + CSS thuần**.

## Cấu trúc
- `index.html` : Landing page
- `styles.css` : Toàn bộ style chung
- `script.js` : Mobile menu + FAQ + demo form + QR mock
- `analytics.html` : Trang dashboard traffic (demo UI)
- `analytics.js` : Logic demo dữ liệu + vẽ chart SVG

## Chạy local
Cách nhanh nhất:
- Mở trực tiếp `index.html` bằng trình duyệt

Nếu muốn chạy kiểu server (để tránh lỗi CORS khi sau này bạn fetch API):
- Dùng VSCode Live Server hoặc
- `npx serve` (NodeJS) rồi mở URL do serve cung cấp

## Thay link Fanpage/TikTok
Sửa trong `index.html` phần "Theo dõi CareDose".

## Thay QR thật
Bạn có thể:
- Export QR PNG/SVG từ link form (Google Form, Typeform, v.v.)
- Thay phần QR mock (`<div class="qr-grid">...`) bằng `<img src="assets/qr.png" ...>`

## Analytics (không cần DB phía bạn)
Bạn có thể dùng:
- Plausible / Umami / GoatCounter (hosted)
- Cloudflare Web Analytics (nếu host trên Cloudflare)

Sau đó: thay dữ liệu trong `analytics.js` bằng API thật.
