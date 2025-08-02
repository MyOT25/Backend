import prisma from "../config/prismaClient.js";

class HomeFeedRepository {
  async getFollowingPosts(userId, skip = 0, take = 10) {
    // ✅ 1. 내가 팔로우하는 사람들의 ID 목록 가져오기
    const followingIds = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const ids = followingIds.map((f) => f.followingId);

    // ✅ 2. 해당 유저들의 게시글 가져오기
    return prisma.post.findMany({
      where: {
        userId: { in: ids }, // 내가 팔로우한 사람들의 글만 가져오기
      },
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
        postLikes: { where: { userId }, select: { id: true } },
        postBookmarks: { where: { userId }, select: { id: true } },
        // ✅ 리포스트 원본 게시글 최소 데이터만 포함
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
            postImages: {
              select: { url: true },
            },
            community: {
              select: { id: true, type: true, coverImage: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  }

  async getFollowingPostsCount(userId) {
    // ✅ 내가 팔로우하는 사람들의 ID 목록
    const followingIds = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const ids = followingIds.map((f) => f.followingId);

    // ✅ 해당 유저들의 게시글 수 카운트
    return prisma.post.count({
      where: {
        userId: { in: ids },
      },
    });
  }
}

export default new HomeFeedRepository();
