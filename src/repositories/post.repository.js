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
        musical: true,
        seat: true,
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

  // 인용한 게시물 찾는 함수
  async findQuotedPost(postId) {
    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
    });

    if (!post?.repostTargetId || post.repostType !== 'POST') {
      return null; // 인용이 아님
    }

    // 인용 대상 게시글 가져오기
    const quoted = await prisma.post.findUnique({
      where: { id: post.repostTargetId },
      include: {
        postimages: true,
      },
    });

    if (!quoted) return null;

    return {
      content: quoted.content,
      media: quoted.postimages.map((img) => ({ url: img.url })),
    };
  }
}

export default new PostRepository();
