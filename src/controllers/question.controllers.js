import express from 'express';
import * as questionService from '../services/question.service.js';
import pkg from '../generated/prisma/index.js';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();
const router = express.Router();

/**
 * 질문 등록 API
 * POST /api/questions
 */
router.post('/', async (req, res, next) => {
  try {
    const { userId, title, content } = req.body;

    if (!userId || !title || !content) {
      return res.status(400).json({
        resultType: 'FAIL',
        error: {
          errorCode: 'Q100',
          reason: 'userId, title, content는 필수입니다.',
          data: null,
        },
        success: null,
      });
    }

    const question = await questionService.registerQuestion(userId, title, content);

    res.status(201).json({
      resultType: 'SUCCESS',
      error: null,
      success: {
        message: '질문이 등록되었습니다.',
        data: question,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 질문 목록 조회 API
 * GET /api/questions
 */
router.get('/', async (req, res, next) => {
  try {
    const questions = await questionService.getQuestionList();

    res.status(200).json({
      resultType: 'SUCCESS',
      error: null,
      success: {
        message: '질문 목록을 불러왔습니다.',
        data: questions,
      },
    });
  } catch (error) {
    next(error);
  }
});


/**
 * 답변 등록 API
 * POST /api/questions/:questionId/answers
 */
router.post('/:questionId/answers', async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.error({
        errorCode: 'A100',
        reason: 'userId와 content는 필수입니다.',
      });
    }

    // 질문 존재 여부 확인
    const question = await prisma.question.findUnique({
      where: { id: parseInt(questionId) },
    });

    if (!question) {
      return res.error({
        errorCode: 'Q404',
        reason: '존재하지 않는 질문입니다.',
      });
    }

    const answer = await prisma.answer.create({
      data: {
        questionId: parseInt(questionId),
        userId,
        content,
      },
    });

    return res.success({
      message: '답변이 등록되었습니다.',
      data: answer,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * 답변 상세 조회 API
 * GET /api/questions/:questionId
 */
router.get('/:questionId', async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const question = await prisma.question.findUnique({
      where: { id: parseInt(questionId) },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        answers: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!question) {
      return res.error({
        errorCode: 'Q404',
        reason: '해당 질문이 존재하지 않습니다.',
      });
    }

    return res.success({
      message: '질문 상세 정보를 불러왔습니다.',
      data: question,
    });
  } catch (err) {
    next(err);
  }
});

export default router;