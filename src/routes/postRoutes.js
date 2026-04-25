const express = require("express");
const {
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
} = require("../controllers/postController");
const { requireAuth, optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", requireAuth, createPostHandler);
router.get("/", optionalAuth, getPostsHandler);
router.get("/favorites", requireAuth, getFavoritePostsHandler);
router.get("/mine", requireAuth, getMyPublishedPostsHandler);
router.get("/liked", requireAuth, getMyLikedPostsHandler);
router.get("/:id", optionalAuth, getPostDetailHandler);
router.put("/:id", requireAuth, updatePostHandler);
router.delete("/:id", requireAuth, deletePostHandler);
router.put("/:id/publish", requireAuth, publishPostHandler);
router.put("/:id/unpublish", requireAuth, unpublishPostHandler);
router.post("/:id/like", requireAuth, likePostHandler);
router.delete("/:id/like", requireAuth, unlikePostHandler);
router.post("/:id/favorite", requireAuth, favoritePostHandler);
router.delete("/:id/favorite", requireAuth, unfavoritePostHandler);

module.exports = router;
