import prisma from "../config/prismaClient.js";

export const buildWhereByCommunity = async (communityId, db = prisma) => {
  const community = await db.community.findUnique({
    where: { id: Number(communityId) },
    select: { id: true, type: true, targetId: true },
  });

  if (!community) {
    throw new Error("커뮤니티를 찾을 수 없습니다.");
  }

  const where = { communityId: community.id };

  return { community, where };
};

// 커뮤니티 관극 후기 피드 조회
export const findCommunityViewingReviews = async (
  { communityId, userId = null, sort = "latest", limit = 20, cursor = null },
  db = prisma
) => {
  const community = await db.community.findUnique({
    where: { id: Number(communityId) },
    select: { id: true, type: true, targetId: true, groupName: true },
  });

  if (!community) {
    throw new Error("커뮤니티를 찾을 수 없습니다.");
  }

  if (community.targetId === null) {
    return {
      community,
      reviews: [],
      nextCursor: null,
    };
  }

  const whereCondition = {
    musicalId: community.targetId,
  };

  const orderByLatest = [{ createdAt: "desc" }, { id: "desc" }];
  const orderByPopular = [
    { likes: { _count: "desc" } },
    { createdAt: "desc" },
    { id: "desc" },
  ];
  const orderBy = sort === "popular" ? orderByPopular : orderByLatest;

  const pagination = cursor
    ? {
        skip: 1,
        cursor: { id: Number(cursor) },
      }
    : {};

  const rows = await db.viewingRecord.findMany({
    where: whereCondition,
    take: Number(limit),
    ...pagination,
    orderBy,
    include: {
      user: { select: { id: true, nickname: true, profileImage: true } },
      images: { select: { url: true } },
      _count: { select: { likes: true } },
      ...(userId
        ? {
            likes: {
              where: { userId: Number(userId) },
              select: { userId: true, viewingId: true },
            },
          }
        : {}),
    },
  });

  const nextCursor = rows.length ? rows[rows.length - 1].id : null;

  const reviews = rows.map((r) => ({
    viewingId: r.id,
    musicalId: r.musicalId ?? null,
    user: r.user,
    content: r.review ?? r.content ?? null,
    images:
      Array.isArray(r.images) && r.images.length
        ? r.images.map((i) => i.url)
        : r.imageUrl
        ? [r.imageUrl]
        : [],
    watchDate: r.watchDate ?? r.createdAt,
    watchTime: r.time ?? null,
    likeCount: r._count?.likes ?? 0,
    isLiked: Boolean(userId && Array.isArray(r.likes) && r.likes.length > 0),
  }));

  return { community, reviews, nextCursor };
};

// 좋아요 존재 여부 확인
export const findViewingLike = (viewingId, userId, db = prisma) =>
  db.viewingLike.findUnique({
    where: {
      userId_viewingId: {
        userId: Number(userId),
        viewingId: Number(viewingId),
      },
    },
  });

// 좋아요 추가 후 카운트 반환
export const insertViewingLike = async (viewingId, userId, db = prisma) => {
  await db.viewingLike.create({
    data: { viewingId: Number(viewingId), userId: Number(userId) },
  });
  return db.viewingLike.count({ where: { viewingId: Number(viewingId) } });
};

// 좋아요 삭제 후 카운트 반환
export const removeViewingLike = async (viewingId, userId, db = prisma) => {
  await db.viewingLike.delete({
    where: {
      userId_viewingId: {
        userId: Number(userId),
        viewingId: Number(viewingId),
      },
    },
  });
  return db.viewingLike.count({ where: { viewingId: Number(viewingId) } });
};
