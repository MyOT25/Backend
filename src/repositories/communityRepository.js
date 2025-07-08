import prisma from "../../prisma/client.js";

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
  console.log("🔍 checking for community name:", name); // 로그 추가
  const exists = await prisma.community.findFirst({
    where: {
      name,
    },
  });
  console.log("📌 exists:", exists); // 로그 추가
  return !!exists;
};

//  커뮤니티 신청 (등록)
export const insertCommunityRequest = async ({
  userId,
  name,
  description,
  type,
  requestedAt,
}) => {
  await prisma.community.create({
    data: {
      name,
      description,
      type,
      createdAt: new Date(requestedAt),
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
