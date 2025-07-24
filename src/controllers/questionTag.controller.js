import express from 'express';
import { QuestionTagService } from '../services/questionTag.service.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const tags = await QuestionTagService.getAllTags();
    res.status(200).json({ resultType: "SUCCESS", error: null, success: { message: "태그 목록 조회 성공", data: tags } });
  } catch (err) {
    res.status(500).json({ resultType: "FAIL", error: { errorCode: "SERVER_ERROR", reason: err.message }, success: null });
  }
});

export default router;
