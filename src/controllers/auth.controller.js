import express from "express";
import asyncHandler from "../middlewares/asyncHandler.js";
import { loginService } from "../services/auth.service.js";
import { LoginRequestDto } from "../dtos/auth.dto.js";
import { signupService } from "../services/auth.service.js";
import { SignUpDto } from "../dtos/auth.dto.js";

const router = express.Router();

// 사용자 로그인

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     tags:
 *       - User
 *     description: 사용자가 로그인 ID와 비밀번호로 로그인합니다. 성공 시 JWT accessToken을 반환합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loginId
 *               - password
 *             properties:
 *               loginId:
 *                 type: string
 *                 example: test1
 *               password:
 *                 type: string
 *                 example: test1
 *     responses:
 *       200:
 *         description: 로그인 성공
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
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
router.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const dto = new LoginRequestDto(req.body);
    const { valid, message } = dto.validate();

    if (!valid) {
      return res.error({
        errorCode: "A002",
        reason: message,
      });
    }

    const result = await loginService(dto);
    return res.success(result);
  })
);

// 일반 회원가입

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: 일반 회원가입
 *     tags:
 *       - User
 *     description: 일반 사용자 회원가입을 진행합니다. (추후 소셜 회원가입 API가 별도로 추가될 예정)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - loginId
 *               - password
 *               - nickname
 *             properties:
 *               username:
 *                 type: string
 *                 example: 사용자이름
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               loginId:
 *                 type: string
 *                 example: test1
 *               password:
 *                 type: string
 *                 example: test1234
 *               nickname:
 *                 type: string
 *                 example: 닉네임
 *     responses:
 *       200:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: 사용자이름
 *                 nickname:
 *                   type: string
 *                   example: 닉네임
 *                 email:
 *                   type: string
 *                   example: test@example.com
 */
router.post(
  "/auth/signup",
  asyncHandler(async (req, res) => {
    const signUpDto = new SignUpDto(req.body);
    const result = await signupService(signUpDto);
    return res.success(result);
  })
);

export default router;
