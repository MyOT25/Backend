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

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

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

  // 유저가 해당 커뮤니티에 가입되어 있는지 확인
  async findUserCommunity(userId, communityId) {
    return prisma.userCommunity.findFirst({
      where: { userId, communityId },
    });
  }

  //Post 테이블 업데이트
  async createPost({ userId, communityId, content, hasMedia }) {
    return prisma.post.create({
      data: {
        userId,
        communityId,
        content,
        hasMedia,
      },
    });
  }

  //PostImage 테이블 업데이트
  async createImages(postId, postimages) {
    const imageList = Array.isArray(postimages) ? postimages : [postimages];
    const imageData = imageList.map((url) => ({ postId, url }));
    return prisma.postImage.createMany({ data: imageData });
  }

  //Tag_Post 테이블 업데이트
  async upsertTagByName(name) {
    return prisma.tag_Post.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  //PostTag 테이블 업데이트
  async createPostTag(postId, tagId) {
    return prisma.postTag.create({
      data: {
        postId,
        tagId,
      },
    });
  }

  // 재게시용 게시글 생성
  async createRepost({ userId, communityId, repostType, repostTargetId }) {
    return prisma.post.create({
      data: {
        userId,
        communityId,
        isRepost: true,
        repostType,
        repostTargetId,
      },
    });
  }

  // 인용 게시글 생성
  async createQuotePost({
    userId,
    communityId,
    repostType,
    repostTargetId,
    content,
    hasMedia,
  }) {
    return prisma.post.create({
      data: {
        userId,
        communityId,
        isRepost: true,
        repostType,
        repostTargetId,
        content,
        hasMedia,
      },
    });
  }

  // 원본 게시글의 repostCount 증가
  async incrementRepostCount(postId) {
    return prisma.post.update({
      where: { id: postId },
      data: {
        repostCount: {
          increment: 1,
        },
      },
    });
  }
}

export default new PostRepository();
