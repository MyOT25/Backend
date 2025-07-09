import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByLoginId } from "../repositories/auth.repository.js";
import {
  findUserByEmail,
  createUser,
  createSetting,
} from "../repositories/auth.repository.js";
import { UnauthorizedError } from "../middlewares/CustomError.js";
import { BadRequestError } from "../middlewares/CustomError.js";

//로그인 로직
export const loginService = async ({ loginId, password }) => {
  const user = await findUserByLoginId(loginId);

  if (!user) {
    throw new UnauthorizedError("해당 로그인 ID의 사용자가 존재하지 않습니다.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError("비밀번호가 일치하지 않습니다.");
  }

  const accessToken = jwt.sign(
    { userId: user.id, loginId: user.loginId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    userId: user.id,
    nickname: user.nickname,
    accessToken,
  };
};

//일반 회원가입 로직
export const signupService = async (signUpDto) => {
  const { email, password, ...rest } = signUpDto;

  // 이메일 중복 확인
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new BadRequestError("이미 등록된 이메일입니다.");
  }

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 10);
  // 빈 세팅 생성
  const newSetting = await createSetting();

  // 사용자 생성
  const newUser = await createUser({
    ...rest,
    email,
    password: hashedPassword,
    setting: {
      connect: { id: newSetting.id },
    },
  });

  return {
    id: newUser.id,
    settingId: newUser.settingId,
    email: newUser.email,
    loginId: newUser.loginId,
    nickname: newUser.nickname,
  };
};
