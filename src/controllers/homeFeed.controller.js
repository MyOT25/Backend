import express from "express";
import asyncHandler from "../middlewares/asyncHandler.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import { getHomeFeedPostsService } from "../services/homeFeed.service.js";

const router = express.Router();

/**
 * @swagger
 * /api/homefeed:
 *   get:
 *     summary: "홈피드 게시글 조회"
 *     description: "로그인 유저 기준으로 팔로우한 유저들의 게시글과 자신의 게시글을 최신순으로 조회합니다. 일반, 리포스트, 인용 게시글을 모두 포함하며, 로그인 유저가 게시글을 좋아요/북마크/리포스트했는지 여부도 반환합니다."
 *     tags:
 *       - HomeFeed
 *     security:
 *       - bearerAuth: []   # JWT 인증 필요
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: "조회할 페이지 번호 (기본값 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: "페이지당 조회 게시글 수 (기본값 10)"
 *     responses:
 *       200:
 *         description: "홈피드 게시글 조회 성공"
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
 *                       example: 125
 *                       description: "전체 게시글 수"
 *                     page:
 *                       type: integer
 *                       example: 1
 *                       description: "조회한 페이지 번호"
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                       description: "한 페이지에 반환되는 게시글 수"
 *                     posts:
 *                       type: array
 *                       description: "게시글 목록"
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 42
 *                           content:
 *                             type: string
 *                             example: "오늘 점심은 치킨!"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           commentCount:
 *                             type: integer
 *                             example: 3
 *                           likeCount:
 *                             type: integer
 *                             example: 5
 *                           repostCount:
 *                             type: integer
 *                             example: 2
 *                           bookmarkCount:
 *                             type: integer
 *                             example: 1
 *                           isRepost:
 *                             type: boolean
 *                             example: false
 *                           repostType:
 *                             type: string
 *                             example: null
 *                             description: "repost / quote / null"
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               loginId:
 *                                 type: string
 *                               nickname:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *                           community:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               type:
 *                                 type: string
 *                               coverImage:
 *                                 type: string
 *                           postImages:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 url:
 *                                   type: string
 *                           postLikes:
 *                             type: boolean
 *                             example: true
 *                             description: "로그인 유저가 좋아요 했는지 여부"
 *                           postBookmarks:
 *                             type: boolean
 *                             example: false
 *                             description: "로그인 유저가 북마크 했는지 여부"
 *                           postComments:
 *                             type: boolean
 *                             example: false
 *                             description: "로그인 유저가 댓글을 작성했는지 여부"
 *                           reposts:
 *                             type: boolean
 *                             example: true
 *                             description: "로그인 유저가 리포스트 했는지 여부"
 *                           repostTarget:
 *                             type: object
 *                             nullable: true
 *                             description: "리포스트/인용 게시글의 원본 게시글 정보"
 */
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
