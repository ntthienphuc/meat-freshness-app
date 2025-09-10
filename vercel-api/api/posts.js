import { ensureSchema, listPosts, createPost } from "../db.js";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

export default async function handler(req, res) {
  try {
    await ensureSchema();
    if (req.method === "GET") {
      const { q = "", tag = "", limit = "12", offset = "0" } = req.query || {};
      const data = await listPosts({ q, tag, limit: Number(limit), offset: Number(offset) });
      return res.status(200).json({ ok: true, data });
    }
    if (req.method === "POST") {
      const token = req.headers["x-admin-token"] || "";
      if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) return res.status(401).json({ ok: false, error: "Unauthorized" });
      const { title, excerpt, body, tags = [], author = "Admin", minutes = 5 } = req.body || {};
      if (!title || !excerpt || !body) return res.status(400).json({ ok: false, error: "Missing fields" });
      const created = await createPost({ title, excerpt, body, tags, author, minutes });
      return res.status(201).json({ ok: true, data: created });
    }
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Server Error" });
  }
}
