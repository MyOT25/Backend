import express from "express";
import prisma from "../config/prismaClient.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import jwt from "jsonwebtoken";

import {
  getCommunityReviewFeed,
  toggleViewingLike,
} from "../services/communityReview.service.js";

const router = express.Router();

/**
 * @swagger
 * /api/community/{id}/reviews:
 *   get:
 *     summary: 작품 커뮤니티의 관극 후기 피드 조회
 *     description: Community.type=musical && targetId=musicalId 로 매칭된 ViewingRecord를 최신/인기 정렬로 반환합니다.
 *     tags: [Community]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [latest, popular], default: latest }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: cursor
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 */
router.get("/:id/reviews", async (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const { sort = "latest", limit = 10, cursor } = req.query;

    let userId = null;
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      try {
        const token = auth.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded?.id || decoded?.userId || null;
      } catch (_) {}
    }

    const { community, reviews, nextCursor } = await getCommunityReviewFeed(
      communityId,
      userId,
      {
        sort: String(sort),
        limit: Number(limit),
        cursor: cursor ? Number(cursor) : undefined,
      }
    );

    return res.status(200).json({
      success: true,
      community: { id: community.id, name: community.groupName },
      reviews,
      nextCursor,
    });
  } catch (err) {
    console.error("GET /community/:id/reviews error:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/community/reviews/{viewingId}/like:
 *   post:
 *     summary: 관극 후기 좋아요 토글
 *     description: ViewingRecord(관극기록)에 대한 좋아요를 토글합니다.
 *     tags: [Community]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: viewingId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 */
router.post("/reviews/:viewingId/like", authenticateJWT, async (req, res) => {
  try {
    const viewingId = Number(req.params.viewingId);
    const userId = Number(req.user?.id);

    if (!viewingId || !userId) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 요청이 아닙니다." });
    }

    const { liked, likeCount } = await toggleViewingLike(viewingId, userId);

    return res.status(200).json({
      success: true,
      message: liked ? "좋아요 추가" : "좋아요 취소",
      data: { viewingId, liked, likeCount },
    });
  } catch (err) {
    console.error("POST /community/reviews/:viewingId/like error:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
