import express from "express";
import asyncHandler from "../middlewares/asyncHandler.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import { getBookmarkPostsService } from "../services/bookmark.service.js";

const router = express.Router();

// 로그인한 유저가 북마크한 게시글 조회
router.get(
  "/",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    // query에서 page, limit 추출
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Service 호출
    const result = await getBookmarkPostsService(req.user.id, page, limit);

    // 결과 반환
    res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: result, // total, page, limit, posts 포함
    });
  })
);

export default router;
