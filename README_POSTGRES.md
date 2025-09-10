# Blog với Vercel Postgres + Admin

## Biến môi trường cần có (Vercel → Project → Settings → Environment Variables)
- `POSTGRES_URL` – tự tạo khi bạn add integration **Vercel Postgres**.
- `ADMIN_TOKEN` – chuỗi bí mật để viết/sửa/xoá bài (client admin gửi qua header `x-admin-token`).

## Seed dữ liệu mẫu
Sau khi deploy và set ENV, gọi (chỉ một lần) với token của bạn:
```bash
curl -X POST https://<your-app>.vercel.app/api/seed -H "x-admin-token: <ADMIN_TOKEN>"
```

## Admin tối giản
- Mở `/admin.html`, nhập token → có thể tạo/sửa/xoá bài viết.
- Phần blog trên trang chính sẽ tự **lấy từ API** nếu khả dụng; nếu API lỗi, UI vẫn hiển thị nội dung tĩnh cũ.

## Lưu ý bảo mật
- Demo này dùng token **client gửi trực tiếp** → phù hợp thử nghiệm. Khi go-live, hãy thêm auth (Vercel Auth/Clerk/Supabase) hoặc chuyển Admin sang dashboard riêng chỉ server truy cập.
