// vercel-api/db.js - shared DB helpers using Vercel Postgres
import { sql } from "@vercel/postgres";

export async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      body TEXT NOT NULL,
      tags TEXT[] DEFAULT ARRAY[]::TEXT[],
      author TEXT DEFAULT 'Hệ thống',
      minutes INT DEFAULT 3,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}

export async function listPosts({ q = "", tag = "", limit = 12, offset = 0 } = {}) {
  const where = [];
  const params = [];
  if (q) {
    where.push(`(LOWER(title) LIKE LOWER('%' || ${sql.join([q], sql``)} || '%') OR LOWER(excerpt) LIKE LOWER('%' || ${sql.join([q], sql``)} || '%'))`);
  }
  if (tag) {
    where.push(`${sql.raw(`$${params.length+1}`)} = ANY(tags)`);
    params.push(tag);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = (await sql.unsafe(
    `SELECT id, title, excerpt, tags, author, minutes, created_at
     FROM posts
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT ${limit} OFFSET ${offset}`, params
  )).rows;
  return rows;
}

export async function getPost(id) {
  const { rows } = await sql`SELECT * FROM posts WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function createPost({ title, excerpt, body, tags = [], author="Admin", minutes=5 }) {
  const { rows } = await sql`
    INSERT INTO posts (title, excerpt, body, tags, author, minutes)
    VALUES (${title}, ${excerpt}, ${body}, ${tags}, ${author}, ${minutes})
    RETURNING id, title, excerpt, tags, author, minutes, created_at
  `;
  return rows[0];
}

export async function updatePost(id, patch) {
  const old = await getPost(id);
  if (!old) return null;
  const title = patch.title ?? old.title;
  const excerpt = patch.excerpt ?? old.excerpt;
  const body = patch.body ?? old.body;
  const tags = patch.tags ?? old.tags;
  const author = patch.author ?? old.author;
  const minutes = patch.minutes ?? old.minutes;
  const { rows } = await sql`
    UPDATE posts SET title=${title}, excerpt=${excerpt}, body=${body}, tags=${tags}, author=${author}, minutes=${minutes}
    WHERE id=${id}
    RETURNING id, title, excerpt, tags, author, minutes, created_at
  `;
  return rows[0];
}

export async function deletePost(id) {
  const { rowCount } = await sql`DELETE FROM posts WHERE id=${id}`;
  return rowCount > 0;
}
