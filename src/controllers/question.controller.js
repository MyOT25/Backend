// 수정된 질문 컨트롤러 예시 (컨트롤러/서비스 구조 분리)
import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

import { QuestionService } from '../services/question.service.js';


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

// 복합 유니크 키 생성 함수
const likeKey = (questionId, userId) => ({ questionId, userId });

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: 질문 등록
 *     description: 사용자가 새로운 질문을 등록합니다.
 *     tags:
 *       - Questions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *             required:
 *               - title
 *               - content
 *               - tagIds
 *           example:
 *             title: "JWT란 무엇인가요?"
 *             content: "JWT의 개념과 사용처가 궁금합니다."
 *             tagIds: [1, 2]
 *     responses:
 *       201:
 *         description: 질문 등록 성공
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
 * 질문 등록 API
 */
router.post('/', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, content, tagIds } = req.body;
    if (!title || !content || !Array.isArray(tagIds)) {
      return res.status(400).json(response.fail('Q100', 'title, content, tagIds는 모두 필수입니다.'));
    }
    const result = await QuestionService.createQuestion({ userId, title, content, tagIds });
    return res.status(201).json(response.success('질문이 등록되었습니다.', result));
  } catch (err) {
    next(err);
  }
});

/**
 * 질문 목록 조회
 */
router.get('/', async (req, res, next) => {
  try {
    const questions = await QuestionService.getQuestionList();
    return res.status(200).json(response.success('질문 목록을 불러왔습니다.', questions));
  } catch (err) {
    next(err);
  }
});

/**
 * 질문 상세 조회
 */
router.get('/:questionId', async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const result = await QuestionService.getQuestionDetail(parseInt(questionId));
    if (!result) {
      return res.status(404).json(response.fail('Q404', '해당 질문이 존재하지 않습니다.'));
    }
    return res.status(200).json(response.success('질문 상세 정보를 불러왔습니다.', result));
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
      return res.status(400).json(response.fail('ALREADY_LIKED', '이미 좋아요한 질문입니다.'));
    }
    return res.status(201).json(response.success('질문 좋아요 완료', result));
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
      return res.status(404).json(response.fail('LIKE_NOT_FOUND', '좋아요한 적이 없습니다.'));
    }
    return res.status(200).json(response.success('좋아요 취소 완료'));
  } catch (err) {
    return res.status(500).json(response.fail('SERVER_ERROR', err.message));
  }
});

router.get('/:questionId/like/count', async (req, res) => {
  const questionId = Number(req.params.questionId);
  try {
    const count = await QuestionService.getLikeCount(questionId);
    return res.status(200).json(response.success('좋아요 수 조회 완료', { questionId, likeCount: count }));
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


export default router;
