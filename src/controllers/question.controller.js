// 수정된 질문 컨트롤러 예시 (컨트롤러/서비스 구조 분리)
import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

import { QuestionService } from '../services/question.service.js';
import { s3Uploader, uploadToS3 } from '../middlewares/s3Uploader.js';
import { CommentService } from '../services/qcomment.service.js';

import { InteractionService } from '../services/qinteraction.service.js';
const router = express.Router();

// 응답 포맷 유틸
const response = {
  success: (message, data = null) => ({
    resultType: 'SUCCESS',
    error: null,
    success: { message, data },
  }),
  fail: (code, reason, data = null) => ({
    resultType: 'FAIL',
    error: { errorCode: code, reason, data },
    success: null,
  }),
};

// 문자열/불리언 모두 처리
const toBoolean = (v) => {
  if (typeof v === 'string') return v.trim().toLowerCase() === 'true';
  return Boolean(v);
};
/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: 질문 등록 (이미지 업로드 포함)
 *     description: 사용자가 새로운 질문을 등록합니다. 최대 5개의 이미지를 첨부할 수 있습니다.
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 질문 제목
 *               content:
 *                 type: string
 *                 description: 질문 내용
 *               tagIds:
 *                 type: string
 *                 description: '태그 ID 배열 (JSON 문자열로 보내야 함, 예: "[1,2]")'
 *               imageFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 첨부 이미지 파일들 (최대 5개)
 *             required:
 *               - title
 *               - content
 *               - tagIds
 *     responses:
 *       201:
 *         description: 질문 등록 성공
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
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         title:
 *                           type: string
 *                         content:
 *                           type: string
 *                         imageUrls:
 *                           type: array
 *                           items:
 *                             type: string
 *                         tagList:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             username:
 *                               type: string
 *                             profileImage:
 *                               type: string
 *                               nullable: true
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 */



/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: 질문 목록 조회
 *     tags:
 *       - Questions
 *     responses:
 *       200:
 *         description: 질문 목록을 성공적으로 불러옴
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
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           content:
 *                             type: string
 *                           imageUrl:
 *                             type: string
 *                             nullable: true
 *                           tagList:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 name:
 *                                   type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               username:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *                                 nullable: true
 */

/**
 * @swagger
 * /api/questions/{questionId}:
 *   get:
 *     summary: 질문 상세 조회
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 조회할 질문 ID
 *     responses:
 *       200:
 *         description: 질문 상세 조회 성공
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
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         title:
 *                           type: string
 *                         content:
 *                           type: string
 *                         imageUrls:
 *                           type: array
 *                           items:
 *                             type: string
 *                         tagList:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             username:
 *                               type: string
 *                             profileImage:
 *                               type: string
 *                               nullable: true
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         answers:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               content:
 *                                 type: string
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                               user:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                   username:
 *                                     type: string
 *       404:
 *         description: 질문이 존재하지 않음
 */

/**
 * @swagger
 * /api/questions/{questionId}/like:
 *   post:
 *     summary: 질문 좋아요 등록
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 좋아요할 질문 ID
 *     responses:
 *       201:
 *         description: 좋아요 등록 성공
 *       400:
 *         description: 이미 좋아요함
 */

/**
 * @swagger
 * /api/questions/{questionId}/like:
 *   delete:
 *     summary: 질문 좋아요 취소
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 좋아요를 취소할 질문 ID
 *     responses:
 *       200:
 *         description: 좋아요 취소 성공
 *       404:
 *         description: 좋아요한 적 없음
 */

/**
 * @swagger
 * /api/questions/{questionId}/like/count:
 *   get:
 *     summary: 질문 좋아요 수 조회
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 좋아요 수를 조회할 질문 ID
 *     responses:
 *       200:
 *         description: 좋아요 수 조회 성공
 */

/**
 * @swagger
 * /api/questions/{questionId}:
 *   delete:
 *     summary: 질문 삭제
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 삭제할 질문 ID
 *     responses:
 *       200:
 *         description: 질문 삭제 성공
 *       403:
 *         description: 삭제 권한 없음
 *       404:
 *         description: 존재하지 않는 질문
 */


/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     CommentUser:
 *       type: object
 *       properties:
 *         id: { type: integer, nullable: true, example: null }
 *         username: { type: string, example: "익명" }
 *         profileImage: { type: string, nullable: true, example: null }
 *     Comment:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 101 }
 *         content: { type: string, example: "추가 정보 감사합니다!" }
 *         isAnonymous: { type: boolean, example: false }
 *         createdAt: { type: string, format: date-time }
 *         user:
 *           $ref: '#/components/schemas/CommentUser'
 *     PagedComments:
 *       type: object
 *       properties:
 *         page: { type: integer, example: 1 }
 *         size: { type: integer, example: 20 }
 *         total: { type: integer, example: 57 }
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *     EnvelopeSuccessComment:
 *       type: object
 *       properties:
 *         resultType: { type: string, example: "SUCCESS" }
 *         error: { type: object, nullable: true, example: null }
 *         success:
 *           type: object
 *           properties:
 *             message: { type: string, example: "댓글이 등록되었습니다." }
 *             data:
 *               $ref: '#/components/schemas/Comment'
 *     EnvelopeSuccessPagedComments:
 *       type: object
 *       properties:
 *         resultType: { type: string, example: "SUCCESS" }
 *         error: { type: object, nullable: true, example: null }
 *         success:
 *           type: object
 *           properties:
 *             message: { type: string, example: "댓글 목록을 불러왔습니다." }
 *             data:
 *               $ref: '#/components/schemas/PagedComments'
 *     EnvelopeSuccessMessage:
 *       type: object
 *       properties:
 *         resultType: { type: string, example: "SUCCESS" }
 *         error: { type: object, nullable: true, example: null }
 *         success:
 *           type: object
 *           properties:
 *             message: { type: string, example: "댓글 삭제 완료" }
 *             data: { type: object, nullable: true, example: null }
 *     EnvelopeFail:
 *       type: object
 *       properties:
 *         resultType: { type: string, example: "FAIL" }
 *         error:
 *           type: object
 *           properties:
 *             errorCode: { type: string, example: "QC404" }
 *             reason: { type: string, example: "댓글을 찾을 수 없습니다." }
 *             data: { type: object, nullable: true, example: null }
 *         success: { type: object, nullable: true, example: null }
 */

/**
 * @swagger
 * /api/questions/{questionId}/comments:
 *   post:
 *     summary: 질문에 댓글 등록
 *     tags: [Question Comments]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string, example: "같은 생각이에요!" }
 *               isAnonymous: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnvelopeSuccessComment'
 *       400:
 *         description: 잘못된 요청(QC100 등)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnvelopeFail'
 *
 *   get:
 *     summary: 질문 댓글 목록 조회 (페이징)
 *     tags: [Question Comments]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: size
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnvelopeSuccessPagedComments'
 */
 
/**
 * @swagger
 * /api/questions/{questionId}/comments/{commentId}:
 *   delete:
 *     summary: 질문 댓글 삭제
 *     tags: [Question Comments]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnvelopeSuccessMessage'
 *       403:
 *         description: 권한 없음(QC403)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnvelopeFail'
 *       404:
 *         description: 없음(QC404)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnvelopeFail'
 */


/**
 * 질문 등록 API
 */
router.post(
  '/',
  authenticateJWT,
  s3Uploader({ maxSizeMB: 5 }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { title, content, tagIds, isAnonymous } = req.body;

      // tagIds 파싱 (문자열 JSON 허용)
      let parsedTagIds;
      try {
        parsedTagIds = JSON.parse(tagIds);
      } catch {
        return res
          .status(400)
          .json(response.fail('Q101', 'tagIds는 JSON 배열 문자열이어야 합니다.'));
      }
      if (!title || !content || !Array.isArray(parsedTagIds)) {
        return res
          .status(400)
          .json(response.fail('Q100', 'title, content, tagIds는 모두 필수입니다.'));
      }

      // S3 업로드
      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        const uploads = await Promise.all(
          req.files.map((file) =>
            uploadToS3(file.buffer, file.originalname, file.mimetype)
          )
        );
        imageUrls = uploads;
      }

      const result = await QuestionService.registerQuestion(
        userId,
        title,
        content,
        parsedTagIds,
        imageUrls,
        toBoolean(isAnonymous) // ✅ 익명 여부 전달
      );

      // 서비스에서 이미 마스킹된 형태로 반환됨
      return res
        .status(201)
        .json(response.success('질문이 등록되었습니다.', result));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 질문 목록 조회
 * - 서비스 결과 그대로 전달 (isAnonymous/마스킹 반영)
 */
router.get('/', async (req, res, next) => {
  try {
    const questions = await QuestionService.getQuestionList();
    return res
      .status(200)
      .json(response.success('질문 목록을 불러왔습니다.', questions));
  } catch (err) {
    next(err);
  }
});

/**
 * 질문 상세 조회
 * - 서비스 결과 그대로 전달 (answers 포함, isAnonymous/마스킹 반영)
 */
router.get('/:questionId', async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const result = await QuestionService.getQuestionDetail(Number(questionId));
    if (!result) {
      return res
        .status(404)
        .json(response.fail('Q404', '해당 질문이 존재하지 않습니다.'));
    }
    return res
      .status(200)
      .json(response.success('질문 상세 정보를 불러왔습니다.', result));
  } catch (err) {
    next(err);
  }
});

/**
 * 질문 좋아요
 */
router.post('/:questionId/like', authenticateJWT, async (req, res) => {
  const userId = req.user.id;
  const questionId = Number(req.params.questionId);
  try {
    const result = await QuestionService.likeQuestion(questionId, userId);
    if (!result) {
      return res
        .status(400)
        .json(response.fail('ALREADY_LIKED', '이미 좋아요한 질문입니다.'));
    }
    return res
      .status(201)
      .json(response.success('질문 좋아요 완료', result));
  } catch (err) {
    return res.status(500).json(response.fail('SERVER_ERROR', err.message));
  }
});

router.delete('/:questionId/like', authenticateJWT, async (req, res) => {
  const userId = req.user.id;
  const questionId = Number(req.params.questionId);
  try {
    const result = await QuestionService.unlikeQuestion(questionId, userId);
    if (!result) {
      return res
        .status(404)
        .json(response.fail('LIKE_NOT_FOUND', '좋아요한 적이 없습니다.'));
    }
    return res.status(200).json(response.success('좋아요 취소 완료'));
  } catch (err) {
    return res.status(500).json(response.fail('SERVER_ERROR', err.message));
  }
});

router.delete('/:questionId', authenticateJWT, async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;

    await QuestionService.deleteQuestion(Number(questionId), userId);
    return res.status(200).json(response.success('질문 삭제 완료'));
  } catch (err) {
    next(err);
  }
});

// 댓글 등록
router.post('/:questionId/comments', authenticateJWT, async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;
    const { content, isAnonymous } = req.body;

    const result = await CommentService.addQuestionComment(
      Number(questionId),
      userId,
      content,
      String(isAnonymous).toLowerCase() === 'true'
    );

    return res.status(201).json(response.success('댓글이 등록되었습니다.', result));
  } catch (err) {
    if (err?.errorCode) return res.status(400).json(response.fail(err.errorCode, err.reason));
    next(err);
  }
});

// 댓글 목록
router.get('/:questionId/comments', async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 20);

    const result = await CommentService.listQuestionComments(Number(questionId), { page, size });
    return res.status(200).json(response.success('댓글 목록을 불러왔습니다.', result));
  } catch (err) {
    next(err);
  }
});

// 댓글 삭제
router.delete('/:questionId/comments/:commentId', authenticateJWT, async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    await CommentService.removeQuestionComment(Number(commentId), userId, isAdmin);
    return res.status(200).json(response.success('댓글 삭제 완료'));
  } catch (err) {
    if (err?.errorCode === 'QC404') return res.status(404).json(response.fail(err.errorCode, err.reason));
    if (err?.errorCode === 'QC403') return res.status(403).json(response.fail(err.errorCode, err.reason));
    next(err);
  }
});

// 내 상호작용 여부 (질문)
router.get('/:questionId/me', authenticateJWT, async (req, res, next) => {
  try {
    const questionId = Number(req.params.questionId);
    const userId = req.user.id;
    const data = await InteractionService.getQuestionMyStatus(questionId, userId);
    return res.status(200).json(response.success('질문 상호작용 여부 조회 성공', data));
  } catch (err) {
    next(err);
  }
});

export default router;
