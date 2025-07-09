import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

// Commnity type 추출
export const getCommunityTypeById = async (communityId) => {
  const community = await prisma.community.findUnique({
    where: { id: Number(communityId) },
    select: { type: true },
  });

  return community?.type || null;
};
