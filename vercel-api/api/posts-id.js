import { ensureSchema, getPost, updatePost, deletePost } from "../db.js";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

export default async function handler(req, res) {
  try {
    await ensureSchema();
    const id = (req.query && (req.query.id || (Array.isArray(req.query.params) ? req.query.params[0] : ""))) || (req.url.split("/").pop());
    if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

    if (req.method === "GET") {
      const data = await getPost(id);
      if (!data) return res.status(404).json({ ok: false, error: "Not found" });
      return res.status(200).json({ ok: true, data });
    }
    if (req.method === "PUT" || req.method === "PATCH") {
      const token = req.headers["x-admin-token"] || "";
      if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) return res.status(401).json({ ok: false, error: "Unauthorized" });
      const data = await updatePost(id, req.body || {});
      if (!data) return res.status(404).json({ ok: false, error: "Not found" });
      return res.status(200).json({ ok: true, data });
    }
    if (req.method === "DELETE") {
      const token = req.headers["x-admin-token"] || "";
      if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) return res.status(401).json({ ok: false, error: "Unauthorized" });
      const ok = await deletePost(id);
      return res.status(ok ? 204 : 404).json(ok ? {} : { ok: false, error: "Not found" });
    }
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Server Error" });
  }
}
