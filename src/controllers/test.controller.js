import asyncHandler from "../middlewares/asyncHandler.js";
import { DuplicateUserEmailError } from "../middlewares/CustomError.js";
import express from "express";

export const testError = asyncHandler(async (req, res) => {
  // 공통 예외 처리 테스트용 에러 발생
  throw new DuplicateUserEmailError("이메일이 이미 사용 중입니다.", { email: "test@example.com" });
});

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