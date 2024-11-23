import express from "express";
import {
  likeVideo,
  dislikeVideo,
  checkIsLiked,
  likeComment,
  dislikeComment,
  checkIsLikedComment,
  getLikedVideos,
  checkIsDisliked,
} from "../controllers/like.controller";
import { verifyToken } from "../middleware/verifyToken";
import rateLimit from "express-rate-limit";
const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/like", verifyToken, likeVideo);
router.get("/video-like", verifyToken, getLikedVideos);
router.post("/dislike", verifyToken, dislikeVideo);
router.get("/check-like/:id", verifyToken, checkIsLiked);
router.get("/check-dislike/:id", verifyToken, checkIsDisliked);
router.get("/check-like-comment/:id", verifyToken, checkIsLikedComment);
router.post("/like-comment", verifyToken, likeComment);
router.post("/dislike-comment", verifyToken, dislikeComment);

router.use(limiter);
export default router;
