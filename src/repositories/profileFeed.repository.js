import prisma from "../config/prismaClient.js";

class ProfileFeedRepository {
  async getUserPosts({ loginUserId, targetUserId, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    // 로그인 유저가 targetUser를 팔로우 중인지 확인
    const isFollowing = await prisma.follow.findFirst({
      where: { followerId: loginUserId, followingId: targetUserId },
    });

    // 팔로우 여부에 따라 where 조건 설정
    const where = {
      userId: Number(targetUserId),
      ...(isFollowing ? {} : { visibility: "public" }),
    };

    const total = await prisma.post.count({ where });

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        content: true,
        createdAt: true,
        commentCount: true,
        likeCount: true,
        repostCount: true,
        bookmarkCount: true,
        hasMedia: true,
        isRepost: true,
        repostType: true,
        user: { select: { id: true, nickname: true, profileImage: true } },
        postImages: { select: { url: true } },
        community: { select: { id: true, type: true, coverImage: true } },
        postLikes: { where: { userId: loginUserId }, select: { id: true } },
        postBookmarks: { where: { userId: loginUserId }, select: { id: true } },
        repostTarget: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            commentCount: true,
            likeCount: true,
            repostCount: true,
            bookmarkCount: true,
            user: { select: { id: true, nickname: true, profileImage: true } },
            postImages: { select: { url: true } },
            community: { select: { id: true, type: true, coverImage: true } },
            postLikes: { where: { userId: loginUserId }, select: { id: true } },
            postBookmarks: {
              where: { userId: loginUserId },
              select: { id: true },
            },
          },
        },
      },
    });

    return { total, posts };
  }

  async getUserRepostPosts({
    loginUserId,
    targetUserId,
    page = 1,
    limit = 10,
  }) {
    const skip = (page - 1) * limit;

    // 로그인 유저가 targetUser를 팔로우 중인지 확인
    const isFollowing = await prisma.follow.findFirst({
      where: { followerId: loginUserId, followingId: targetUserId },
    });

    // 조회 조건
    const where = {
      userId: Number(targetUserId),
      isRepost: true,
      repostType: "repost",
      ...(isFollowing ? {} : { visibility: "public" }),
    };

    // 전체 개수
    const total = await prisma.post.count({ where });

    // 데이터 조회
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        isRepost: true,
        repostType: true,
        user: { select: { id: true, nickname: true, profileImage: true } },
        community: { select: { id: true, type: true, coverImage: true } },
        repostTarget: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            commentCount: true,
            likeCount: true,
            repostCount: true,
            bookmarkCount: true,
            user: { select: { id: true, nickname: true, profileImage: true } },
            postImages: { select: { url: true } },
            community: { select: { id: true, type: true, coverImage: true } },
            postLikes: { where: { userId: loginUserId }, select: { id: true } },
            postBookmarks: {
              where: { userId: loginUserId },
              select: { id: true },
            },
          },
        },
      },
    });

    return { total, posts };
  }

  async getUserQuotePosts({ loginUserId, targetUserId, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    // 로그인 유저가 targetUser를 팔로우 중인지 확인
    const isFollowing = await prisma.follow.findFirst({
      where: { followerId: loginUserId, followingId: targetUserId },
    });

    // 조회 조건
    const where = {
      userId: Number(targetUserId),
      isRepost: true,
      repostType: "quote",
      ...(isFollowing ? {} : { visibility: "public" }),
    };

    // 전체 개수
    const total = await prisma.post.count({ where });

    // 데이터 조회
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        content: true,
        createdAt: true,
        commentCount: true,
        likeCount: true,
        repostCount: true,
        bookmarkCount: true,
        isRepost: true,
        repostType: true,
        user: { select: { id: true, nickname: true, profileImage: true } },
        postImages: { select: { url: true } },
        community: { select: { id: true, type: true, coverImage: true } },
        postLikes: { where: { userId: loginUserId }, select: { id: true } },
        postBookmarks: { where: { userId: loginUserId }, select: { id: true } },
        repostTarget: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { id: true, nickname: true, profileImage: true } },
            postImages: { select: { url: true } },
            community: { select: { id: true, type: true, coverImage: true } },
          },
        },
      },
    });

    return { total, posts };
  }

  async getUserMediaPosts({ loginUserId, targetUserId, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    // 로그인 유저가 targetUser를 팔로우 중인지 확인
    const isFollowing = await prisma.follow.findFirst({
      where: { followerId: loginUserId, followingId: targetUserId },
    });

    // 조회 조건
    const where = {
      userId: Number(targetUserId),
      hasMedia: true, // 미디어 있는 게시글만
      ...(isFollowing ? {} : { visibility: "public" }),
    };

    // 전체 개수
    const total = await prisma.post.count({ where });

    // 데이터 조회
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        content: true,
        createdAt: true,
        commentCount: true,
        likeCount: true,
        repostCount: true,
        bookmarkCount: true,
        isRepost: true,
        repostType: true,
        user: { select: { id: true, nickname: true, profileImage: true } },
        postImages: { select: { url: true } },
        community: { select: { id: true, type: true, coverImage: true } },
        postLikes: { where: { userId: loginUserId }, select: { id: true } },
        postBookmarks: { where: { userId: loginUserId }, select: { id: true } },
        repostTarget: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { id: true, nickname: true, profileImage: true } },
            postImages: { select: { url: true } },
            community: { select: { id: true, type: true, coverImage: true } },
          },
        },
      },
    });

    return { total, posts };
  }
}

export default new ProfileFeedRepository();
