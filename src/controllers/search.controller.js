import { SearchPostsDto } from "../dtos/search.dto.js";
import { searchPostsService } from "../services/search.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import express from "express";

const router = express.Router();

/**
 * @swagger
 * /api/posts/search:
 *   get:
 *     summary: 게시글 검색
 *     description:
 *       - 게시글 내용을 검색하거나, `#태그` 형식으로 태그 기반 검색이 가능합니다.
 *     tags:
 *       - Search
 *     security:
 *       - bearerAuth: []   # JWT 인증 필요
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: 검색어 (본문 검색은 '문자열', 태그 검색은 '#태그')
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: 페이지 번호
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: 한 페이지당 게시글 수
 *     responses:
 *       200:
 *         description: 검색 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 42
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     posts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           content:
 *                             type: string
 *                             example: "게시글 내용 예시"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           commentCount:
 *                             type: integer
 *                             example: 3
 *                           likeCount:
 *                             type: integer
 *                             example: 5
 *                           bookmarkCount:
 *                             type: integer
 *                             example: 2
 *                           postImages:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 url:
 *                                   type: string
 *                                   example: "https://example.com/image.jpg"
 */
router.get(
  "/",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // DTO로 query, page, take 처리
    const searchDto = new SearchPostsDto(req.query);

    // service 호출 (skip, take 기반)
    const { total, posts } = await searchPostsService(
      searchDto.query,
      userId,
      searchDto.skip,
      searchDto.take
    );

    res.json({
      resultType: "SUCCESS",
      data: {
        total,
        page: searchDto.page,
        limit: searchDto.take,
        posts,
      },
    });
  })
);

export default router;
