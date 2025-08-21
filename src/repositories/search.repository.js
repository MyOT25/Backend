import prisma from "../config/prismaClient.js";

const postSelect = (userId) => ({
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
    postLikes: { where: { userId }, select: { id: true } },
    postBookmarks: { where: { userId }, select: { id: true } },
    postComments: { where: { userId }, select: { id: true } },
    reposts: {
      where: { userId, isRepost: true },
      select: { id: true, repostTargetId: true },
    },
    repostTarget: {
      select: {
        id: true,
        content: true,
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
      },
    },
  },
});

export const searchPostsByKeyword = async (
  keyword,
  userId,
  page = 1,
  take = 10
) => {
  if (!keyword) return { total: 0, posts: [] };

  let whereCondition;

  if (keyword.startsWith("#")) {
    // 태그 검색
    const tagName = keyword.slice(1);
    whereCondition = {
      postTags: {
        some: { tag: { name: { contains: tagName } } },
      },
    };
  } else if (keyword.startsWith("'") && keyword.endsWith("'")) {
    // 본문 검색
    const contentKeyword = keyword.slice(1, -1);
    whereCondition = {
      content: { contains: contentKeyword },
    };
  } else {
    // 통합 검색
    whereCondition = {
      OR: [
        { content: { contains: keyword } },
        {
          postTags: {
            some: { tag: { name: { contains: keyword } } },
          },
        },
      ],
    };
  }

  // 전체 게시글 수
  const total = await prisma.post.count({
    where: whereCondition,
  });

  // 페이지 기반 게시글 조회
  const posts = await prisma.post.findMany({
    where: whereCondition,
    select: postSelect(userId).select,
    orderBy: { createdAt: "desc" },
    skip: Math.max(0, (page - 1) * take),
    take,
  });

  return { total, posts };
};
