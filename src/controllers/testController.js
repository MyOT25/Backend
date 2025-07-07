import asyncHandler from "../utils/asyncHandler.js";
import { DuplicateUserEmailError } from "../utils/CustomError.js";

export const testError = asyncHandler(async (req, res) => {
  // 공통 예외 처리 테스트용 에러 발생
  throw new DuplicateUserEmailError("이메일이 이미 사용 중입니다.", { email: "test@example.com" });
});
