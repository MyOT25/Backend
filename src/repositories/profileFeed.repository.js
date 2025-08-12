import prisma from "../config/prismaClient.js";

class ProfileFeedRepository {
  // 유저의 게시글 조회 (기본)
  async getUserPosts(userId, filter = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where = {
      userId: Number(userId),
      ...filter,
    };

    const totalCount = await prisma.post.count({ where });

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: this._selectFields(),
    });

    return {
      totalCount,
      page,
      pageSize: limit,
      posts,
    };
  }

  // 인용 게시글 조회
  async getQuotePosts(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where = {
      userId: Number(userId),
      isRepost: true,
      OR: [{ content: { not: null } }, { hasMedia: true }],
    };

    const totalCount = await prisma.post.count({ where });

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: this._selectFields(),
    });

    return {
      totalCount,
      page,
      pageSize: limit,
      posts,
    };
  }

  // 리포스트 게시글 조회
  async getRepostPosts(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where = {
      userId: Number(userId),
      isRepost: true,
      content: null,
      hasMedia: false,
    };

    const totalCount = await prisma.post.count({ where });

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: this._selectFields(),
    });

    return {
      totalCount,
      page,
      pageSize: limit,
      posts,
    };
  }

  // 공통으로 사용하는 select 필드
  _selectFields() {
    return {
      id: true,
      content: true,
      createdAt: true,
      commentCount: true,
      likeCount: true,
      repostCount: true,
      bookmarkCount: true,
      mediaType: true,
      hasMedia: true,
      isRepost: true,
      repostType: true,
      user: {
        select: {
          id: true,
          nickname: true,
          profileImage: true,
        },
      },
      postImages: { select: { url: true } },
      community: {
        select: {
          id: true,
          type: true,
          coverImage: true,
        },
      },
      postLikes: { select: { id: true, userId: true } },
      postBookmarks: { select: { id: true, userId: true } },
      repostTarget: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            },
          },
          postImages: { select: { url: true } },
          community: {
            select: { id: true, type: true, coverImage: true },
          },
        },
      },
    };
  }
}

export default new ProfileFeedRepository();
