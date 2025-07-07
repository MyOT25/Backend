import express from "express";
import { testError } from "../controllers/testController.js";

const router = express.Router();
/**
 * @swagger
 * /api/test/error:
 *   get:
 *     summary: 공통 예외 처리 테스트용 API
 *     responses:
 *       400:
 *         description: 중복 이메일 에러
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                     reason:
 *                       type: string
 *                     data:
 *                       type: object
 */



router.get("/error", testError); // 공통 예외 처리 테스트용 라우터

export default router;