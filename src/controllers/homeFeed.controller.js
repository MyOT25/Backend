import express from "express";
import asyncHandler from "../middlewares/asyncHandler.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import { getHomeFeedPostsService } from "../services/homeFeed.service.js";

const router = express.Router();

router.get(
  "/",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const userId = req.user.id; // JWT에서 추출한 로그인 유저 id
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const { total, posts } = await getHomeFeedPostsService({
      userId,
      page,
      limit,
    });

    res.json({
      resultType: "SUCCESS",
      data: {
        total,
        page,
        limit,
        posts,
      },
    });
  })
);

export default router;
