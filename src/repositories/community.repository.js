import prisma from "../config/prismaClient.js";

// 커뮤니티 가입 여부 확인하기
export const checkUserInCommunity = async (userId, communityId) => {
  const record = await prisma.userCommunity.findFirst({
    where: {
      userId,
      communityId,
    },
  });
  return !!record;
};

// 커뮤니티 가입하기
export const insertUserToCommunity = async (userId, communityId) => {
  await prisma.userCommunity.create({
    data: {
      userId,
      communityId,
    },
  });
};

// 커뮤니티 탈퇴
export const deleteUserFromCommunity = async (userId, communityId) => {
  await prisma.userCommunity.deleteMany({
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
export const findUnjoinedCommunities = async (userId) => {
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
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      groupName: true,
      type: true,
      createdAt: true,
    },
  });

  return communities;
};

// 모든 커뮤니티 목록 보기
export const findAllCommunities = async () => {
  return await prisma.community.findMany({
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
      name: true,
      description: true,
      type: true,
      musicalName: true,
      recentPerformanceDate: true,
      theaterName: true,
      ticketLink: true,
      createdAt: true,
    },
  });
};

// 커뮤니티 프로필 추가
export const createCommunityProfile = async (data) => {
  const inputDate = data.recentPerformanceDate;

  console.log(" 받은 날짜 값:", inputDate);
  console.log(" typeof:", typeof inputDate);

  // 문자열인지 먼저 확인
  if (typeof inputDate !== "string" || inputDate.trim() === "") {
    throw new Error("날짜가 누락되었거나 잘못된 형식입니다.");
  }

  const parsedDate = new Date(inputDate);

  if (isNaN(parsedDate.getTime())) {
    throw new Error("유효하지 않은 날짜 형식입니다.");
  }

  return await prisma.community.create({
    data: {
      name: data.name,
      type: data.type,
      description: data.description,
      profileImage: data.profileImage,
      ticketLink: data.ticketLink,
      musicalName: data.musicalName,
      theaterName: data.theaterName,
      recentPerformanceDate: parsedDate,
    },
  });
};

// 커뮤니티 프로필 수정하기
export const modifyCommunityProfile = async (communityId, data) => {
  let parsedDate = null;
  if (data.recentPerformanceDate) {
    parsedDate = new Date(data.recentPerformanceDate);
    if (isNaN(parsedDate.getTime())) {
      throw new Error("유효하지 않은 날짜 형식입니다.");
    }
  }

  const updated = await prisma.community.update({
    where: { id: communityId },
    data: {
      name: data.name,
      type: data.type,
      description: data.description,
      profileImage: data.profileImage,
      ticketLink: data.ticketLink,
      musicalName: data.musicalName,
      theaterName: data.theaterName,
      recentPerformanceDate: parsedDate,
    },
  });

  return updated;
};
