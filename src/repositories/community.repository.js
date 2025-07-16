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
export const checkDuplicateCommunityName = async (name) => {
  console.log("checking for community name:", name);
  const exists = await prisma.community.findFirst({
    where: {
      name,
    },
  });
  console.log(" exists:", exists);
  return !!exists;
};

//  커뮤니티 신청 (등록)
export const insertCommunityRequest = async ({
  userId,
  name,
  description,
  type,
  musicalName,
  recentPerformanceDate,
  theaterName,
  ticketLink,
}) => {
  await prisma.community.create({
    data: {
      name,
      description,
      type,
      createdAt: new Date(),
      musicalName,
      recentPerformanceDate: new Date(recentPerformanceDate),
      theaterName,
      ticketLink,
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
      name: true,
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
      name: true,
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
          name: true,
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
