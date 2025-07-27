import prisma from '../config/prismaClient.js';

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
  async createQuotePost({ userId, communityId, repostType, repostTargetId, content, hasMedia }) {
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

  // 게시글 단건 조회 (해당 postId에 대한 게시글이 존재하는지)
  async findPostById(postId) {
    return prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true,
        postimages: true,
        postTags: true,
      },
    });
  }

  // 게시글 수정 (본문 및 미디어 여부)
  async updatePost(postId, content, hasMedia) {
    return prisma.post.update({
      where: { id: postId },
      data: {
        content,
        hasMedia,
      },
    });
  }

  // 기존 이미지 삭제
  async deletePostImagesByPostId(postId) {
    return prisma.postImage.deleteMany({
      where: { postId },
    });
  }

  // 기존 태그 삭제
  async deletePostTagsByPostId(postId) {
    return prisma.postTag.deleteMany({
      where: { postId },
    });
  }

  // Post 삭제
  async deletePostById(postId) {
    return prisma.post.delete({
      where: { id: postId },
    });
  }

  // 전체 게시글 조회
  async getAllPosts() {
    return prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        postimages: true,
      },
    });
  }

  // 미디어 포함 게시물 조회
  async findMediaPosts() {
    return await prisma.post.findMany({
      where: {
        hasMedia: true, // 또는 1 (boolean인지 int인지 스키마에 따라)
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  // 특정 게시글에 좋아요가 눌러져 있는지 확인
  async findPostLike(userId, postId) {
    return prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  }

  // 게시글 좋아요 생성
  async createPostLike(userId, postId) {
    //PostLike 테이블에 데이터 생성
    await prisma.postLike.create({
      data: {
        userId,
        postId,
      },
    });
    //Post 좋아요 수 증가시킴
    await prisma.post.update({
      where: { id: postId },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    });
  }

  // 게시글 좋아요 삭제
  async deletePostLike(userId, postId) {
    //PostLike 테이블에 데이터 삭제
    await prisma.postLike.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
    //Post 좋아요 수 감소시킴
    await prisma.post.update({
      where: { id: postId },
      data: {
        likeCount: {
          decrement: 1,
        },
      },
    });
  }

  // 좋아요 누른 유저 목록 조회 (페이징)
  async findUsersWhoLikedPost(postId, skip = 0, take = 10) {
    return prisma.postLike.findMany({
      where: { postId: Number(postId) },
      skip,
      take,
      orderBy: { likedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });
  }

  //게시글의 총 좋아요 수 조회
  async countUsersWhoLikedPost(postId) {
    return prisma.postLike.count({
      where: { postId: Number(postId) },
    });
  }

  // 재게시한 유저 목록 조회
  async findUsersWhoReposted(postId) {
    const reposts = await prisma.post.findMany({
      where: {
        isRepost: true,
        repostTargetId: Number(postId),
        repostType: 'post', // ✅ enum 값에 맞게 소문자로!
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reposts;
  }
}

export default new PostRepository();
