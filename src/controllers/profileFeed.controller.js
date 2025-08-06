import express from "express";
import asyncHandler from "../middlewares/asyncHandler.js";
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
 *     summary: 특정 유저의 전체 게시글 조회
 *     tags:
 *       - ProfileFeed
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *         description: 사용자 ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: 페이지당 게시글 수
 *     responses:
 *       200:
 *         description: 게시글 목록 반환 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: SUCCESS
 *               data:
 *                 totalCount: 25
 *                 page: 1
 *                 pageSize: 10
 *                 posts:
 *                   - id: 1
 *                     content: "안녕하세요!"
 *                     createdAt: "2025-08-07T12:00:00.000Z"
 *                     commentCount: 5
 *                     likeCount: 20
 *                     repostCount: 2
 *                     bookmarkCount: 4
 *                     mediaType: "image"
 *                     hasMedia: true
 *                     isRepost: false
 *                     repostType: null
 *                     user:
 *                       id: 1
 *                       nickname: "유저1"
 *                       profileImage: "https://example.com/profile1.jpg"
 *                     postImages:
 *                       - url: "https://example.com/image1.jpg"
 *                     community:
 *                       id: 1
 *                       type: "musical"
 *                       coverImage: "https://example.com/community1.jpg"
 *                     postLikes:
 *                       - id: 101
 *                         userId: 2
 *                     postBookmarks:
 *                       - id: 201
 *                         userId: 2
 *                     repostTarget: null
 */
router.get(
  "/all",
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = getPaginationParams(req);
    const result = await profileFeedService.getAllPosts(userId, page, limit);

    res.status(200).json({
      resultType: "SUCCESS",
      data: result,
    });
  })
);

// 인용 게시글

/**
 * @swagger
 * /api/users/{userId}/profilefeed/quote:
 *   get:
 *     summary: 특정 유저의 인용 게시글만 조회
 *     tags:
 *       - ProfileFeed
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *         description: 사용자 ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: 페이지당 게시글 수
 *     responses:
 *       200:
 *         description: 인용 게시글 목록 반환 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: SUCCESS
 *               data:
 *                 totalCount: 5
 *                 page: 1
 *                 pageSize: 10
 *                 posts:
 *                   - id: 12
 *                     content: "이 글에 공감합니다!"
 *                     createdAt: "2025-08-06T11:30:00.000Z"
 *                     commentCount: 2
 *                     likeCount: 8
 *                     repostCount: 1
 *                     bookmarkCount: 3
 *                     mediaType: null
 *                     hasMedia: false
 *                     isRepost: true
 *                     repostType: "post"
 *                     user:
 *                       id: 3
 *                       nickname: "유저2"
 *                       profileImage: "https://example.com/profile3.jpg"
 *                     postImages: []
 *                     community:
 *                       id: 2
 *                       type: "actor"
 *                       coverImage: "https://example.com/community2.jpg"
 *                     postLikes: []
 *                     postBookmarks: []
 *                     repostTarget:
 *                       id: 8
 *                       content: "원본 게시글 내용"
 *                       createdAt: "2025-08-05T10:00:00.000Z"
 *                       user:
 *                         id: 4
 *                         nickname: "유저3"
 *                         profileImage: "https://example.com/profile4.jpg"
 *                       postImages:
 *                         - url: "https://example.com/image-origin.jpg"
 *                       community:
 *                         id: 3
 *                         type: "actor"
 *                         coverImage: "https://example.com/community3.jpg"
 */
router.get(
  "/quote",
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = getPaginationParams(req);
    const result = await profileFeedService.getQuotePosts(userId, page, limit);

    res.status(200).json({
      resultType: "SUCCESS",
      data: result,
    });
  })
);

// 리포스트 게시글

/**
 * @swagger
 * /api/users/{userId}/profilefeed/repost:
 *   get:
 *     summary: 특정 유저의 리포스트 게시글만 조회
 *     tags:
 *       - ProfileFeed
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *         description: 사용자 ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: 페이지당 게시글 수
 *     responses:
 *       200:
 *         description: 리포스트 게시글 목록 반환 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: SUCCESS
 *               data:
 *                 totalCount: 2
 *                 page: 1
 *                 pageSize: 10
 *                 posts:
 *                   - id: 20
 *                     content: null
 *                     createdAt: "2025-08-06T15:00:00.000Z"
 *                     commentCount: 0
 *                     likeCount: 0
 *                     repostCount: 0
 *                     bookmarkCount: 0
 *                     mediaType: null
 *                     hasMedia: false
 *                     isRepost: true
 *                     repostType: "post"
 *                     user:
 *                       id: 5
 *                       nickname: "유저4"
 *                       profileImage: "https://example.com/profile5.jpg"
 *                     postImages: []
 *                     community:
 *                       id: 4
 *                       type: "actor"
 *                       coverImage: "https://example.com/community4.jpg"
 *                     postLikes: []
 *                     postBookmarks: []
 *                     repostTarget:
 *                       id: 8
 *                       content: "원본 게시글 내용"
 *                       createdAt: "2025-08-05T10:00:00.000Z"
 *                       user:
 *                         id: 4
 *                         nickname: "유저3"
 *                         profileImage: "https://example.com/profile4.jpg"
 *                       postImages:
 *                         - url: "https://example.com/image-origin.jpg"
 *                       community:
 *                         id: 3
 *                         type: "actor"
 *                         coverImage: "https://example.com/community3.jpg"
 */
router.get(
  "/repost",
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = getPaginationParams(req);
    const result = await profileFeedService.getRepostPosts(userId, page, limit);

    res.status(200).json({
      resultType: "SUCCESS",
      data: result,
    });
  })
);

// 미디어 게시글

/**
 * @swagger
 * /api/users/{userId}/profilefeed/media:
 *   get:
 *     summary: 특정 유저의 미디어 게시글만 조회
 *     tags:
 *       - ProfileFeed
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *         description: 사용자 ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: 페이지당 게시글 수
 *     responses:
 *       200:
 *         description: 미디어 게시글 목록 반환 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: SUCCESS
 *               data:
 *                 totalCount: 4
 *                 page: 1
 *                 pageSize: 10
 *                 posts:
 *                   - id: 30
 *                     content: "사진 올려요 📸"
 *                     createdAt: "2025-08-04T17:45:00.000Z"
 *                     commentCount: 1
 *                     likeCount: 5
 *                     repostCount: 0
 *                     bookmarkCount: 2
 *                     mediaType: "image"
 *                     hasMedia: true
 *                     isRepost: false
 *                     repostType: null
 *                     user:
 *                       id: 6
 *                       nickname: "유저5"
 *                       profileImage: "https://example.com/profile6.jpg"
 *                     postImages:
 *                       - url: "https://example.com/image3.jpg"
 *                       - url: "https://example.com/image4.jpg"
 *                     community:
 *                       id: 5
 *                       type: "musical"
 *                       coverImage: "https://example.com/community5.jpg"
 *                     postLikes: []
 *                     postBookmarks: []
 *                     repostTarget: null
 */
router.get(
  "/media",
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = getPaginationParams(req);
    const result = await profileFeedService.getMediaPosts(userId, page, limit);

    res.status(200).json({
      resultType: "SUCCESS",
      data: result,
    });
  })
);

export default router;
