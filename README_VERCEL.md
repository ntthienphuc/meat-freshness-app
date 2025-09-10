# Deploy trên Vercel

## Cách đơn giản
1. Push repo lên GitHub/GitLab.
2. Trên Vercel → New Project → chọn repo → Preset: **Other**.
3. Deploy (Vercel đọc `vercel.json`): 
   - Frontend tĩnh ở `public/`
   - API serverless: `GET /api/health`, `POST /api/analyze` (mock).

> Bật API thật (khi đã sẵn sàng) bằng cách sửa `public/runtime-config.js`:
> ```js
> window.APP_CONFIG = { enableAI: true, apiBase: "/api" };
> ```

## Database trên Vercel?
- Dùng **Vercel Postgres** cho blog/ghi chép.
- **Vercel KV** (Redis) cho key‑value/counters/session.
- **Vercel Blob** để lưu ảnh upload.
Hiện blog ít dữ liệu → có thể giữ tĩnh, khi cần động hoá hãy chọn Postgres/KV.

