import prisma from "../config/prismaClient.js";

/**
 * 특정 뮤지컬의 출연진 목록 조회
 * @param {number} musicalId - 뮤지컬 ID
 * @returns {Promise<Array>}
 */
export const findCastingsByMusicalId = async (musicalId) => {
  return await prisma.casting.findMany({
    where: { musicalId },
    include: {
      actor: true, // Actor 모델의 이름과 이미지 포함
    },
  });
};
