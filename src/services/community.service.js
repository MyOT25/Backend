import prisma from "../config/prismaClient.js";
import {
  checkUserInCommunity,
  insertUserToCommunity,
  deleteUserFromCommunity,
  checkDuplicateCommunityName,
  findUnjoinedCommunities,
  findAllCommunities,
  findMyCommunities,
  findCommunityById,
  modifyCommunityProfile,
  findRepostFeed,
  findMediaFeed,
  findPopularFeed,
  createCommunityProfileRepository,
  countUserProfilesInCommunity,
  deleteCommunityProfileRepository,
  findMyProfileInCommunityRepository,
  findMultiProfile,
  countMyProfile,
  findCommunityFeedAll,
} from "../repositories/community.repository.js";

// === helpers (service 내부 최상단 근처) ===
const FREE_LIMIT = 5;

// 무료/유료에 따른 멀티프로필 생성 가능 여부
const canCreateAnotherMulti = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSubscribed: true },
  });
  if (user?.isSubscribed) return true; // 유료 무제한
  const used = await countMyProfile(userId); // 전체 멀티 수
  return used < FREE_LIMIT; // 무료는 5개 제한
};

// 공연 커뮤니티 가입 / 탈퇴
export const handleJoinOrLeaveCommunity = async (
  userId,
  communityId,
  action,
  profileType,
  multi
) => {
  const isJoined = await checkUserInCommunity(userId, communityId);

  if (action === "join") {
    if (isJoined) throw new Error("이미 가입된 커뮤니티입니다.");
    // 트랜잭션: 가입 + (필요 시) 멀티 생성
    await prisma.$transaction(async (tx) => {
      await insertUserToCommunity(userId, communityId, tx);
      if (profileType === "MULTI") {
        const dup = await findMultiProfile(communityId, userId, tx);
        if (dup) throw new Error("이미 해당 커뮤니티에 멀티프로필이 있습니다.");
        const ok = await canCreateAnotherMulti(userId);
        if (!ok)
          throw new Error(
            "무료 회원은 멀티프로필을 5개까지 생성할 수 있습니다."
          );
        await createCommunityProfileRepository(
          {
            userId,
            communityId,
            nickname: multi?.nickname ?? "",
            image: multi?.image ?? null,
            bio: multi?.bio ?? null,
          },
          tx
        );
      }
    });
    return "커뮤니티 가입 완료";
  }

  if (action === "leave") {
    if (!isJoined) throw new Error("가입되지 않은 커뮤니티입니다.");
    // 규칙: 멀티 사용 중이면 자동 삭제
    await prisma.$transaction(async (tx) => {
      const mp = await findMultiProfile(communityId, userId, tx);
      if (mp) await deleteCommunityProfileRepository(mp.id, tx);
      await deleteUserFromCommunity(userId, communityId, tx);
    });
    return "커뮤니티 탈퇴 완료";
  }

  throw new Error("유효하지 않은 요청입니다.");
};

// 커뮤니티별 프로필 타입 전환
export const switchCommunityProfileType = async ({
  userId,
  communityId,
  profileType, // "BASIC" | "MULTI"
  multi, // MULTI 전환 시 {nickname, image, bio}
}) => {
  return await prisma.$transaction(async (tx) => {
    const current = await findMultiProfile(communityId, userId, tx);
    const isMulti = !!current;

    if (profileType === "BASIC") {
      // 멀티 → 기본 : 기존 멀티 자동삭제
      if (isMulti) await deleteCommunityProfileRepository(current.id, tx);
      return { changedTo: "BASIC" };
    }

    if (profileType === "MULTI") {
      // 기본 → 멀티 : 한도 체크 + 생성 (이미 있으면 에러)
      if (isMulti) throw new Error("이미 멀티프로필을 사용 중입니다.");
      const ok = await canCreateAnotherMulti(userId);
      if (!ok)
        throw new Error("무료 회원은 멀티프로필을 5개까지 생성할 수 있습니다.");
      const created = await createCommunityProfileRepository(
        {
          userId,
          communityId,
          nickname: multi?.nickname ?? "",
          image: multi?.image ?? null,
          bio: multi?.bio ?? null,
        },
        tx
      );
      return { changedTo: "MULTI", profile: created };
    }

    throw new Error("profileType은 BASIC 또는 MULTI여야 합니다.");
  });
};

// 커뮤니티 프로필 내용만 수정하기
export const editMyCommunityProfile = async ({
  userId,
  communityId,
  patch, // { nickname?, image?, bio? }
}) => {
  const mp = await findMultiProfile(communityId, userId);
  if (mp) {
    // 멀티 사용 중이면 멀티 레코드 수정
    return await modifyCommunityProfile(mp.id, patch);
  }
  // 기본 사용 중이면 User의 기본 프로필 수정
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      nickname: patch.nickname ?? undefined,
      profileImage: patch.image ?? undefined,
      bio: patch.bio ?? undefined,
    },
    select: { id: true, nickname: true, profileImage: true, bio: true },
  });
  return {
    id: updated.id,
    nickname: updated.nickname,
    image: updated.profileImage,
    bio: updated.bio,
  };
};

// 커뮤니티 신청
export const handleCommunityRequest = async ({
  userId,
  type,
  targetId,
  groupName,
}) => {
  return await prisma.community.create({
    data: {
      type,
      targetId,
      groupName,
    },
  });
};

export const insertCommunityRequest = async ({
  userId,
  type,
  targetId,
  groupName,
}) => {
  return await prisma.community.create({
    data: {
      type,
      targetId,
      groupName,
      createdAt: new Date(),

      userCommunities: {
        create: {
          user: {
            connect: { id: userId },
          },
        },
      },
    },
  });
};

// 가입 가능한 커뮤니티 탐색하기
export const fetchAvailableCommunities = async (type, userId) => {
  return await findUnjoinedCommunities(type, userId);
};

// 모든 커뮤니티 목록 보기
export const fetchAllCommunities = async (type = null) => {
  return await findAllCommunities(type);
};

// 내가 가입한 커뮤니티 목록 조회
export const fetchMyCommunities = async (userId) => {
  return await findMyCommunities(userId);
};

// 커뮤니티 정보 조회
export const fetchCommunityById = async (communityId) => {
  return await findCommunityById(communityId);
};

// 커뮤니티 상세 + 대상별(display) 조립
export const getCommunityDetail = async (communityId) => {
  const c = await prisma.community.findUnique({
    where: { id: Number(communityId) },
    select: {
      id: true,
      type: true,
      targetId: true,
      groupName: true,
      coverImage: true,
      createdAt: true,
    },
  });
  if (!c) throw new Error("커뮤니티를 찾을 수 없습니다.");

  if (c.type === "musical") {
    const m = c.targetId
      ? await prisma.musical.findUnique({
          where: { id: c.targetId },
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            poster: true,
            ticketpic: true,
            theater: { select: { id: true, name: true } },
          },
        })
      : null;

    return {
      communityId: c.id,
      type: c.type,
      groupName: c.groupName,
      coverImage: c.coverImage,
      createdAt: c.createdAt,
      targetId: c.targetId,
      display: m
        ? {
            musicalName: m.name ?? null,
            theaterName: m.theater?.name ?? null,
            recentPerformanceDate: m.endDate ?? m.startDate ?? null,
            ticketLink: m.ticketpic ?? null,
            poster: m.poster ?? null,
          }
        : null,
    };
  }

  if (c.type === "actor") {
    const a = c.targetId
      ? await prisma.actor.findUnique({
          where: { id: c.targetId },
          select: {
            id: true,
            name: true,
            image: true,
            profile: true,
            birthDate: true,
          },
        })
      : null;

    return {
      communityId: c.id,
      type: c.type,
      groupName: c.groupName,
      coverImage: c.coverImage,
      createdAt: c.createdAt,
      targetId: c.targetId,
      display: a
        ? {
            actorName: a.name ?? null,
            profileImage: a.image ?? null,
            birthDate: a.birthDate ?? null,
            profile: a.profile ?? null,
          }
        : null,
    };
  }

  return {
    communityId: c.id,
    type: c.type,
    groupName: c.groupName,
    coverImage: c.coverImage,
    createdAt: c.createdAt,
    targetId: c.targetId,
  };
};

// 커뮤니티 프로필 추가
const MAX_FREE_PROFILES = 5;

export const createCommunityProfileService = async ({
  userId,
  communityId,
  nickname,
  image,
  bio,
}) => {
  // 전역 개수 기준 체크 (countUserProfilesInCommunity도 전역 카운트지만, 이름이 헷갈릴 수 있음)
  const currentCount = await countUserProfilesInCommunity(userId);

  if (currentCount >= MAX_FREE_PROFILES) {
    throw new Error(
      "무료 회원은 최대 5개의 커뮤니티 프로필만 생성할 수 있습니다."
    );
  }
  const profile = await createCommunityProfileRepository({
    userId,
    communityId,
    nickname,
    image,
    bio,
  });

  return profile;
};

// 커뮤니티 프로필 수정
export const updateCommunityProfile = async (profileId, data) => {
  return await modifyCommunityProfile(profileId, data);
};

// 커뮤니티 프로필 삭제하기
export const deleteCommunityProfile = async (profileId) => {
  return await deleteCommunityProfileRepository(profileId);
};

// // 커뮤니티 내 피드 다른 커뮤니티로 인용
//현재 커뮤니티의 피드 중, '다른 커뮤니티의 글을 인용한 글(repost)'만 보여줌
export const getRepostFeed = async (communityId) => {
  return await findRepostFeed(communityId);
};

// 커뮤니티 내 미디어가 있는 피드만 필터링 할 수 있는 탭
export const getMediaFeed = async (communityId) => {
  return await findMediaFeed(communityId);
};

// 요즘 인기글만 볼 수 있는 피드
export const getPopularFeed = async (communityId) => {
  return await findPopularFeed(communityId);
};

// 해당 커뮤니티에 설정한 내 프로필 조회
export const getMyCommunityProfile = async (userId, communityId) => {
  const mp = await findMyProfileInCommunityRepository(userId, communityId);
  if (mp) {
    return {
      profileType: "MULTI",
      profile: {
        id: mp.id,
        userId: mp.userId,
        communityId: mp.communityId,
        nickname: mp.nickname,
        image: mp.image,
        bio: mp.bio,
      },
    };
  }

  // 멀티 없으면 기본(User) 값으로 조립
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nickname: true, profileImage: true, bio: true },
  });

  return {
    profileType: "BASIC",
    profile: {
      id: userId, // 기본 프로필에는 별도 id가 없으니 userId로 표기
      userId,
      communityId,
      nickname: user?.nickname ?? null,
      image: user?.profileImage ?? null,
      bio: user?.bio ?? null,
    },
  };
};

// 특정 유저의 해당 커뮤니티 프로필 조회
export const getOtherUserProfile = async (communityId, userId) => {
  return await findMultiProfile(communityId, userId);
};

// 현재 등록된 내 프로필 개수 확인
export const getMyProfileCount = async (userId) => {
  return await countMyProfile(userId);
  const used = await countMyProfile(userId);
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSubscribed: true },
  });
  return { used, isSubscribed: !!u?.isSubscribed };
};

// 커뮤니티 전체 피드
export const getCommunityFeedAll = async (communityId, options = {}) => {
  return await findCommunityFeedAll(communityId, options);
};
