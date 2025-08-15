import express from "express";
import asyncHandler from "../middlewares/asyncHandler.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import profileFeedService from "../services/profileFeed.service.js";

const router = express.Router({ mergeParams: true });

// query에서 page/limit 추출
const getPaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  return { page, limit };
};

// 전체 게시글
/**
 * @swagger
 * /api/users/{userId}/profilefeed/all:
 *   get:
 *     summary: "사용자 전체 게시글 조회"
 *     description: "로그인 유저 기준으로 특정 사용자의 전체 게시글을 조회합니다."
 *     tags:
 *       - ProfileFeed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "조회할 사용자 ID"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "페이지 번호"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "페이지당 게시글 수"
 *     responses:
 *       200:
 *         description: 성공
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
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Post'
 */
router.get(
  "/all",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = getPaginationParams(req);

    const { total, posts } = await profileFeedService.getAllPosts({
      loginUserId: req.user.id,
      targetUserId: Number(userId),
      page,
      limit,
    });

    res.status(200).json({
      resultType: "SUCCESS",
      data: { total, page, limit, posts },
    });
  })
);

// 인용 게시글
/**
 * @swagger
 * /api/users/{userId}/profilefeed/quote:
 *   get:
 *     summary: "사용자 인용 게시글 조회"
 *     description: "로그인 유저 기준으로 특정 사용자의 인용(quote) 게시글만 조회합니다."
 *     tags:
 *       - ProfileFeed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "조회할 사용자 ID"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 성공
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
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Post'
 */
router.get(
  "/quote",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = getPaginationParams(req);

    const { total, posts } = await profileFeedService.getQuotePosts({
      loginUserId: req.user.id,
      targetUserId: Number(userId),
      page,
      limit,
    });

    res.status(200).json({
      resultType: "SUCCESS",
      data: { total, page, limit, posts },
    });
  })
);

// 리포스트 게시글
/**
 * @swagger
 * /api/users/{userId}/profilefeed/repost:
 *   get:
 *     summary: "사용자 리포스트 게시글 조회"
 *     description: "로그인 유저 기준으로 특정 사용자의 리포스트(repost) 게시글만 조회합니다."
 *     tags:
 *       - ProfileFeed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "조회할 사용자 ID"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 성공
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
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Post'
 */
router.get(
  "/repost",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = getPaginationParams(req);

    const { total, posts } = await profileFeedService.getRepostPosts({
      loginUserId: req.user.id,
      targetUserId: Number(userId),
      page,
      limit,
    });

    res.status(200).json({
      resultType: "SUCCESS",
      data: { total, page, limit, posts },
    });
  })
);

// 미디어 게시글
/**
 * @swagger
 * /api/users/{userId}/profilefeed/media:
 *   get:
 *     summary: "사용자 미디어 게시글 조회"
 *     description: "로그인 유저 기준으로 특정 사용자의 미디어가 포함된 게시글만 조회합니다."
 *     tags:
 *       - ProfileFeed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "조회할 사용자 ID"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 성공
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
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Post'
 */
router.get(
  "/media",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = getPaginationParams(req);

    const { total, posts } = await profileFeedService.getMediaPosts({
      loginUserId: req.user.id,
      targetUserId: Number(userId),
      page,
      limit,
    });

    res.status(200).json({
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
