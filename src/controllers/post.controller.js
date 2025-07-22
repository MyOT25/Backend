import {
  getTicketbook,
  getMonthlySummary as getMonthlySummaryService,
} from "../services/post.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import prisma from "../config/prismaClient.js";
// import prisma from "../../prisma/client.js";
import express from "express";
import {
  getPostByActorName,
  handleCreatePost,
  fetchPostList,
  handleAddComment,
  createViewingRecord,
  handleToggleLike,
  handleUpdatePost,
  handleDeletePost,
} from "../services/post.service.js";
import {
  getPostTags,
  getPostImages,
  getPostComments,
} from "../repositories/post.repositories.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import firebaseAdmin from "firebase-admin";
const { messaging } = firebaseAdmin;

//일반 게시글 등록 관련 import
import { CreatePostDTO } from "../dtos/post.dto.js";
import { createPostService } from "../services/post.service.js";

/**
 * GET /api/posts/ticketbook
 * @desc 나의 티켓북 조회
 */
/**
 * @swagger
 * /api/posts/ticketbook:
 *   get:
 *     summary: 나의 티켓북 조회
 *     description: JWT 인증을 통해 사용자의 티켓북 데이터를 조회합니다.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 조회 성공
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
 *                     message:
 *                       type: string
 *                       example: 티켓북 조회 성공
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           musical_id:
 *                             type: integer
 *                             example: 12
 *                           title:
 *                             type: string
 *                             example: 엘리자벳
 *                           poster:
 *                             type: string
 *                             example: https://example.com/poster1.jpg
 *                           watch_date:
 *                             type: string
 *                             format: date
 *                             example: 2025-05-15
 *                           theater:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: 서울 예술의 전당
 *                               region:
 *                                 type: string
 *                                 example: 서울
 */

export const getUserTicketbook = [
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const userId = req.user.id; // JWT 인증 미들웨어로부터 유저 ID 추출
    const records = await getTicketbook(userId);

    res.success({
      message: "티켓북 조회 성공",
      data: records,
    });
  }),
];

/**
 * 월별 정산판 조회
 * GET /api/posts/monthly-summary?year=YYYY&month=MM
 */
/**
 * @swagger
 * /api/posts/monthly-summary:
 *   get:
 *     summary: 월별 정산판 조회
 *     description: 지정한 연도와 월에 대한 사용자의 월별 정산 데이터를 조회합니다. JWT 인증 필요.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         required: true
 *         description: 조회할 연도 (YYYY 형식)
 *         example: 2025
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         required: true
 *         description: 조회할 월 (MM 형식)
 *         example: 06
 *     responses:
 *       200:
 *         description: 월별 정산판 조회 성공
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
 *                     message:
 *                       type: string
 *                       example: "2025년 6월 월별 정산판 조회 성공"
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             example: "관람"
 *                           total:
 *                             type: number
 *                             example: 150000
 *                           count:
 *                             type: integer
 *                             example: 3
 */

/**
 * POST /api/posts
 * @desc 관극 기록 등록
 * @access Private (JWT 필요)
 */

/**
 * @swagger
 * /api/posts/musical:
 *   post:
 *     tags:
 *       - ViewingRecord
 *     summary: 오늘의 관극 기록 등록
 *     description: 관극 기록(관람일, 좌석, 배우, 사진 등)을 등록하는 API입니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               musicalId:
 *                 type: integer
 *                 example: 1
 *               watchDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-07-12"
 *               watchTime:
 *                 type: string
 *                 example: "19:30"
 *               seat:
 *                 type: object
 *                 properties:
 *                   locationId:
 *                     type: integer
 *                     example: 1
 *                   row:
 *                     type: string
 *                     example: "A"
 *                   column:
 *                     type: integer
 *                     example: 1
 *                   seatType:
 *                     type: string
 *                     enum: [VIP, 일반석]
 *                     example: "VIP"
 *               casts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     actorId:
 *                       type: integer
 *                       example: 1
 *                     role:
 *                       type: string
 *                       example: "엘리자벳"
 *               content:
 *                 type: string
 *                 example: "인생 뮤지컬.. 감동!"
 *               rating:
 *                 type: number
 *                 format: float
 *                 example: 4.5
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: url
 *                 example:
 *                   - "https://your-bucket.s3.amazonaws.com/image1.jpg"
 *                   - "https://your-bucket.s3.amazonaws.com/image2.jpg"
 *     responses:
 *       200:
 *         description: 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "관극 기록이 성공적으로 등록되었습니다."
 *                     data:
 *                       type: object
 *                       properties:
 *                         viewingRecord:
 *                           type: integer
 *                           example: 1
 *                         userId:
 *                           type: integer
 *                           example: 1
 *                         musicalId:
 *                           type: integer
 *                           example: 1
 *                         seatId:
 *                           type: integer
 *                           example: 1
 *                         date:
 *                           type: string
 *                           format: date
 *                           example: "2025-07-12"
 *                         time:
 *                           type: string
 *                           format: time
 *                           example: "19:30"
 *                         content:
 *                           type: string
 *                           example: "인생 뮤지컬.. 감동!"
 *                         rating:
 *                           type: number
 *                           format: float
 *                           example: 4.5
 *                 error:
 *                   type: null
 */

// export const createPost = asyncHandler(async (req, res) => {
//   const userId = req.user.id; // JWT로부터 유저 ID 추출
//   const result = await createViewingRecord(userId, req.body);

//   res.success({
//     message: "관극 기록이 성공적으로 등록되었습니다.",
//     data: result,
//   });
// });

export const createPost = asyncHandler(async (req, res) => {
  const userId = req.user.id; // JWT 인증 후 user.id가 존재한다고 가정
  const createPostDto = new CreatePostDTO(req.body);

  const post = await createPostService(userId, createPostDto);

  res.status(201).json({
    resultType: "SUCCESS",
    success: {
      id: post.id,
      message: "게시글이 성공적으로 생성되었습니다.",
    },
  });
});

/**
 * 미등록 출연진 추가
 */
export const addCasting = asyncHandler(async (req, res) => {
  const { musicalId, actorId, role } = req.body;

  // 중복 검사 (같은 배우가 같은 뮤지컬+역할로 이미 등록됐는지)
  const exists = await prisma.casting.findFirst({
    where: {
      musicalId,
      actorId,
      role,
    },
  });

  if (exists) {
    return res.error({
      errorCode: "C001",
      reason: "이미 등록된 출연진입니다.",
    });
  }

  // Casting 추가
  const casting = await prisma.casting.create({
    data: {
      musicalId,
      actorId,
      role,
    },
  });

  res.success({
    message: "출연진이 성공적으로 추가되었습니다.",
    data: casting,
  });
});

export const getMonthlySummary = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      throw new Error("year와 month는 필수입니다.");
    }

    const userId = req.user?.id || 1; // 임시 userId

    // ⬇️ 수정: userId도 같이 넘김
    const data = await getMonthlySummaryService(
      userId,
      parseInt(year, 10),
      parseInt(month, 10)
    );

    res.status(200).json({
      resultType: "SUCCESS",
      error: {
        errorCode: null,
        reason: null,
        data: null,
      },
      success: {
        message: `${year}년 ${month}월 월별 정산판 조회 성공`,
        data,
      },
    });
  } catch (err) {
    next(err);
  }
};

const router = express.Router();

router.get("/filter", async (req, res) => {
  try {
    const { actorName } = req.query;
    const posts = await getPostByActorName(actorName);
    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post(
  "/",
  authenticateJWT, // JWT 인증 미들웨어 필요 시 포함
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const createPostDto = new CreatePostDTO(req.body);

    const post = await createPostService(userId, createPostDto);

    res.status(201).json({
      resultType: "SUCCESS",
      success: {
        id: post.id,
        message: "게시글이 성공적으로 생성되었습니다.",
      },
    });
  })
);

router.patch("/:postId", async (req, res) => {
  try {
    const { userId, communityId, title, content, category, tagNames, images } =
      req.body;
    const { postId } = req.params;
    await handleUpdatePost({
      postId: Number(postId),
      userId,
      communityId,
      title,
      content,
      category,
      tagNames,
      images,
    });

    res.status(200).json({
      success: true,
      message: "게시글이 성공적으로 수정되었습니다.",
      postId: Number(postId),
    });
  } catch (err) {
    res.status(500).json({
      resultType: "FAIL",
      error: {
        errorCode: "unknown",
        reason: err.message,
        data: null,
      },
      success: null,
    });
  }
});

router.delete("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    await handleDeletePost({ postId: Number(postId), userId });

    res.status(200).json({
      success: true,
      message: "게시글이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { id: communityId, category, sort } = req.query;
    const posts = await fetchPostList({
      communityId: parseInt(communityId),
      category,
      sort,
    });
    res.status(200).json({ success: true, posts });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get("/communities/:communityId/posts/:postId", async (req, res) => {
  try {
    const communityId = parseInt(req.params.communityId);
    const postId = parseInt(req.params.postId);

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        communityId: communityId,
      },
      include: {
        user: { select: { nickname: true } },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "해당 커뮤니티에 이 게시글이 없습니다.",
      });
    }

    const tags = await getPostTags(postId);
    const images = await getPostImages(postId);
    const comments = await getPostComments(postId);

    res.status(200).json({
      success: true,
      post: {
        postId: post.id,
        title: post.title,
        content: post.content,
        author: post.user.nickname,
        category: post.category,
        createdAt: post.createdAt,
        likeCount: post.likeCount,
        tags,
        images,
        comments,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/*
router.post("/:postId/comments", async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { userId, communityId, content, isAnonymous } = req.body;
    const commentId = await handleAddComment({
      postId,
      userId,
      communityId,
      content,
      isAnonymous,
    });
    res.status(201).json({
      success: true,
      message: "댓글이 성공적으로 등록되었습니다.",
      commentId,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
*/

router.post("/:postId/like", async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { userId } = req.body;

    const message = await handleToggleLike({ postId, userId });

    res.status(200).json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post("/:postId/comments", async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { userId, communityId, content, isAnonymous } = req.body;

    const commentId = await handleAddComment({
      postId,
      userId,
      communityId,
      content,
      isAnonymous,
    });

    res.status(200).json({
      success: true,
      message: "댓글이 성공적으로 등록되었습니다.",
      commentId,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
