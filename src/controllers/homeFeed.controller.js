import express from "express";
import homeFeedService from "../services/homeFeed.service.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 팔로잉한 사람들 게시글 피드 조회 (페이징)

/**
 * @swagger
 * /api/homefeed:
 *   get:
 *     summary: 팔로잉한 유저들의 게시글 피드 조회
 *     description: 로그인한 사용자가 팔로잉한 유저들의 게시글 피드를 페이지네이션하여 반환합니다. 각 게시글에는 댓글 수, 좋아요 수, 리포스트 수, 북마크 수, 좋아요 여부, 북마크 여부가 포함됩니다. 리포스트된 게시글의 원본 정보는 최소한의 필드만 포함합니다.
 *     tags:
 *       - HomeFeed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호 (기본값 1)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 게시글 수 (기본값 10)
 *     responses:
 *       200:
 *         description: 성공적으로 게시글 목록을 반환
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
 *                     totalCount:
 *                       type: integer
 *                       example: 123
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
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
 *                             example: "오늘 날씨가 너무 좋네요!"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-08-03T12:00:00.000Z"
 *                           commentCount:
 *                             type: integer
 *                             example: 3
 *                           likeCount:
 *                             type: integer
 *                             example: 10
 *                           repostCount:
 *                             type: integer
 *                             example: 2
 *                           bookmarkCount:
 *                             type: integer
 *                             example: 1
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 5
 *                               nickname:
 *                                 type: string
 *                                 example: "홍길동"
 *                               profileImage:
 *                                 type: string
 *                                 example: "https://example.com/profile.jpg"
 *                           postImages:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 url:
 *                                   type: string
 *                                   example: "https://example.com/image1.jpg"
 *                           community:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               type:
 *                                 type: string
 *                                 example: "musical"
 *                               coverImage:
 *                                 type: string
 *                                 example: "https://example.com/community.jpg"
 *                           postLikes:
 *                             type: array
 *                             description: 로그인한 유저가 좋아요를 눌렀는지 여부 (배열 길이로 판단)
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 12
 *                           postBookmarks:
 *                             type: array
 *                             description: 로그인한 유저가 북마크를 했는지 여부 (배열 길이로 판단)
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 7
 *                           repostTarget:
 *                             type: object
 *                             nullable: true
 *                             description: 리포스트 대상 원본 게시글(간소화된 정보)
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 2
 *                               content:
 *                                 type: string
 *                                 example: "원본 게시글 내용"
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2025-08-02T15:00:00.000Z"
 *                               user:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 6
 *                                   nickname:
 *                                     type: string
 *                                     example: "이몽룡"
 *                                   profileImage:
 *                                     type: string
 *                                     example: "https://example.com/profile2.jpg"
 *                               postImages:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     url:
 *                                       type: string
 *                                       example: "https://example.com/image2.jpg"
 *                               community:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 2
 *                                   type:
 *                                     type: string
 *                                     example: "actor"
 *                                   coverImage:
 *                                     type: string
 *                                     example: "https://example.com/community2.jpg"
 *       401:
 *         description: 인증 실패 (유효하지 않은 토큰)
 *       500:
 *         description: 서버 오류
 */
router.get("/", authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const data = await homeFeedService.getFollowingPosts(
      userId,
      page,
      pageSize
    );

    res.status(200).json({
      resultType: "SUCCESS",
      data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
