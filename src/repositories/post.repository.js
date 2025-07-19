import prisma from "../config/prismaClient.js";

class PostRepository {
  async findViewingRecordsByMonth(userId, year, month) {
    if (!year || isNaN(year) || year < 1900 || year > 2100) {
      throw new Error(`Invalid year: ${year}`);
    }

    month = parseInt(month, 10);
    if (!month || isNaN(month) || month < 1 || month > 12) {
      throw new Error(`Invalid month: ${month}`);
    }

    // JS Date는 month가 0부터 시작 (0=1월)
    const startDate = new Date(year, month - 1, 1); // 현재 달 1일
    const endDate = new Date(year, month, 1); // 다음 달 1일

    return prisma.viewingRecord.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        musical: true,
        seat: true,
      },
    });
  }
}

export default new PostRepository();

//사용자가 해당 커뮤니티에 가입되어 있는지 확인
export const findUserCommunity = async (userId, communityId) => {
  return prisma.userCommunity.findFirst({
    where: { userId, communityId },
  });
};

//게시글 생성
export const createPost = async ({
  userId,
  communityId,
  content,
  mediaType,
}) => {
  return prisma.post.create({
    data: {
      userId,
      communityId,
      content,
      mediaType,
    },
  });
};

//이미지 생성 (image 테이블에 저장)
export const createImages = async (postId, images) => {
  const imageData = images.map((url) => ({ postId, url }));
  return prisma.image.createMany({ data: imageData });
};

//tag 테이블 업데이트 (사용자가 새로운 태그를 사용하면, 추가)
export const upsertTagByName = async (name) => {
  return prisma.tag.upsert({
    where: { name },
    update: {},
    create: { name },
  });
};

//postTag 테이블 업데이트 (게시글에 사용된 태그 저장)
export const createPostTag = async (postId, tagId) => {
  return prisma.postTag.create({
    data: {
      postId,
      tagId,
    },
  });
};
