import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import db from "../utils/db.config.js"; // 유저 찾을 DB 로직
import { UnauthorizedError } from "../utils/CustomError.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d"; // 만료 기간 설정

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await db.users.findByEmail(email);

  if (!user || user.password !== password) {
    throw new UnauthorizedError("이메일 또는 비밀번호가 일치하지 않습니다");
  }

  // JWT 발급
  const token = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  res.success({
    message: "로그인 성공",
    token,
    user: { id: user.id, email: user.email, nickname: user.nickname },
  });
});