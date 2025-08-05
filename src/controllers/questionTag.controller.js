import express from 'express';
import { QuestionTagService } from '../services/questionTag.service.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 응답 포맷 유틸 (utils/response.js 대체)
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

/**
 * 전체 태그 목록 조회
 * GET /api/question-tags
 */
router.get('/question-tags', async (req, res) => {
  try {
    const tags = await QuestionTagService.getAllTags();
    return res.status(200).json(response.success('전체 태그 목록', tags));
  } catch (err) {
    console.error(err);
    return res.status(500).json(response.fail('T999', '전체 태그 조회 실패', err));
  }
});

/**
 * 태그 필터링 기반 질문 목록 조회
 * GET /api/questions/by-tags?tagIds=1,2,3
 */
router.get('/questions/by-tags', async (req, res) => {
  try {
    const tagIdsParam = req.query.tagIds;
    if (!tagIdsParam) {
      return res.status(400).json(response.fail('T100', 'tagIds는 필수입니다.'));
    }

    const tagIds = tagIdsParam
      .split(',')
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));

    if (tagIds.length === 0) {
      return res.status(400).json(response.fail('T101', '올바른 tagIds 형식이 아닙니다.'));
    }

    const questions = await QuestionTagService.getQuestionsByTags(tagIds);
    return res.status(200).json(response.success('태그 필터링된 질문 목록', questions));
  } catch (err) {
    console.error(err);
    return res.status(500).json(response.fail('T999', '태그 필터 질문 실패', err));
  }
});

export default router;
