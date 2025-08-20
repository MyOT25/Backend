import prisma from "../config/prismaClient.js";

export const getHomeFeedPosts = async ({ userId, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const followings = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = followings.map((f) => f.followingId);
  const userIds = [userId, ...followingIds];

  const total = await prisma.post.count({
    where: { userId: { in: userIds } },
  });

  const posts = await prisma.post.findMany({
    where: { userId: { in: userIds } },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip,
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
      user: {
        select: { id: true, loginId: true, nickname: true, profileImage: true },
      },
      postImages: { select: { url: true } },
      community: { select: { id: true, type: true, coverImage: true } },
      postLikes: {
        where: { userId },
        select: { id: true },
      },
      postBookmarks: {
        where: { userId },
        select: { id: true },
      },
      postComments: {
        where: { userId },
        select: { id: true },
      },
      reposts: {
        where: { userId, isRepost: true },
        select: { id: true, repostTargetId: true },
      },
      repostTarget: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          commentCount: true,
          likeCount: true,
          repostCount: true,
          bookmarkCount: true,
          user: {
            select: {
              id: true,
              loginId: true,
              nickname: true,
              profileImage: true,
            },
          },
          postImages: { select: { url: true } },
          community: { select: { id: true, type: true, coverImage: true } },
          postLikes: {
            where: { userId },
            select: { id: true },
          },
          postBookmarks: {
            where: { userId },
            select: { id: true },
          },
          postComments: {
            where: { userId },
            select: { id: true },
          },
          reposts: {
            where: { userId, isRepost: true },
            select: { id: true, repostTargetId: true },
          },
        },
      },
    },
  });

  return { total, posts };
};
