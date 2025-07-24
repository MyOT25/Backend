import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { AnswerService } from '../services/answer.service.js';

const router = express.Router();

// ✅ 공통 응답 포맷 유틸
const successResponse = (message, data = null) => ({
  resultType: 'SUCCESS',
  error: null,
  success: { message, data },
});

const failResponse = (code, reason, data = null) => ({
  resultType: 'FAIL',
  error: { errorCode: code, reason, data },
  success: null,
});

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
 * /api/answers/answers/{answerId}:
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
 * 답변 등록
 * POST /api/answers/:questionId
 */
router.post('/:questionId', authenticateJWT, async (req, res, next) => {
  const { questionId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  try {
    if (!content) {
      return res.status(400).json(failResponse('A100', 'content는 필수입니다.'));
    }

    const answer = await AnswerService.createAnswer({ questionId: Number(questionId), userId, content });
    return res.status(201).json(successResponse('답변이 등록되었습니다.', answer));
  } catch (err) {
    if (err.code === 'QUESTION_NOT_FOUND') {
      return res.status(404).json(failResponse('Q404', '존재하지 않는 질문입니다.'));
    }
    next(err);
  }
});

// GET /api/questions/:questionId/answers
router.get('/question/:questionId', async (req, res, next) => {
  const questionId = Number(req.params.questionId);
  try {
    const answers = await AnswerService.getAnswersByQuestionId(questionId);
    return res.status(200).json(successResponse('답변 목록 조회 성공', answers));
  } catch (err) {
    next(err);
  }
});

/**
 * 답변 좋아요 등록
 * POST /api/answers/:answerId/like
 */
router.post('/:answerId/like', authenticateJWT, async (req, res) => {
  const userId = req.user.id;
  const answerId = Number(req.params.answerId);

  try {
    const alreadyLiked = await AnswerService.hasLiked(answerId, userId);
    if (alreadyLiked) {
      return res.status(400).json(failResponse('ALREADY_LIKED', '이미 좋아요한 답변입니다.'));
    }

    const like = await AnswerService.likeAnswer(answerId, userId);
    return res.status(201).json(successResponse('답변 좋아요 완료', like));
  } catch (err) {
    return res.status(500).json(failResponse('SERVER_ERROR', err.message));
  }
});

/**
 * 답변 좋아요 취소
 * DELETE /api/answers/:answerId/like
 */
router.delete('/:answerId/like', authenticateJWT, async (req, res) => {
  const userId = req.user.id;
  const answerId = Number(req.params.answerId);

  try {
    const alreadyLiked = await AnswerService.hasLiked(answerId, userId);
    if (!alreadyLiked) {
      return res.status(404).json(failResponse('LIKE_NOT_FOUND', '좋아요한 적이 없습니다.'));
    }

    await AnswerService.unlikeAnswer(answerId, userId);
    return res.status(200).json(successResponse('답변 좋아요 취소 완료'));
  } catch (err) {
    return res.status(500).json(failResponse('SERVER_ERROR', err.message));
  }
});

/**
 * 답변 좋아요 수 조회
 * GET /api/answers/:answerId/like/count
 */
router.get('/:answerId/like/count', async (req, res) => {
  const answerId = Number(req.params.answerId);

  try {
    const count = await AnswerService.getLikeCount(answerId);
    return res.status(200).json(successResponse('답변 좋아요 수 조회 완료', {
      answerId,
      likeCount: count,
    }));
  } catch (err) {
    return res.status(500).json(failResponse('SERVER_ERROR', err.message));
  }
});

// DELETE /api/answers/:answerId
router.delete('/answers/:answerId', authenticateJWT, async (req, res, next) => {
  const { answerId } = req.params;
  const userId = req.user.id;

  try {
    await AnswerService.deleteAnswer(Number(answerId), userId);
    return res.status(200).json({
      resultType: 'SUCCESS',
      error: null,
      success: { message: '답변 삭제 완료' },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
