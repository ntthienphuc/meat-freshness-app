import { ensureSchema, createPost } from "../db.js";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method Not Allowed" });
    const token = req.headers["x-admin-token"] || "";
    if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) return res.status(401).json({ ok:false, error:"Unauthorized" });
    await ensureSchema();
    const samples = [
      {
        title: "5 dấu hiệu nhận biết thịt bò tươi ngon không thể bỏ qua",
        excerpt: "Chuyên gia chia sẻ những bí quyết đơn giản để chọn được thịt bò tươi ngon.",
        body: "Nội dung chi tiết bài viết về cách chọn thịt bò tươi...",
        tags: ["thịt bò","chọn thịt"],
        author: "Chuyên gia Nguyễn Văn An",
        minutes: 5
      },
      {
        title: "Cách bảo quản thịt heo trong tủ lạnh dễ giữ được 1 tuần",
        excerpt: "Phương pháp bảo quản khoa học giúp thịt tươi ngon và an toàn.",
        body: "Nội dung chi tiết bài viết bảo quản thịt heo...",
        tags: ["thịt heo","bảo quản","tủ lạnh"],
        author: "Bếp trưởng Lê Thị Hoa",
        minutes: 4
      },
      {
        title: "Thịt gà có màu vàng hay trắng tốt hơn?",
        excerpt: "Giải đáp thắc mắc về màu sắc của thịt gà và lựa chọn phù hợp.",
        body: "Nội dung chi tiết bài viết về thịt gà...",
        tags: ["thịt gà","dinh dưỡng"],
        author: "TS. Trần Minh Đức",
        minutes: 6
      }
    ];
    const created = [];
    for (const p of samples) created.push(await createPost(p));
    return res.status(201).json({ ok:true, count: created.length, data: created });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok:false, error:"Server Error" });
  }
}
