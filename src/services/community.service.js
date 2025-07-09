import prisma from "../../prisma/client.js";
import {
  checkUserInCommunity,
  insertUserToCommunity,
  deleteUserFromCommunity,
  checkDuplicateCommunityName,
  insertCommunityRequest,
  findUnjoinedCommunities,
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
  requestedAt,
}) => {
  console.log("요청 받은 데이터:", {
    userId,
    name,
    description,
    type,
    requestedAt,
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
    requestedAt,
  });

  return "커뮤니티 신청이 완료되었습니다.";
};

// 커뮤니티 목록 조회
export const fetchAvailableCommunities = async (userId) => {
  return await findUnjoinedCommunities(userId);
};
