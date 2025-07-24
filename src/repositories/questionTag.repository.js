import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const QuestionTagRepository = {
  findAllTags: async () => {
    return await prisma.questionTagMaster.findMany({
      orderBy: { tagName: 'asc' }
    });
  }
};
