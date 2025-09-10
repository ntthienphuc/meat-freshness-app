# 🥩 Thịt Tươi Rói – Fullstack App

Ứng dụng web giúp người dùng tìm hiểu và kiểm tra **độ tươi của thịt**. 
Bản này đã đóng gói **frontend + backend** để bạn chỉ cần tải về, giải nén và chạy.

## 📦 Cấu trúc thư mục

```
meat-freshness-app/
├── api/
│   └── routes/
│       └── analyze.js       # (placeholder) ví dụ cấu trúc routes khi mở rộng
├── public/
│   ├── index.html           # Giao diện chính (bản bạn đã cung cấp)
│   ├── style.css            # Styles (bản bạn đã cung cấp)
│   └── app.js               # Logic frontend (bản bạn đã cung cấp)
├── server.js                # Backend Express: phục vụ static & mock /api/analyze
├── package.json             # Scripts & dependencies
└── README.md
```

## ▶️ Cách chạy

Yêu cầu: **Node.js 18+**

```bash
cd meat-freshness-app
npm install
npm start
```

Mở trình duyệt: http://localhost:3000

## 🔌 API có sẵn

### `GET /api/health`
- Mục đích: kiểm tra backend hoạt động.
- Phản hồi: `{ ok: true, service: "meat-freshness-backend", version: "1.0.0" }`

### `POST /api/analyze`
- Thân JSON:
  ```json
  { "imageBase64": "<tùy chọn>", "meatType": "pork|beef|chicken" }
  ```
- Trả về điểm số *mock* (không cần khóa AI) và gợi ý bảo quản.
- Mục đích: giúp bạn dễ tích hợp UI khi muốn gọi backend.
  Bạn có thể chỉnh để gọi mô hình thật trong tương lai.

> ⚠️ Lưu ý: Frontend hiện hoạt động **offline** nhờ JS thuần của bạn. 
> Backend chủ yếu phục vụ file tĩnh và cung cấp `/api/analyze` dạng mô phỏng.
> Nếu muốn, bạn có thể sửa `app.js` để gọi endpoint này và hiển thị kết quả.

## 🛡️ Sản xuất & bảo mật
- Đã bật `helmet`, `compression`, `cors` sẵn sàng cho deployment.
- Với hosting tĩnh, bạn vẫn có thể dùng server này để phục vụ site.

## 🧩 Tùy biến thêm
- Thêm upload ảnh thật (multer) và xử lý ảnh.
- Kết nối cơ sở dữ liệu để lưu blog, lịch sử phân tích.
- Tách routes vào `api/routes` khi logic phức tạp hơn.

Chúc bạn triển khai thuận lợi! 🚀


## ⚙️ Cấu hình môi trường
Tạo file `.env` (tham khảo `.env.example`):
```
PORT=3000
CORS_ORIGIN=*
NODE_ENV=development
TRUST_PROXY=false
```

## 🧪 Kiểm thử nhanh API
```bash
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"meatType":"beef","imageBase64":""}'
```

## 🐳 Chạy bằng Docker (tuỳ chọn)
```bash
docker build -t meat-freshness-app .
docker run --rm -p 3000:3000 --env-file .env meat-freshness-app
```

## 🔒 Ghi chú bảo mật & hiệu năng
- `helmet` cấu hình CSP an toàn mặc định; HTML không bị cache, tài nguyên tĩnh cache 7 ngày ở production.
- `express-rate-limit` throttling cho `/api/*` (120 req/phút/IP).
- `morgan` log chuẩn để theo dõi truy cập.
- `cors` cho phép cấu hình nguồn qua biến môi trường `CORS_ORIGIN`.
- `compression` gzip/brotli để tối ưu băng thông.

## 🛠 Gợi ý cải tiến tiếp theo
- Tích hợp AI thật (HTTP đến model server), thêm hàng đợi và retry.
- Thêm upload ảnh file (multer) + validate kích thước/định dạng.
- Persist dữ liệu (SQLite/Postgres) để lưu blog, lịch sử phân tích.
- Thêm test (Vitest) và CI.
