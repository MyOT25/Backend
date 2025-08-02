import express from "express";
import asyncHandler from "../middlewares/asyncHandler.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import followService from "../services/user.service.js";

const router = express.Router();

/**
 * @swagger
 * /api/users/{userId}/follow:
 *   post:
 *     summary: 팔로우
 *     tags:
 *       - Follow
 *     description: 특정 유저를 팔로우합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 팔로우할 대상 유저의 ID
 *     responses:
 *       200:
 *         description: 팔로우 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 success:
 *                   type: object
 *                   properties:
 *                     followerId:
 *                       type: integer
 *                       example: 1
 *                     followingId:
 *                       type: integer
 *                       example: 2
 *                     message:
 *                       type: string
 *                       example: "팔로우 성공"
 */
router.post(
  "/:userId/follow",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.userId, 10);

    if (!followingId || isNaN(followingId)) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "INVALID_ID",
          reason: "유효한 유저 ID가 아닙니다.",
        },
        success: null,
      });
    }

    if (followerId === followingId) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "F001",
          reason: "자기 자신을 팔로우할 수 없습니다.",
        },
        success: null,
      });
    }

    await followService.followUser(followerId, followingId);

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: {
        followerId,
        followingId,
        message: "팔로우 성공",
      },
    });
  })
);

/**
 * @swagger
 * /api/users/{userId}/follow:
 *   delete:
 *     summary: 언팔로우
 *     tags:
 *       - Follow
 *     description: 특정 유저 팔로우를 취소합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 언팔로우할 대상 유저의 ID
 *     responses:
 *       200:
 *         description: 언팔로우 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 success:
 *                   type: object
 *                   properties:
 *                     followerId:
 *                       type: integer
 *                       example: 1
 *                     followingId:
 *                       type: integer
 *                       example: 2
 *                     message:
 *                       type: string
 *                       example: "언팔로우 성공"
 */
router.delete(
  "/:userId/follow",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.userId, 10);

    if (!followingId || isNaN(followingId)) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "INVALID_ID",
          reason: "유효한 유저 ID가 아닙니다.",
        },
        success: null,
      });
    }

    await followService.unfollowUser(followerId, followingId);

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: {
        followerId,
        followingId,
        message: "언팔로우 성공",
      },
    });
  })
);

/**
 * @swagger
 * /api/users/{userId}/followers:
 *   get:
 *     summary: 팔로워 목록 조회
 *     tags:
 *       - Follow
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 팔로워 목록을 조회할 유저 ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: 한 페이지에 보여줄 항목 수
 *     responses:
 *       200:
 *         description: 팔로워 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 success:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 23
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     followers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: integer
 *                             example: 5
 *                           nickname:
 *                             type: string
 *                             example: followerNickname
 *                           profileImage:
 *                             type: string
 *                             example: "https://example.com/image.jpg"
 *                           bio:
 *                             type: string
 *                             example: "소개글입니다."
 */
router.get(
  "/:userId/followers",
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "INVALID_ID",
          reason: "유효한 유저 ID가 아닙니다.",
        },
        success: null,
      });
    }

    const { data, total } = await followService.getFollowersList(
      userId,
      page,
      limit
    );

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: {
        total,
        page,
        limit,
        followers: data.map((f) => ({
          userId: f.follower.id,
          nickname: f.follower.nickname,
          profileImage: f.follower.profileImage,
          bio: f.follower.bio,
        })),
      },
    });
  })
);

/**
 * @swagger
 * /api/users/{userId}/followings:
 *   get:
 *     summary: 팔로잉 목록 조회
 *     tags:
 *       - Follow
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 팔로잉 목록을 조회할 유저 ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: 한 페이지에 보여줄 항목 수
 *     responses:
 *       200:
 *         description: 팔로잉 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 success:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     followings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: integer
 *                             example: 7
 *                           nickname:
 *                             type: string
 *                             example: followingNickname
 *                           profileImage:
 *                             type: string
 *                             example: "https://example.com/image.jpg"
 *                           bio:
 *                             type: string
 *                             example: "소개글입니다."
 */
router.get(
  "/:userId/followings",
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "INVALID_ID",
          reason: "유효한 유저 ID가 아닙니다.",
        },
        success: null,
      });
    }

    const { data, total } = await followService.getFollowingsList(
      userId,
      page,
      limit
    );

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: {
        total,
        page,
        limit,
        followings: data.map((f) => ({
          userId: f.following.id,
          nickname: f.following.nickname,
          profileImage: f.following.profileImage,
          bio: f.following.bio,
        })),
      },
    });
  })
);

/**
 * @swagger
 * /api/users/{userId}/followCount:
 *   get:
 *     summary: 팔로워 및 팔로잉 수 조회
 *     tags:
 *       - Follow
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 팔로워 및 팔로잉 수를 조회할 유저 ID
 *     responses:
 *       200:
 *         description: 팔로워 및 팔로잉 수 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 followerCount:
 *                   type: integer
 *                   example: 10
 *                 followingCount:
 *                   type: integer
 *                   example: 5
 */
router.get(
  "/:userId/followCount",
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "INVALID_ID",
          reason: "유효한 유저 ID가 아닙니다.",
        },
        success: null,
      });
    }

    const counts = await followService.getFollowCount(userId);

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: counts,
    });
  })
);

export default router;
