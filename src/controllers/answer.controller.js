import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { AnswerService } from '../services/answer.service.js';
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
const toBool = (v) => {
  if (typeof v === 'string') return v.trim().toLowerCase() === 'true';
  return Boolean(v);
};

/**
 * @swagger
 * /api/answers/{questionId}:
 *   post:
 *     summary: 답변 등록
 *     description: 특정 질문에 대해 사용자가 답변을 작성합니다.
 *     tags:
 *       - Answers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 답변을 작성할 질문 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *             required:
 *               - content
 *           example:
 *             content: "JWT는 JSON Web Token의 약자입니다."
 *     responses:
 *       201:
 *         description: 답변 등록 성공
 *       400:
 *         description: 필수값 누락
 *       404:
 *         description: 존재하지 않는 질문
 */

/**
 * @swagger
 * /api/answers/question/{questionId}:
 *   get:
 *     summary: 질문에 대한 답변 목록 조회
 *     description: 특정 질문에 달린 모든 답변을 조회합니다.
 *     tags:
 *       - Answers
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 질문 ID
 *     responses:
 *       200:
 *         description: 답변 목록 조회 성공
 */

/**
 * @swagger
 * /api/answers/{answerId}/like:
 *   post:
 *     summary: 답변 좋아요 등록
 *     tags:
 *       - Answers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 좋아요를 누를 답변 ID
 *     responses:
 *       201:
 *         description: 좋아요 등록 성공
 *       400:
 *         description: 이미 좋아요함
 */

/**
 * @swagger
 * /api/answers/{answerId}/like:
 *   delete:
 *     summary: 답변 좋아요 취소
 *     tags:
 *       - Answers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 좋아요를 취소할 답변 ID
 *     responses:
 *       200:
 *         description: 좋아요 취소 성공
 *       404:
 *         description: 좋아요한 적 없음
 */

/**
 * @swagger
 * /api/answers/{answerId}/like/count:
 *   get:
 *     summary: 답변 좋아요 수 조회
 *     tags:
 *       - Answers
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 좋아요 수를 조회할 답변 ID
 *     responses:
 *       200:
 *         description: 좋아요 수 조회 성공
 */

/**
 * @swagger
 * /api/answers/{answerId}:
 *   delete:
 *     summary: 답변 삭제
 *     tags:
 *       - Answers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 삭제할 답변 ID
 *     responses:
 *       200:
 *         description: 답변 삭제 성공
 *       403:
 *         description: 삭제 권한 없음
 *       404:
 *         description: 존재하지 않는 답변
 */

/**
 * @swagger
 * /api/answers/{answerId}/comments:
 *   post:
 *     summary: 답변에 댓글 등록
 *     tags: [Answer Comments]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string, example: "도움됐어요!" }
 *               isAnonymous: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnvelopeSuccessComment'
 *       400:
 *         description: 잘못된 요청(AC100 등)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnvelopeFail'
 *
 *   get:
 *     summary: 답변 댓글 목록 조회 (페이징)
 *     tags: [Answer Comments]
 *     parameters:
 *       - in: path
 *         name: answerId
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
 * /api/answers/{answerId}/comments/{commentId}:
 *   delete:
 *     summary: 답변 댓글 삭제
 *     tags: [Answer Comments]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: answerId
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
 *         description: 권한 없음(AC403)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnvelopeFail'
 *       404:
 *         description: 없음(AC404)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnvelopeFail'
 */
/**
 * 답변 등록
 * POST /api/answers/:questionId
 */
router.post('/:questionId', authenticateJWT, async (req, res, next) => {
  try {
    const questionId = Number(req.params.questionId);
    const userId = req.user.id;
    const { content, isAnonymous = false } = req.body;

    if (!content?.trim()) {
      return res.status(400).json(response.fail('A100', 'content는 필수입니다.'));
    }

    const answer = await AnswerService.createAnswer({
      questionId,
      userId,
      content,
      isAnonymous: toBool(isAnonymous),
    });

    return res.status(201).json(response.success('답변이 등록되었습니다.', answer));
  } catch (err) {
    if (err?.code === 'QUESTION_NOT_FOUND' || err?.errorCode === 'Q404') {
      return res.status(404).json(response.fail('Q404', '존재하지 않는 질문입니다.'));
    }
    next(err);
  }
});

/**
 * 답변 목록 조회(질문 기준)
 * GET /api/answers/question/:questionId
 */
router.get('/question/:questionId', async (req, res, next) => {
  try {
    const questionId = Number(req.params.questionId);
    const answers = await AnswerService.getAnswersByQuestionId(questionId);
    return res.status(200).json(response.success('답변 목록 조회 성공', answers));
  } catch (err) {
    next(err);
  }
});

/**
 * 답변 좋아요 등록
 * POST /api/answers/:answerId/like
 */
router.post('/:answerId/like', authenticateJWT, async (req, res) => {
  try {
    const answerId = Number(req.params.answerId);
    const userId = req.user.id;

    const alreadyLiked = await AnswerService.hasLiked(answerId, userId);
    if (alreadyLiked) {
      return res.status(400).json(response.fail('ALREADY_LIKED', '이미 좋아요한 답변입니다.'));
    }

    const like = await AnswerService.likeAnswer(answerId, userId);
    return res.status(201).json(response.success('답변 좋아요 완료', like));
  } catch (err) {
    return res.status(500).json(response.fail('SERVER_ERROR', err.message));
  }
});

/**
 * 답변 좋아요 취소
 * DELETE /api/answers/:answerId/like
 */
router.delete('/:answerId/like', authenticateJWT, async (req, res) => {
  try {
    const answerId = Number(req.params.answerId);
    const userId = req.user.id;

    const alreadyLiked = await AnswerService.hasLiked(answerId, userId);
    if (!alreadyLiked) {
      return res.status(404).json(response.fail('LIKE_NOT_FOUND', '좋아요한 적이 없습니다.'));
    }

    await AnswerService.unlikeAnswer(answerId, userId);
    return res.status(200).json(response.success('답변 좋아요 취소 완료', null));
  } catch (err) {
    return res.status(500).json(response.fail('SERVER_ERROR', err.message));
  }
});

/**
 * 답변 좋아요 수 조회
 * GET /api/answers/:answerId/like/count
 */
router.get('/:answerId/like/count', async (req, res) => {
  try {
    const answerId = Number(req.params.answerId);
    const count = await AnswerService.getLikeCount(answerId);
    return res
      .status(200)
      .json(response.success('답변 좋아요 수 조회 완료', { answerId, likeCount: count }));
  } catch (err) {
    return res.status(500).json(response.fail('SERVER_ERROR', err.message));
  }
});

/**
 * 답변 삭제
 * DELETE /api/answers/:answerId
 * (주의: 라우터가 /api/answers 에 마운트되어 있으므로 여기서는 '/:answerId'가 맞음)
 */
router.delete('/:answerId', authenticateJWT, async (req, res, next) => {
  try {
    const answerId = Number(req.params.answerId);
    const userId = req.user.id;

    await AnswerService.deleteAnswer(answerId, userId);
    return res.status(200).json(response.success('답변 삭제 완료', null));
  } catch (err) {
    if (err?.errorCode === 'A404') return res.status(404).json(response.fail('A404', '답변을 찾을 수 없습니다.'));
    if (err?.errorCode === 'A403') return res.status(403).json(response.fail('A403', '삭제 권한이 없습니다.'));
    next(err);
  }
});

// 내 상호작용 여부 (답변)
router.get('/:answerId/me', authenticateJWT, async (req, res, next) => {
  try {
    const answerId = Number(req.params.answerId);
    const userId = req.user.id;
    const data = await InteractionService.getAnswerMyStatus(answerId, userId);
    return res.status(200).json(response.success('답변 상호작용 여부 조회 성공', data));
  } catch (err) {
    next(err);
  }
});

export default router;