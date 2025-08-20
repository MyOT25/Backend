import prisma from "../config/prismaClient.js";

// 커뮤니티 가입 여부 확인하기
export const checkUserInCommunity = async (
  userId,
  communityId,
  db = prisma
) => {
  const record = await db.userCommunity.findFirst({
    where: {
      userId,
      communityId,
    },
  });
  return !!record;
};

// 커뮤니티 가입하기
export const insertUserToCommunity = async (
  userId,
  communityId,
  db = prisma
) => {
  await db.userCommunity.create({
    data: {
      userId,
      communityId,
    },
  });
};

// 커뮤니티 탈퇴
export const deleteUserFromCommunity = async (
  userId,
  communityId,
  db = prisma
) => {
  await db.userCommunity.deleteMany({
    where: {
      userId,
      communityId,
    },
  });
};

// 커뮤니티 이름 중복 확인
export const checkDuplicateCommunityName = async (groupName) => {
  const existing = await prisma.community.findFirst({
    where: { groupName },
  });
  return !!existing;
};

//  커뮤니티 신청 (등록)
export const insertCommunityRequest = async ({ type, targetId, groupName }) => {
  return await prisma.community.create({
    data: {
      type,
      targetId,
      groupName,
    },
  });
};

//  가입하지 않은 커뮤니티 목록 조회
export const findUnjoinedCommunities = async (type, userId) => {
  const joined = await prisma.userCommunity.findMany({
    where: { userId },
    select: { communityId: true },
  });

  const joinedIds = joined.map((item) => item.communityId);

  const communities = await prisma.community.findMany({
    where: {
      id: {
        notIn: joinedIds,
      },
      type: type, // enum 'ACTOR' 또는 'MUSICAL'
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      groupName: true,
      type: true,
      createdAt: true,
      coverImage: true,
      _count: { select: { userCommunities: true } },
    },
  });

  return communities;
};

// 모든 커뮤니티 목록 보기
export const findAllCommunities = async (type = null) => {
  return await prisma.community.findMany({
    ...(type ? { where: { type } } : {}),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      groupName: true,
      type: true,
      createdAt: true,
    },
  });
};

// 내가 가입한 커뮤니티 목록 조회
export const findMyCommunities = async (userId) => {
  const userCommunities = await prisma.userCommunity.findMany({
    where: { userId },
    include: {
      community: {
        select: {
          id: true,
          groupName: true,
          type: true,
          createdAt: true,
        },
      },
    },
  });

  return userCommunities.map((uc) => uc.community);
};

// 커뮤니티 정보 조회
export const findCommunityById = async (communityId) => {
  return await prisma.community.findUnique({
    where: { id: communityId },
    select: {
      id: true,
      groupName: true,
      type: true,
      targetId: true,
      createdAt: true,
      coverImage: true,
    },
  });
};

// 커뮤니티 프로필 추가
export const createCommunityProfileRepository = async (
  { userId, communityId, nickname, image, bio },
  db = prisma
) => {
  return await db.multiProfile.create({
    data: {
      userId,
      communityId,
      nickname,
      image,
      bio,
    },
  });
};

// (이 함수는 전역 멀티 개수 카운트에 쓰이는데, 이름이 헷갈림)
export const countUserProfilesInCommunity = async (userId, db = prisma) => {
  return await db.multiProfile.count({ where: { userId } });
};
// 커뮤니티 프로필 수정하기
export const modifyCommunityProfile = async (profileId, data, db = prisma) => {
  return await db.multiProfile.update({
    where: { id: profileId },
    data,
  });
};

// 커뮤니티 프로필 삭제하기

export const deleteCommunityProfileRepository = async (
  profileId,
  db = prisma
) => {
  return await db.multiProfile.delete({ where: { id: profileId } });
};

// 커뮤니티 내 피드 다른 커뮤니티로 인용
//현재 커뮤니티의 피드 중, '다른 커뮤니티의 글을 인용한 글(repost)'만 보여줌

// 커뮤니티 내 '다른 커뮤니티' 글을 인용한 글(repost)만 조회
export const findRepostFeed = async (communityId, db = prisma) => {
  const cid = Number(communityId);

  // 1) 현재 커뮤니티에서 작성된 '리포스트' 글만 먼저 가져온다
  const posts = await db.post.findMany({
    where: {
      communityId: cid,
      isRepost: true,
      repostTargetId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    include: {
      // 안전한 필드만 include
      user: { select: { nickname: true, profileImage: true } },
      community: { select: { groupName: true } },
      postTags: { include: { tag: true } },
      // ⚠ repostTarget 는 Prisma 클라이언트에서 미노출이라 include 금지
    },
  });

  if (posts.length === 0) return [];

  // 2) 인용 대상(postId)들을 한 번에 조회해서 매핑
  const targetIds = Array.from(
    new Set(posts.map((p) => p.repostTargetId).filter(Boolean))
  );

  const targets = await db.post.findMany({
    where: { id: { in: targetIds } },
    select: {
      id: true,
      communityId: true,
      title: true,
      user: { select: { nickname: true } },
      community: { select: { groupName: true } },
    },
  });

  const targetMap = targets.reduce((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  // 3) 타겟이 '다른 커뮤니티'인 경우만 필터 + 타겟 정보를 병합
  const result = posts
    .map((p) => {
      const tgt = p.repostTargetId ? targetMap[p.repostTargetId] : null;
      return {
        ...p,
        repostTarget: tgt || null,
      };
    })
    .filter((p) => p.repostTarget && p.repostTarget.communityId !== cid);

  return result;
};

// 커뮤니티 내 "미디어가 있는" 피드
export const findMediaFeed = async (communityId, db = prisma) => {
  const cid = Number(communityId);

  // 1) 우선 게시글만 가져옴(미디어 조건)
  const posts = await db.post.findMany({
    where: {
      communityId: cid,
      OR: [{ hasMedia: true }, { mediaType: { in: ["image", "video"] } }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { nickname: true, profileImage: true } },
      community: { select: { groupName: true } },
      postTags: { include: { tag: true } },
    },
  });

  if (posts.length === 0) return [];

  // 2) 이미지들을 한 번에 가져와서 postId별로 묶음
  const ids = posts.map((p) => p.id);
  const imgs = await db.postImage.findMany({
    where: { postId: { in: ids } },
    select: { id: true, postId: true, url: true, caption: true },
  });

  const byPostId = imgs.reduce((acc, img) => {
    (acc[img.postId] ||= []).push(img);
    return acc;
  }, {});

  // 3) 게시글에 병합해서 반환
  return posts.map((p) => ({
    ...p,
    postImages: byPostId[p.id] || [],
    mediaUrls: (byPostId[p.id] || []).map((i) => i.url),
  }));
};

// 요즘 인기글만 볼 수 있는 피드
export const findPopularFeed = async (communityId) => {
  return await prisma.post.findMany({
    where: {
      communityId,
      likeCount: {
        gte: 3,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      content: true,
      likeCount: true,
      viewCount: true,
      createdAt: true,
      user: {
        select: {
          nickname: true,
        },
      },
      community: {
        select: {
          groupName: true,
        },
      },
    },
  });
};

// 해당 커뮤니티에 설정한 내 프로필 조회
export const findMyProfileInCommunityRepository = async (
  userId,
  communityId,
  db = prisma
) => {
  return await db.multiProfile.findFirst({
    where: { userId: Number(userId), communityId: Number(communityId) },
    select: {
      id: true,
      userId: true,
      communityId: true,
      nickname: true,
      image: true,
      bio: true,
    },
  });
};

// 특정 유저의 해당 커뮤니티 프로필 조회
export const findMultiProfile = async (communityId, userId, db = prisma) => {
  return await db.multiProfile.findFirst({ where: { communityId, userId } });
};
// 현재 등록된 내 프로필 개수 확인
export const countMyProfile = async (userId, db = prisma) => {
  return await db.multiProfile.count({ where: { userId } });
};

// 커뮤니티 전체 피드 (원본 + 리포스트 모두), 커서 페이지네이션
export const findCommunityFeedAll = async (
  communityId,
  { cursor, limit = 20, order = "desc" } = {},
  db = prisma
) => {
  const query = {
    where: { communityId: Number(communityId) },
    orderBy: { createdAt: order === "asc" ? "asc" : "desc" },
    take: Number(limit),
    include: {
      user: { select: { id: true, nickname: true, profileImage: true } },
      community: { select: { id: true, groupName: true } },
      postTags: { include: { tag: true } },
    },
  };

  if (cursor) {
    query.cursor = { id: Number(cursor) };
    query.skip = 1;
  }

  // 1) 게시글 먼저 조회
  const posts = await db.post.findMany(query);

  // 2) 이미지 한 번에 모아서 매핑
  const postIds = posts.map((p) => p.id);
  let imagesByPostId = {};
  if (postIds.length) {
    const imgs = await db.postImage.findMany({
      where: { postId: { in: postIds } },
      select: { id: true, postId: true, url: true, caption: true },
    });
    imagesByPostId = imgs.reduce((acc, img) => {
      (acc[img.postId] ||= []).push(img);
      return acc;
    }, {});
  }

  // 3) 리포스트 타겟도 별도 조회 후 매핑
  const targetIds = Array.from(
    new Set(posts.map((p) => p.repostTargetId).filter(Boolean))
  );
  let targetMap = {};
  if (targetIds.length) {
    const targets = await db.post.findMany({
      where: { id: { in: targetIds } },
      select: {
        id: true,
        communityId: true,
        title: true,
        user: { select: { id: true, nickname: true } },
        community: { select: { id: true, groupName: true } },
      },
    });
    targetMap = targets.reduce((acc, t) => ((acc[t.id] = t), acc), {});
  }

  // 4) 응답 병합
  const items = posts.map((p) => ({
    ...p,
    postImages: imagesByPostId[p.id] || [],
    repostTarget: p.repostTargetId ? targetMap[p.repostTargetId] || null : null,
  }));

  const nextCursor =
    items.length === Number(limit) ? items[items.length - 1].id : null;

  return { items, nextCursor };
};
