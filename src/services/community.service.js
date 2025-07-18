import prisma from "../config/prismaClient.js";
import {
  checkUserInCommunity,
  insertUserToCommunity,
  deleteUserFromCommunity,
  checkDuplicateCommunityName,
  insertCommunityRequest,
  findUnjoinedCommunities,
  findAllCommunities,
  findMyCommunities,
  findCommunityById,
  createCommunityProfile,
  modifyCommunityProfile,
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
  name,
  description,
  type,
  musicalName,
  recentPerformanceDate,
  theaterName,
  ticketLink,
}) => {
  console.log("요청 받은 데이터:", {
    userId,
    name,
    description,
    type,
  });

  console.log("checking for community name:", name);
  const exists = await checkDuplicateCommunityName(name);
  if (exists) {
    throw new Error("이미 존재하는 커뮤니티입니다.");
  }

  await insertCommunityRequest({
    userId,
    name,
    description,
    type,
    musicalName,
    recentPerformanceDate,
    theaterName,
    ticketLink,
  });

  return "커뮤니티 신청이 완료되었습니다.";
};

// 가입 가능한 커뮤니티 탐색하기
export const fetchAvailableCommunities = async (userId) => {
  return await findUnjoinedCommunities(userId);
};

// 모든 커뮤니티 목록 보기
export const fetchAllCommunities = async () => {
  return await findAllCommunities();
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
export const addCommunityProfile = async (profileDate) => {
  return await createCommunityProfile(profileDate);
};

// 커뮤니티 프로필 수정
export const updateCommunityProfile = async (communityId, profileDate) => {
  return await modifyCommunityProfile(communityId, profileDate);
};
