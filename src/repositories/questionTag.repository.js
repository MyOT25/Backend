import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const QuestionTagRepository = {
  findAllTags: async () => {
    return await prisma.questionTagMaster.findMany({
      orderBy: { tagName: 'asc' },
    });
  },

  findQuestionsByTagIds: async (tagIds) => {
    console.log('[DEBUG] findQuestionsByTagIds 호출됨:', tagIds);
    return await prisma.question.findMany({
      where: {
        questionTags: {
          some: {
            tagId: {
              in: tagIds,
            },
          },
        },
      },
      include: {
        images: true,
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        questionTags: {
          include: { tag: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
};
