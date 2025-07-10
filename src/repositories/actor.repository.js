import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();
// 커뮤니티 아이디를 통해 배우를 찾는 함수
export const findActorByCommunityId = async (communityId) => {
  // Post를 통해 연결된 actor 중 첫 번째를 가져옴
  const postWithActor = await prisma.post.findFirst({
    where: {
      communityId: communityId,
      actorId: { not: null },
    },
    include: {
      actor: true,
    },
  });

  return postWithActor?.actor || null;
};
