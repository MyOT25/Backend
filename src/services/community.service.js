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
} from "../repositories/community.repository.js";

// 공연 커뮤니티 가입 / 탈퇴
export const handleJoinOrLeaveCommunity = async (
  userId,
  communityId,
  action
) => {
  const isJoined = await checkUserInCommunity(userId, communityId);

  if (action === "join") {
    if (isJoined) throw new Error("이미 가입된 커뮤니티입니다.");
    await insertUserToCommunity(userId, communityId);
    return "커뮤니티 가입 완료";
  }

  if (action === "leave") {
    if (!isJoined) throw new Error("가입되지 않은 커뮤니티입니다.");
    await deleteUserFromCommunity(userId, communityId);
    return "커뮤니티 탈퇴 완료";
  }

  throw new Error("유효하지 않은 요청입니다.");
};

// 커뮤니티 신청
export const handleCommunityRequest = async ({
  userId,
  type,
  targetId,
  groupName,
}) => {
  return await insertCommunityRequest({
    userId,
    type,
    targetId,
    groupName,
    musicalName: null,
    recentPerformanceDate: null,
    theaterName: null,
    ticketLink: null,
  });
};

export const insertCommunityRequest = async ({
  userId,
  type,
  targetId,
  groupName,
  musicalName,
  recentPerformanceDate,
  theaterName,
  ticketLink,
}) => {
  return await prisma.community.create({
    data: {
      type,
      targetId,
      groupName,
      musicalName,
      recentPerformanceDate: recentPerformanceDate
        ? new Date(recentPerformanceDate)
        : null,
      theaterName,
      ticketLink,
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
export const fetchAvailableCommunities = async (userId) => {
  return await findUnjoinedCommunities(userId);
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

// 커뮤니티 프로필 추가
const MAX_FREE_PROFILES = 5;

export const createCommunityProfileService = async ({
  userId,
  communityId,
  nickname,
  image,
  bio,
}) => {
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
  return await findMyProfileInCommunityRepository(userId, communityId);
};

// 특정 유저의 해당 커뮤니티 프로필 조회
export const getOtherUserProfile = async (communityId, userId) => {
  return await findMultiProfile(communityId, userId);
};

// 현재 등록된 내 프로필 개수 확인
export const getMyProfileCount = async (userId) => {
  return await countMyProfile(userId);
};
