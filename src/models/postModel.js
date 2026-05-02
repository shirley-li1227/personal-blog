const { dbAll, dbGet, dbRun } = require("../config/db");

function mapPostRow(row) {
  let parsedTags = [];
  if (Array.isArray(row.tags)) {
    parsedTags = row.tags;
  } else if (typeof row.tags === "string" && row.tags) {
    try {
      parsedTags = JSON.parse(row.tags);
    } catch (error) {
      parsedTags = [];
    }
  }

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    cover: row.cover,
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
        }
      : null,
    tags: parsedTags,
    author: {
      id: row.author_id,
      username: row.author_username,
    },
    views: row.views,
    status: row.status,
    like_count: Number(row.like_count || 0),
    favorite_count: Number(row.favorite_count || 0),
    liked: Boolean(row.liked),
    favorited: Boolean(row.favorited),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function createPost({ title, content, categoryId, tags, cover, authorId }) {
  const result = await dbRun(
    `INSERT INTO articles (title, content, category_id, tags, cover, author_id, status)
     VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
    [title, content, categoryId, JSON.stringify(tags), cover, authorId]
  );

  return result.insertId;
}

async function getPostById(postId, userId = 0) {
  const row = await dbGet(
    `SELECT a.id, a.title, a.content, a.cover, a.category_id, a.tags, a.author_id,
            a.views, a.status, a.created_at, a.updated_at, c.name AS category_name,
            u.username AS author_username,
            (SELECT COUNT(*) FROM article_likes al WHERE al.article_id = a.id) AS like_count,
            (SELECT COUNT(*) FROM article_favorites af WHERE af.article_id = a.id) AS favorite_count,
            EXISTS(SELECT 1 FROM article_likes al2 WHERE al2.article_id = a.id AND al2.user_id = ?) AS liked,
            EXISTS(SELECT 1 FROM article_favorites af2 WHERE af2.article_id = a.id AND af2.user_id = ?) AS favorited
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       INNER JOIN users u ON u.id = a.author_id
      WHERE a.id = ?
      LIMIT 1`,
    [userId || 0, userId || 0, postId]
  );

  if (!row) {
    return null;
  }

  return mapPostRow(row);
}

async function increasePostViews(postId) {
  await dbRun("UPDATE articles SET views = views + 1 WHERE id = ?", [postId]);
}

async function listPosts({ offset, pageSize, category, keyword, userId = 0 }) {
  const whereClauses = [];
  const params = [];

  whereClauses.push("a.status = 'published'");

  if (category) {
    whereClauses.push("(a.category_id = ? OR c.name = ?)");
    params.push(Number(category) || -1, category);
  }

  if (keyword) {
    whereClauses.push("(a.title LIKE ? OR a.content LIKE ?)");
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const countRows = await dbAll(
    `SELECT COUNT(*) AS total
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
      ${whereSql}`,
    params
  );

  const safePageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 10;
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;

  const total = Number(countRows[0]?.total ?? 0);

  const rows = await dbAll(
    `SELECT a.id, a.title, a.content, a.cover, a.category_id, a.tags, a.author_id,
            a.views, a.status, a.created_at, a.updated_at, c.name AS category_name,
            u.username AS author_username,
            (SELECT COUNT(*) FROM article_likes al WHERE al.article_id = a.id) AS like_count,
            (SELECT COUNT(*) FROM article_favorites af WHERE af.article_id = a.id) AS favorite_count,
            EXISTS(SELECT 1 FROM article_likes al2 WHERE al2.article_id = a.id AND al2.user_id = ?) AS liked,
            EXISTS(SELECT 1 FROM article_favorites af2 WHERE af2.article_id = a.id AND af2.user_id = ?) AS favorited
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       INNER JOIN users u ON u.id = a.author_id
      ${whereSql}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?`,
    [userId || 0, userId || 0, ...params, safePageSize, safeOffset]
  );

  return {
    total,
    list: rows.map(mapPostRow),
  };
}

async function updatePostById(postId, fields) {
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
  if (!entries.length) {
    return 0;
  }

  const setSql = entries.map(([key]) => `${key} = ?`).join(", ");
  const values = entries.map(([, value]) => value);

  const result = await dbRun(
    `UPDATE articles SET ${setSql}, updated_at = datetime('now') WHERE id = ?`,
    [...values, postId]
  );

  return result.affectedRows;
}

async function deletePostById(postId) {
  const result = await dbRun("DELETE FROM articles WHERE id = ?", [postId]);
  return result.affectedRows;
}

async function updatePostStatus(postId, status) {
  const result = await dbRun(
    "UPDATE articles SET status = ?, updated_at = datetime('now') WHERE id = ?",
    [status, postId]
  );
  return result.affectedRows;
}

async function likePost(postId, userId) {
  await dbRun("INSERT OR IGNORE INTO article_likes (article_id, user_id) VALUES (?, ?)", [
    postId,
    userId,
  ]);
}

async function unlikePost(postId, userId) {
  await dbRun("DELETE FROM article_likes WHERE article_id = ? AND user_id = ?", [postId, userId]);
}

async function favoritePost(postId, userId) {
  await dbRun("INSERT OR IGNORE INTO article_favorites (article_id, user_id) VALUES (?, ?)", [
    postId,
    userId,
  ]);
}

async function unfavoritePost(postId, userId) {
  await dbRun("DELETE FROM article_favorites WHERE article_id = ? AND user_id = ?", [
    postId,
    userId,
  ]);
}

async function listFavoritePosts(userId) {
  const rows = await dbAll(
    `SELECT a.id, a.title, a.content, a.cover, a.category_id, a.tags, a.author_id,
            a.views, a.status, a.created_at, a.updated_at, c.name AS category_name,
            u.username AS author_username,
            (SELECT COUNT(*) FROM article_likes al WHERE al.article_id = a.id) AS like_count,
            (SELECT COUNT(*) FROM article_favorites af2 WHERE af2.article_id = a.id) AS favorite_count,
            EXISTS(SELECT 1 FROM article_likes al2 WHERE al2.article_id = a.id AND al2.user_id = ?) AS liked,
            1 AS favorited
       FROM article_favorites af
       INNER JOIN articles a ON a.id = af.article_id
       LEFT JOIN categories c ON c.id = a.category_id
       INNER JOIN users u ON u.id = a.author_id
      WHERE af.user_id = ? AND a.status = 'published'
      ORDER BY af.created_at DESC`,
    [userId, userId]
  );

  return rows.map(mapPostRow);
}

async function listMyPublishedPosts(userId) {
  const rows = await dbAll(
    `SELECT a.id, a.title, a.content, a.cover, a.category_id, a.tags, a.author_id,
            a.views, a.status, a.created_at, a.updated_at, c.name AS category_name,
            u.username AS author_username,
            (SELECT COUNT(*) FROM article_likes al WHERE al.article_id = a.id) AS like_count,
            (SELECT COUNT(*) FROM article_favorites af WHERE af.article_id = a.id) AS favorite_count,
            EXISTS(SELECT 1 FROM article_likes al2 WHERE al2.article_id = a.id AND al2.user_id = ?) AS liked,
            EXISTS(SELECT 1 FROM article_favorites af2 WHERE af2.article_id = a.id AND af2.user_id = ?) AS favorited
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       INNER JOIN users u ON u.id = a.author_id
      WHERE a.author_id = ? AND a.status = 'published'
      ORDER BY a.created_at DESC`,
    [userId, userId, userId]
  );

  return rows.map(mapPostRow);
}

async function listMyLikedPosts(userId) {
  const rows = await dbAll(
    `SELECT a.id, a.title, a.content, a.cover, a.category_id, a.tags, a.author_id,
            a.views, a.status, a.created_at, a.updated_at, c.name AS category_name,
            u.username AS author_username,
            (SELECT COUNT(*) FROM article_likes al WHERE al.article_id = a.id) AS like_count,
            (SELECT COUNT(*) FROM article_favorites af WHERE af.article_id = a.id) AS favorite_count,
            1 AS liked,
            EXISTS(SELECT 1 FROM article_favorites af2 WHERE af2.article_id = a.id AND af2.user_id = ?) AS favorited
       FROM article_likes al
       INNER JOIN articles a ON a.id = al.article_id
       LEFT JOIN categories c ON c.id = a.category_id
       INNER JOIN users u ON u.id = a.author_id
      WHERE al.user_id = ? AND a.status = 'published'
      ORDER BY al.created_at DESC`,
    [userId, userId]
  );

  return rows.map(mapPostRow);
}

module.exports = {
  createPost,
  getPostById,
  increasePostViews,
  listPosts,
  updatePostById,
  deletePostById,
  updatePostStatus,
  likePost,
  unlikePost,
  favoritePost,
  unfavoritePost,
  listFavoritePosts,
  listMyPublishedPosts,
  listMyLikedPosts,
};
