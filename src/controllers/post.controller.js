import {
  getTicketbook,
  getMonthlySummary as getMonthlySummaryService,
} from "../services/post.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import prisma from "../config/prismaClient.js";
// import prisma from "../../prisma/client.js";
import express from "express";
import { getPostByActorName } from "../services/post.service.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import firebaseAdmin from "firebase-admin";
const { messaging } = firebaseAdmin;
import { uploadToS3 } from "../middlewares/s3Uploader.js";

//일반 게시글 등록 import
import { CreatePostDTO } from "../dtos/post.dto.js";
import { createPostService } from "../services/post.service.js";
//재게시용 게시글 등록 import
import { CreateRepostDTO } from "../dtos/post.dto.js";
import { createRepostService } from "../services/post.service.js";
//인용 게시글 등록 import
import { CreateQuotePostDTO } from "../dtos/post.dto.js";
import { createQuotePostService } from "../services/post.service.js";
//게시글 수정 import
import { UpdatePostDTO } from "../dtos/post.dto.js";
import { updatePostService } from "../services/post.service.js";
//게시글 삭제 import
import { deletePostService } from "../services/post.service.js";
// 북마크 관련 import
import {
  addBookmarkService,
  removeBookmarkService,
} from "../services/bookmark.service.js";
// 오늘의 관극 등록 import
import { createViewingRecord } from "../services/post.service.js";
//게시글 좋아요 등록/해제 import
import { postLikeService } from "../services/post.service.js";
//게시글 좋아요 목록 조회 import
import { getPostLikedUsersService } from "../services/post.service.js";
// 전체 게시물 조회
import { getAllPostService } from "../services/post.service.js";
// 미디어 게시물 조회
import { getMediaPostsService } from "../services/post.service.js";
// 댓글 관련 import
import {
  createCommentService,
  getCommentsService,
  updateCommentService,
  deleteCommentService,
} from "../services/post.service.js";
// 재게시 관련 import
import { getRepostedUsersService } from "../services/post.service.js";
// 인용한 게시물 import
import { getQuotedPostService } from "../services/post.service.js";
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
 *     description: 관극 기록(관람일, 좌석, 배우, 사진 등)을 등록하는 API입니다. 이미지 파일은 multipart/form-data 형식으로 업로드합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *                 type: string
 *                 example: '{"locationId":1,"row":"A","column":1,"seatType":"VIP"}'
 *               casts:
 *                 type: string
 *                 example: '[{"actorId":1,"role":"루케니"},{"actorId":2,"role":"엘리자벳"}]'
 *               content:
 *                 type: string
 *                 example: "또봤다!"
 *               rating:
 *                 type: number
 *                 format: float
 *                 example: 5
 *               imageFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 여러 이미지 파일 첨부
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
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "관극 기록이 성공적으로 등록되었습니다."
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
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
 *                           example: "또봤다!"
 *                         rating:
 *                           type: number
 *                           format: float
 *                           example: 5
 *                         images:
 *                           type: array
 *                           items:
 *                             type: string
 *                             format: url
 *                           example:
 *                             - "https://bucket.s3.amazonaws.com/img1.jpg"
 *                             - "https://bucket.s3.amazonaws.com/img2.jpg"
 */

export const createViewingPost = asyncHandler(async (req, res) => {
  const userId = req.user.id; // JWT로부터 유저 ID 추출

  // ✅ multer로 업로드된 이미지 파일들
  const imageFiles = req.files; // 배열 형태

  // ✅ S3 업로드
  let imageUrls = [];

  if (imageFiles && imageFiles.length > 0) {
    imageUrls = await Promise.all(
      imageFiles.map((file) =>
        uploadToS3(file.buffer, file.originalname, file.mimetype)
      )
    );
  }

  // ✅ body에서 다른 데이터 추출
  const { musicalId, watchDate, watchTime, seat, casts, content, rating } =
    req.body;

  // ✅ JSON 문자열 데이터 파싱
  const parsedSeat = JSON.parse(seat);
  const parsedCasts = JSON.parse(casts);

  const result = await createViewingRecord(userId, {
    musicalId: parseInt(musicalId),
    watchDate,
    watchTime,
    seat: parsedSeat,
    casts: parsedCasts,
    content,
    rating: parseFloat(rating),
    imageUrls, // S3 업로드된 URL 배열
  });

  res.success({
    message: "관극 기록이 성공적으로 등록되었습니다.",
    data: result,
  });
});

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

/**
 * 일반 게시글 등록
 */

/**
 * @swagger
 * /api/communities/{communityId}/post:
 *   post:
 *     summary: 일반 게시글 등록
 *     tags:
 *       - Posts
 *     description: 사용자가 특정 커뮤니티에 일반 게시글을 등록합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 커뮤니티 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "오늘 공연 진짜 좋았어요!"
 *               postimages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: url
 *                 example:
 *                   - "https://example.com/image1.jpg"
 *               hasMedia:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: 게시글 등록 성공
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
 *                     postid:
 *                       type: integer
 *                       example: 1
 *                     content:
 *                       type: string
 *                       example: "오늘 공연 진짜 좋았어요!"
 *                     postimages:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: url
 *                       example:
 *                         - "https://example.com/image1.jpg"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     message:
 *                       type: string
 *                       example: 게시글이 성공적으로 생성되었습니다.
 */
router.post(
  "/:communityId/post",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { communityId } = req.params;
    const createPostDto = new CreatePostDTO({ ...req.body, communityId });
    const post = await createPostService(userId, createPostDto);

    res.status(201).json({
      resultType: "SUCCESS",
      success: {
        postid: post.post.id,
        content: post.post.content,
        postimages: post.postimages,
        createdAt: post.post.createdAt,
        message: "게시글이 성공적으로 생성되었습니다.",
      },
    });
  })
);

/**
 * 재게시용 게시글 등록
 */

/**
 * @swagger
 * /api/communities/{communityId}/posts/{postId}/repost:
 *   post:
 *     summary: 재게시용 게시글 등록
 *     tags:
 *       - Posts
 *     description: 특정 게시글 또는 리뷰를 재게시하는 API입니다. repostType을 통해 재게시 대상 유형(post 또는 review)을 지정할 수 있습니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 커뮤니티 ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 재게시할 원본 게시글 또는 리뷰의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repostType:
 *                 type: string
 *                 enum: [post, review]
 *                 example: post
 *                 description: 재게시 대상 타입
 *     responses:
 *       201:
 *         description: 재게시 등록 성공
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
 *                     postId:
 *                       type: integer
 *                       example: 123
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-28T12:34:56.000Z"
 *                     message:
 *                       type: string
 *                       example: "게시글이 성공적으로 생성되었습니다."
 */
router.post(
  "/:communityId/posts/:postId/repost",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { communityId, postId } = req.params;
    const createRepostDto = new CreateRepostDTO(req.body);

    const repost = await createRepostService(
      userId,
      parseInt(communityId),
      parseInt(postId),
      createRepostDto
    );

    res.status(201).json({
      resultType: "SUCCESS",
      success: {
        postId: repost.id,
        createdAt: repost.createdAt,
        message: "게시글이 성공적으로 생성되었습니다.",
      },
    });
  })
);

/**
 * 인용 게시글 등록
 */

/**
 * @swagger
 * /api/communities/{communityId}/posts/{postId}/quote:
 *   post:
 *     summary: 인용 게시글 등록
 *     tags:
 *       - Posts
 *     description: 기존 게시글 또는 리뷰를 인용하여 새로운 게시글을 등록합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 커뮤니티 ID
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 인용할 원본 게시글 또는 리뷰의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - repostType
 *               - content
 *             properties:
 *               repostType:
 *                 type: string
 *                 enum: [post, review]
 *                 example: post
 *                 description: 인용 대상의 타입
 *               content:
 *                 type: string
 *                 example: "이 장면 진짜 인상 깊었어요."
 *                 description: 인용 게시글 내용
 *               postimages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: url
 *                 example:
 *                   - "https://example.com/image1.jpg"
 *                   - "https://example.com/image2.jpg"
 *                 description: 이미지 URL 배열
 *               hasMedia:
 *                 type: boolean
 *                 example: true
 *                 description: 미디어 포함 여부
 *     responses:
 *       201:
 *         description: 인용 게시글 등록 성공
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
 *                     postId:
 *                       type: integer
 *                       example: 456
 *                     content:
 *                       type: string
 *                       example: "이 장면 진짜 인상 깊었어요."
 *                     postimages:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: url
 *                       example:
 *                         - "https://example.com/image1.jpg"
 *                         - "https://example.com/image2.jpg"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-28T13:45:00.000Z"
 *                     message:
 *                       type: string
 *                       example: "게시글이 성공적으로 생성되었습니다."
 */
router.post(
  "/:communityId/posts/:postId/quote",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { communityId, postId } = req.params;
    const dto = new CreateQuotePostDTO({ ...req.body, communityId });

    const result = await createQuotePostService(
      userId,
      parseInt(communityId),
      parseInt(postId),
      dto
    );

    return res.status(201).json({
      resultType: "SUCCESS",
      success: {
        postId: result.post.id,
        content: result.post.content,
        postimages: result.postimages,
        createdAt: result.post.createdAt,
        message: "게시글이 성공적으로 생성되었습니다.",
      },
    });
  })
);

/**
 * 게시글 수정
 */

/**
 * @swagger
 * /api/posts/{postId}:
 *   patch:
 *     summary: 게시글 수정
 *     tags:
 *       - Posts
 *     description: 게시글의 내용을 수정합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 수정할 게시글의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "수정된 게시글 내용"
 *                 description: 변경할 게시글 내용
 *               postimages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: url
 *                 example:
 *                   - "https://example.com/updated-image1.jpg"
 *                   - "https://example.com/updated-image2.jpg"
 *                 description: 수정된 이미지 URL 배열
 *     responses:
 *       200:
 *         description: 게시글 수정 성공
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
 *                     postId:
 *                       type: integer
 *                       example: 42
 *                     content:
 *                       type: string
 *                       example: "수정된 게시글 내용"
 *                     postimages:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: url
 *                       example:
 *                         - "https://example.com/updated-image1.jpg"
 *                         - "https://example.com/updated-image2.jpg"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-28T14:00:00.000Z"
 *                     message:
 *                       type: string
 *                       example: "게시글이 성공적으로 수정되었습니다."
 */
router.patch(
  "/:postId",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const postId = parseInt(req.params.postId, 10);
    const updatePostDto = new UpdatePostDTO(req.body);

    // 필수값 검증
    if (!postId || isNaN(postId)) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "INVALID_ID",
          reason: "유효한 게시글 ID가 아닙니다.",
        },
        success: null,
      });
    }

    const updatedPost = await updatePostService(postId, userId, updatePostDto);

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: {
        postId: updatedPost.id,
        content: updatedPost.content,
        postimages: updatedPost.postimages.map((img) => img.url),
        updatedAt: updatedPost.updatedAt,
        message: "게시글이 성공적으로 수정되었습니다.",
      },
    });
  })
);

/**
 * 게시글 삭제
 */

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: 게시글 삭제
 *     tags:
 *       - Posts
 *     description: 특정 게시글을 삭제합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 삭제할 게시글의 ID
 *     responses:
 *       200:
 *         description: 게시글 삭제 성공
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
 *                     postId:
 *                       type: integer
 *                       example: 42
 *                     message:
 *                       type: string
 *                       example: "게시글이 성공적으로 삭제되었습니다."
 */
router.delete(
  "/:postId",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId || isNaN(postId) || parseInt(postId) < 1) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "INVALID_ID",
          reason: "유효한 게시글 ID가 아닙니다.",
        },
        success: null,
      });
    }

    const deletedPostId = await deletePostService(parseInt(postId), userId);

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: {
        postId: deletedPostId,
        message: "게시글이 성공적으로 삭제되었습니다.",
      },
    });
  })
);

/**
 * 좋아요 등록/해제
 */

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   post:
 *     summary: 게시글 좋아요 등록/해제
 *     tags:
 *       - Posts
 *     description: 게시글에 좋아요를 등록하거나 취소합니다. 현재 상태에 따라 자동으로 토글됩니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 좋아요 토글할 게시글의 ID
 *     requestBody:
 *       description: 요청 바디는 필요하지 않습니다.
 *       required: false
 *     responses:
 *       200:
 *         description: 좋아요 상태 변경 성공
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
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     postId:
 *                       type: integer
 *                       example: 42
 *                     isLiked:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "게시글에 좋아요를 눌렀습니다."
 */
router.post(
  "/:postId/like",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user.id;

    if (!postId || isNaN(postId)) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "INVALID_ID",
          reason: "유효한 게시글 ID가 아닙니다.",
        },
        success: null,
      });
    }

    const { message, isLiked } = await postLikeService(postId, userId);

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: {
        userId,
        postId,
        isLiked,
        message,
      },
    });
  })
);

/**
 * 게시글 좋아요 목록 조회
 */

/**
 * @swagger
 * /api/posts/{postId}/likes:
 *   get:
 *     summary: 게시글 좋아요 목록 조회
 *     tags:
 *       - Posts
 *     description: 특정 게시글에 좋아요를 누른 사용자들의 목록을 조회합니다. 페이징 처리 가능합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 좋아요 목록을 조회할 게시글 ID
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 한 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 좋아요 누른 유저 목록 조회 성공
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
 *                       example: "좋아요 누른 유저 목록 조회 성공"
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: integer
 *                             example: 1
 *                           nickname:
 *                             type: string
 *                             example: "홍길동"
 *                           profileImage:
 *                             type: string
 *                             format: url
 *                             example: "https://example.com/avatar.jpg"
 *                     total:
 *                       type: integer
 *                       example: 23
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 */
router.get(
  "/:postId/likes",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    if (isNaN(postId)) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "INVALID_ID",
          reason: "유효한 게시글 ID가 아닙니다.",
        },
        success: null,
      });
    }

    const result = await getPostLikedUsersService(postId, page, limit);

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: {
        message: "좋아요 누른 유저 목록 조회 성공",
        ...result,
      },
    });
  })
);

// 전체 게시글 조회

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: 전체 게시글 조회
 *     tags:
 *       - Posts
 *     description: 모든 사용자의 게시글을 조회합니다. JWT 인증이 필요합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: 전체 게시글 조회 성공
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       postId:
 *                         type: integer
 *                         example: 1
 *                       musicalId:
 *                         type: integer
 *                         example: 12
 *                       musicalTitle:
 *                         type: string
 *                         example: 엘리자벳
 *                       watchDate:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-21T00:00:00.000Z"
 *                       watchTime:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-21T14:00:00.000Z"
 *                       seat:
 *                         type: object
 *                         properties:
 *                           locationId:
 *                             type: integer
 *                             example: 101
 *                           row:
 *                             type: string
 *                             example: B
 *                           column:
 *                             type: integer
 *                             example: 7
 *                           seatType:
 *                             type: string
 *                             example: VIP
 *                       content:
 *                         type: string
 *                         example: 공연 너무 좋았어요! #엘리자벳 #뮤지컬감상
 *                       imageUrls:
 *                         type: array
 *                         items:
 *                           type: string
 *                           format: url
 *                         example:
 *                           - "https://s3.amazonaws.com/your-bucket/image1.jpg"
 *                           - "https://s3.amazonaws.com/your-bucket/image2.jpg"
 */
router.get(
  "/",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const posts = await getAllPostService.getAllPosts();

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: posts,
    });
  })
);

// 미디어 게시글만 조회

/**
 * @swagger
 * /api/posts/media:
 *   get:
 *     summary: 미디어 게시글 조회
 *     tags:
 *       - Posts
 *     description: 이미지나 영상 등 미디어가 포함된 게시글만 조회합니다. JWT 인증이 필요합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 미디어 게시글 조회 성공
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 12
 *                       title:
 *                         type: string
 *                         example: 뮤지컬 하이라이트 영상 공유!
 *                       content:
 *                         type: string
 *                         example: 하이라이트 영상 링크 남깁니다 😊
 *                       hasMedia:
 *                         type: boolean
 *                         example: true
 *                       mediaUrl:
 *                         type: string
 *                         format: url
 *                         example: https://example-bucket.s3.amazonaws.com/media123.mp4
 *                       userId:
 *                         type: integer
 *                         example: 3
 *                       communityId:
 *                         type: integer
 *                         example: 1
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-23T11:32:45.123Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-23T11:32:45.123Z"
 */
router.get(
  "/media",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const posts = await getMediaPostsService();

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: posts,
    });
  })
);

// 댓글 등록

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: 댓글 등록
 *     tags:
 *       - Comments
 *     description: 특정 게시글에 댓글을 작성합니다. JWT 인증이 필요합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 댓글을 작성할 게시글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: 좋은 글이네요!
 *     responses:
 *       201:
 *         description: 댓글 등록 성공
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
 *                     id:
 *                       type: integer
 *                       example: 3
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     postId:
 *                       type: integer
 *                       example: 2
 *                     content:
 *                       type: string
 *                       example: 좋은 글이네요!
 */
router.post(
  "/:postId/comments",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await createCommentService(userId, Number(postId), content);

    return res.status(201).json({
      resultType: "SUCCESS",
      error: null,
      success: comment,
    });
  })
);

// 댓글 목록 조회

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: 댓글 목록 조회
 *     tags:
 *       - Comments
 *     description: 특정 게시글에 작성된 모든 댓글을 조회합니다.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 댓글을 조회할 게시글 ID
 *     responses:
 *       200:
 *         description: 댓글 목록 조회 성공
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       content:
 *                         type: string
 *                         example: 첫 댓글!
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 2
 *                           nickname:
 *                             type: string
 *                             example: 우강식
 */
router.get(
  "/:postId/comments",
  asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const comments = await getCommentsService(Number(postId));

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: comments,
    });
  })
);

// 댓글 수정

/**
 * @swagger
 * /api/posts/{postId}/comments/{commentId}:
 *   patch:
 *     summary: 댓글 수정
 *     tags:
 *       - Comments
 *     description: 특정 게시글에 작성된 댓글을 수정합니다. JWT 인증이 필요합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시글 ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 수정할 댓글의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: 수정된 댓글
 *     responses:
 *       200:
 *         description: 댓글 수정 성공
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
 *                     id:
 *                       type: integer
 *                       example: 3
 *                     postId:
 *                       type: integer
 *                       example: 2
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     content:
 *                       type: string
 *                       example: 수정된 댓글
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-28T15:12:34.000Z"
 */
router.patch(
  "/:postId/comments/:commentId",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const updated = await updateCommentService(
      userId,
      Number(commentId),
      content
    );

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: updated,
    });
  })
);

// 댓글 삭제

/**
 * @swagger
 * /api/posts/{postId}/comments/{commentId}:
 *   delete:
 *     summary: 댓글 삭제
 *     tags:
 *       - Comments
 *     description: 특정 게시글의 댓글을 삭제합니다. JWT 인증이 필요합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시글 ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 삭제할 댓글의 ID
 *     responses:
 *       200:
 *         description: 댓글 삭제 성공
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
 *                   type: string
 *                   example: 댓글 삭제 완료
 */
router.delete(
  "/:postId/comments/:commentId",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    await deleteCommentService(userId, Number(commentId));

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: "댓글 삭제 완료",
    });
  })
);

// 북마크 등록

/**
 * @swagger
 * /api/posts/{postId}/bookmarks:
 *   post:
 *     summary: 북마크 등록
 *     tags:
 *       - Bookmarks
 *     description: 특정 게시글을 북마크합니다. JWT 인증이 필요합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 북마크할 게시글 ID
 *     responses:
 *       201:
 *         description: 북마크 등록 성공
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
 *                     userId:
 *                       type: integer
 *                       example: 3
 *                     postId:
 *                       type: integer
 *                       example: 12
 *                     id:
 *                       type: integer
 *                       example: 47
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-23T15:12:43.001Z"
 */
router.post(
  "/:postId/bookmarks",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { postId } = req.params;

    await addBookmarkService(userId, Number(postId));

    return res.status(201).json({
      resultType: "SUCCESS",
      error: null,
      success: "북마크 등록 완료",
    });
  })
);

// 북마크 해제

/**
 * @swagger
 * /api/posts/{postId}/bookmarks:
 *   delete:
 *     summary: 북마크 해제
 *     tags:
 *       - Bookmarks
 *     description: 특정 게시글의 북마크를 해제합니다. JWT 인증이 필요합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 북마크를 해제할 게시글 ID
 *     responses:
 *       200:
 *         description: 북마크 해제 성공
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
 *                   type: string
 *                   example: 북마크 해제 완료
 */
router.delete(
  "/:postId/bookmarks",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { postId } = req.params;

    await removeBookmarkService(userId, Number(postId));

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: "북마크 해제 완료",
    });
  })
);

//재게시한 유저 목록

/**
 * @swagger
 * /api/posts/{postId}/reposted-users:
 *   get:
 *     summary: 재게시한 유저 목록 조회
 *     tags:
 *       - Posts
 *     description: 특정 게시글을 재게시한 사용자 목록을 조회합니다. JWT 인증이 필요합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 재게시한 유저 목록을 조회할 게시글 ID
 *     responses:
 *       200:
 *         description: 재게시한 유저 목록 조회 성공
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 3
 *                       nickname:
 *                         type: string
 *                         example: 뮤지컬팬
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: user3@example.com
 */
router.get(
  "/:postId/reposted-users",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const users = await getRepostedUsersService(Number(postId));

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: users,
    });
  })
);

//인용한 게시글 목록

/**
 * @swagger
 * /api/posts/{postId}/quoted:
 *   get:
 *     summary: 인용한 게시글 목록 조회
 *     tags:
 *       - Posts
 *     description: 특정 게시글을 인용한 게시글 목록을 조회합니다.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 인용 대상이 된 원본 게시글 ID
 *     responses:
 *       200:
 *         description: 인용한 게시글 목록 조회 성공
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       content:
 *                         type: string
 *                         example: "이번 공연 진짜 감동이었어요!"
 *                       media:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                               format: url
 *                               example: "https://cdn.s3/post-123.jpg"
 *                         example:
 *                           - url: "https://cdn.s3/post-123.jpg"
 */
router.get(
  "/:postId/quoted",
  asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const quotedPost = await getQuotedPostService(Number(postId));

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: quotedPost,
    });
  })
);

export default router;
