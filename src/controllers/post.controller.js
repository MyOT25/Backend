import {
  getTicketbook,
  getMonthlySummary as getMonthlySummaryService,
} from '../services/post.service.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import prisma from '../config/prismaClient.js';
// import prisma from "../../prisma/client.js";
import express from 'express';
import { getPostByActorName } from '../services/post.service.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import firebaseAdmin from 'firebase-admin';
const { messaging } = firebaseAdmin;
import { uploadToS3 } from '../middlewares/s3Uploader.js';

//일반 게시글 등록 import
import { CreatePostDTO } from '../dtos/post.dto.js';
import { createPostService } from '../services/post.service.js';
//재게시용 게시글 등록 import
import { CreateRepostDTO } from '../dtos/post.dto.js';
import { createRepostService } from '../services/post.service.js';
//인용 게시글 등록 import
import { CreateQuotePostDTO } from '../dtos/post.dto.js';
import { createQuotePostService } from '../services/post.service.js';
//게시글 수정 import
import { UpdatePostDTO } from '../dtos/post.dto.js';
import { updatePostService } from '../services/post.service.js';
//게시글 삭제 import
import { deletePostService } from '../services/post.service.js';
// 북마크 관련 import
import { addBookmarkService, removeBookmarkService } from '../services/bookmark.service.js';

// 오늘의 관극 등록 import
import { createViewingRecord } from '../services/post.service.js';
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
      message: '티켓북 조회 성공',
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
      imageFiles.map((file) => uploadToS3(file.buffer, file.originalname, file.mimetype))
    );
  }

  // ✅ body에서 다른 데이터 추출
  const { musicalId, watchDate, watchTime, seat, casts, content, rating } = req.body;

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
    message: '관극 기록이 성공적으로 등록되었습니다.',
    data: result,
  });
});

export const createPost = asyncHandler(async (req, res) => {
  const userId = req.user.id; // JWT 인증 후 user.id가 존재한다고 가정
  const createPostDto = new CreatePostDTO(req.body);

  const post = await createPostService(userId, createPostDto);

  res.status(201).json({
    resultType: 'SUCCESS',
    success: {
      id: post.id,
      message: '게시글이 성공적으로 생성되었습니다.',
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
      errorCode: 'C001',
      reason: '이미 등록된 출연진입니다.',
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
    message: '출연진이 성공적으로 추가되었습니다.',
    data: casting,
  });
});

export const getMonthlySummary = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      throw new Error('year와 month는 필수입니다.');
    }

    const userId = req.user?.id || 1; // 임시 userId

    // ⬇️ 수정: userId도 같이 넘김
    const data = await getMonthlySummaryService(userId, parseInt(year, 10), parseInt(month, 10));

    res.status(200).json({
      resultType: 'SUCCESS',
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

router.get('/filter', async (req, res) => {
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
router.post(
  '/:communityId/post',
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { communityId } = req.params;
    const createPostDto = new CreatePostDTO({ ...req.body, communityId });
    const post = await createPostService(userId, createPostDto);

    res.status(201).json({
      resultType: 'SUCCESS',
      success: {
        postid: post.post.id,
        content: post.post.content,
        postimages: post.postimages,
        createdAt: post.post.createdAt,
        message: '게시글이 성공적으로 생성되었습니다.',
      },
    });
  })
);

/**
 * 재게시용 게시글 등록
 */
router.post(
  '/:communityId/posts/:postId/repost',
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
      resultType: 'SUCCESS',
      success: {
        postId: repost.id,
        createdAt: repost.createdAt,
        message: '게시글이 성공적으로 생성되었습니다.',
      },
    });
  })
);

/**
 * 인용 게시글 등록
 */
router.post(
  '/:communityId/posts/:postId/quote',
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
      resultType: 'SUCCESS',
      success: {
        postId: result.post.id,
        content: result.post.content,
        postimages: result.postimages,
        createdAt: result.post.createdAt,
        message: '게시글이 성공적으로 생성되었습니다.',
      },
    });
  })
);

/**
 * 게시글 수정
 */
router.patch(
  '/:postId',
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const postId = parseInt(req.params.postId, 10);
    const updatePostDto = new UpdatePostDTO(req.body);

    // 필수값 검증
    if (!postId || isNaN(postId)) {
      return res.status(400).json({
        resultType: 'FAIL',
        error: {
          errorCode: 'INVALID_ID',
          reason: '유효한 게시글 ID가 아닙니다.',
        },
        success: null,
      });
    }

    const updatedPost = await updatePostService(postId, userId, updatePostDto);

    return res.status(200).json({
      resultType: 'SUCCESS',
      error: null,
      success: {
        postId: updatedPost.id,
        content: updatedPost.content,
        postimages: updatedPost.postimages.map((img) => img.url),
        updatedAt: updatedPost.updatedAt,
        message: '게시글이 성공적으로 수정되었습니다.',
      },
    });
  })
);

/**
 * 게시글 삭제
 */
router.delete(
  '/:postId',
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId || isNaN(postId) || parseInt(postId) < 1) {
      return res.status(400).json({
        resultType: 'FAIL',
        error: {
          errorCode: 'INVALID_ID',
          reason: '유효한 게시글 ID가 아닙니다.',
        },
        success: null,
      });
    }

    const deletedPostId = await deletePostService(parseInt(postId), userId);

    return res.status(200).json({
      resultType: 'SUCCESS',
      error: null,
      success: {
        postId: deletedPostId,
        message: '게시글이 성공적으로 삭제되었습니다.',
      },
    });
  })
);

// 북마크 등록
router.post(
  '/:postId/bookmarks',
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { postId } = req.params;

    await addBookmarkService(userId, Number(postId));

    return res.status(201).json({
      resultType: 'SUCCESS',
      error: null,
      success: '북마크 등록 완료',
    });
  })
);

// 북마크 해제
router.delete(
  '/:postId/bookmarks',
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { postId } = req.params;

    await removeBookmarkService(userId, Number(postId));

    return res.status(200).json({
      resultType: 'SUCCESS',
      error: null,
      success: '북마크 해제 완료',
    });
  })
);

export default router;
