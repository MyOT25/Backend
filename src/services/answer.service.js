export const AnswerService = {
  async createAnswer({ questionId, userId, content }) {
    return prisma.answer.create({
      data: {
        questionId: Number(questionId),
        userId,
        content,
      },
    });
  },

  async hasLiked(answerId, userId) {
    return prisma.answerLike.findUnique({
      where: {
        answerId_userId: {
          answerId: Number(answerId),
          userId,
        },
      },
    });
  },

  async likeAnswer(answerId, userId) {
    const answer = await prisma.answer.findUnique({
      where: { id: Number(answerId) },
      select: { questionId: true },
    });

    if (!answer) {
      throw { errorCode: 'A404', reason: '존재하지 않는 답변입니다.' };
    }

    return prisma.answerLike.create({
      data: {
        answerId: Number(answerId),
        userId,
        questionId: answer.questionId,
      },
    });
  },

  async unlikeAnswer(answerId, userId) {
    return prisma.answerLike.delete({
      where: {
        answerId_userId: {
          answerId: Number(answerId),
          userId,
        },
      },
    });
  },

  async getLikeCount(answerId) {
    return prisma.answerLike.count({
      where: { answerId: Number(answerId) },
    });
  },

  async deleteAnswer(answerId, userId) {
    const answer = await prisma.answer.findUnique({
      where: { id: Number(answerId) },
    });

    if (!answer) {
      throw { errorCode: 'A404', reason: '존재하지 않는 답변입니다.' };
    }

    if (answer.userId !== userId) {
      throw { errorCode: 'A403', reason: '삭제 권한이 없습니다.' };
    }

    await prisma.answer.delete({ where: { id: Number(answerId) } });
  },

  // ✅ 여기 추가
  async getAnswersByQuestionId(questionId) {
    return prisma.answer.findMany({
      where: { questionId: Number(questionId) },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
};
