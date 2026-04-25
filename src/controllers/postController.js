const {
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
} = require("../models/postModel");
const { ensureCategoryByName } = require("../models/categoryModel");

function parseCategoryName(category) {
  if (category === undefined || category === null || category === "") {
    return null;
  }

  if (typeof category !== "string") {
    return null;
  }

  const name = category.trim();
  return name || null;
}

function normalizeTags(tags) {
  if (tags === undefined || tags === null) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag)).filter(Boolean);
  }

  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed.map((tag) => String(tag)).filter(Boolean);
      }
    } catch (error) {
      return tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }

  return [];
}

async function createPostHandler(req, res, next) {
  try {
    const { title, content, category, tags, cover } = req.body || {};

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "标题不能为空" });
    }
    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "内容不能为空" });
    }

    const categoryName = parseCategoryName(category);
    let categoryId = null;
    if (categoryName) {
      categoryId = await ensureCategoryByName(categoryName);
    }

    const postId = await createPost({
      title: title.trim(),
      content: content.trim(),
      categoryId,
      tags: normalizeTags(tags),
      cover: typeof cover === "string" && cover.trim() ? cover.trim() : null,
      authorId: req.user.id,
    });

    const createdPost = await getPostById(postId);
    return res.status(201).json({
      message: "创建文章成功",
      post: createdPost,
    });
  } catch (error) {
    return next(error);
  }
}

async function getPostsHandler(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safePageSize =
      Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100 ? pageSize : 10;

    const category =
      typeof req.query.category === "string" && req.query.category.trim()
        ? req.query.category.trim()
        : "";
    const keyword =
      typeof req.query.keyword === "string" && req.query.keyword.trim()
        ? req.query.keyword.trim()
        : "";

    const { total, list } = await listPosts({
      offset: (safePage - 1) * safePageSize,
      pageSize: safePageSize,
      category,
      keyword,
      userId: req.user?.id || 0,
    });

    return res.status(200).json({
      total,
      page: safePage,
      pageSize: safePageSize,
      list,
    });
  } catch (error) {
    return next(error);
  }
}

async function getPostDetailHandler(req, res, next) {
  try {
    const postId = Number(req.params.id);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: "文章 ID 不合法" });
    }

    const existingPost = await getPostById(postId, req.user?.id || 0);
    if (!existingPost) {
      return res.status(404).json({ message: "文章不存在" });
    }
    if (existingPost.status !== "published" && existingPost.author.id !== req.user?.id) {
      return res.status(404).json({ message: "文章不存在或已下架" });
    }

    await increasePostViews(postId);
    const post = await getPostById(postId, req.user?.id || 0);

    return res.status(200).json({ post });
  } catch (error) {
    return next(error);
  }
}

async function updatePostHandler(req, res, next) {
  try {
    const postId = Number(req.params.id);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: "文章 ID 不合法" });
    }

    const existingPost = await getPostById(postId, req.user.id);
    if (!existingPost) {
      return res.status(404).json({ message: "文章不存在" });
    }

    if (existingPost.author.id !== req.user.id) {
      return res.status(403).json({ message: "无权限修改他人文章" });
    }

    const { title, content, category, tags, cover } = req.body || {};

    const updates = {};
    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ message: "标题不能为空" });
      }
      updates.title = title.trim();
    }
    if (content !== undefined) {
      if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ message: "内容不能为空" });
      }
      updates.content = content.trim();
    }
    if (category !== undefined) {
      const categoryName = parseCategoryName(category);
      updates.category_id = categoryName
        ? await ensureCategoryByName(categoryName)
        : null;
    }
    if (tags !== undefined) {
      updates.tags = JSON.stringify(normalizeTags(tags));
    }
    if (cover !== undefined) {
      if (cover !== null && typeof cover !== "string") {
        return res.status(400).json({ message: "封面参数不合法" });
      }
      updates.cover = cover && cover.trim() ? cover.trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "没有可更新的字段" });
    }

    await updatePostById(postId, updates);
    const post = await getPostById(postId, req.user.id);

    return res.status(200).json({
      message: "更新文章成功",
      post,
    });
  } catch (error) {
    return next(error);
  }
}

async function deletePostHandler(req, res, next) {
  try {
    const postId = Number(req.params.id);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: "文章 ID 不合法" });
    }

    const existingPost = await getPostById(postId, req.user.id);
    if (!existingPost) {
      return res.status(404).json({ message: "文章不存在" });
    }

    if (existingPost.author.id !== req.user.id) {
      return res.status(403).json({ message: "无权限删除他人文章" });
    }

    await deletePostById(postId);

    return res.status(200).json({
      message: "删除文章成功",
    });
  } catch (error) {
    return next(error);
  }
}

async function publishPostHandler(req, res, next) {
  try {
    const postId = Number(req.params.id);
    const post = await getPostById(postId, req.user.id);
    if (!post) {
      return res.status(404).json({ message: "文章不存在" });
    }
    if (post.author.id !== req.user.id) {
      return res.status(403).json({ message: "无权限发布他人文章" });
    }

    await updatePostStatus(postId, "published");
    const latest = await getPostById(postId, req.user.id);
    return res.status(200).json({ message: "文章已发布", post: latest });
  } catch (error) {
    return next(error);
  }
}

async function unpublishPostHandler(req, res, next) {
  try {
    const postId = Number(req.params.id);
    const post = await getPostById(postId, req.user.id);
    if (!post) {
      return res.status(404).json({ message: "文章不存在" });
    }
    if (post.author.id !== req.user.id) {
      return res.status(403).json({ message: "无权限下架他人文章" });
    }

    await updatePostStatus(postId, "draft");
    const latest = await getPostById(postId, req.user.id);
    return res.status(200).json({ message: "文章已下架", post: latest });
  } catch (error) {
    return next(error);
  }
}

async function likePostHandler(req, res, next) {
  try {
    const postId = Number(req.params.id);
    const post = await getPostById(postId, req.user.id);
    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "文章不存在或未发布" });
    }

    await likePost(postId, req.user.id);
    const latest = await getPostById(postId, req.user.id);
    return res.status(200).json({ message: "点赞成功", post: latest });
  } catch (error) {
    return next(error);
  }
}

async function unlikePostHandler(req, res, next) {
  try {
    const postId = Number(req.params.id);
    const post = await getPostById(postId, req.user.id);
    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "文章不存在或未发布" });
    }

    await unlikePost(postId, req.user.id);
    const latest = await getPostById(postId, req.user.id);
    return res.status(200).json({ message: "已取消点赞", post: latest });
  } catch (error) {
    return next(error);
  }
}

async function favoritePostHandler(req, res, next) {
  try {
    const postId = Number(req.params.id);
    const post = await getPostById(postId, req.user.id);
    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "文章不存在或未发布" });
    }

    await favoritePost(postId, req.user.id);
    const latest = await getPostById(postId, req.user.id);
    return res.status(200).json({ message: "收藏成功", post: latest });
  } catch (error) {
    return next(error);
  }
}

async function unfavoritePostHandler(req, res, next) {
  try {
    const postId = Number(req.params.id);
    const post = await getPostById(postId, req.user.id);
    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "文章不存在或未发布" });
    }

    await unfavoritePost(postId, req.user.id);
    const latest = await getPostById(postId, req.user.id);
    return res.status(200).json({ message: "已取消收藏", post: latest });
  } catch (error) {
    return next(error);
  }
}

async function getFavoritePostsHandler(req, res, next) {
  try {
    const list = await listFavoritePosts(req.user.id);
    return res.status(200).json({ list, total: list.length });
  } catch (error) {
    return next(error);
  }
}

async function getMyPublishedPostsHandler(req, res, next) {
  try {
    const list = await listMyPublishedPosts(req.user.id);
    return res.status(200).json({ list, total: list.length });
  } catch (error) {
    return next(error);
  }
}

async function getMyLikedPostsHandler(req, res, next) {
  try {
    const list = await listMyLikedPosts(req.user.id);
    return res.status(200).json({ list, total: list.length });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createPostHandler,
  getPostsHandler,
  getPostDetailHandler,
  updatePostHandler,
  deletePostHandler,
  publishPostHandler,
  unpublishPostHandler,
  likePostHandler,
  unlikePostHandler,
  favoritePostHandler,
  unfavoritePostHandler,
  getFavoritePostsHandler,
  getMyPublishedPostsHandler,
  getMyLikedPostsHandler,
};
