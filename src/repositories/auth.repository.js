import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

//loginId로부터 사용자 찾기
export const findUserByLoginId = async (loginId) => {
  return await prisma.user.findUnique({
    where: { loginId },
  });
};

//email로부터 사용자 찾기 (이메일 중복 여부 체크)
export const findUserByEmail = async (email) => {
  return await prisma.user.findFirst({
    where: { email },
  });
};

//새로운 설정 아이디 생성
export const createSetting = async (userId) => {
  return prisma.setting.create({
    data: {
      userId,
      useBackground: true,
      useProfilePhoto: false,
      allowRepost: true,
    },
  });
};

//사용자 생성하기 (회원가입)
export const createUser = async (userData) => {
  return await prisma.user.create({
    data: userData,
  });
};
