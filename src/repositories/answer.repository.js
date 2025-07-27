


export const AnswerRepository = {
  createAnswer: async (prisma, data) => {
    return await prisma.answer.create({ data });
  },

  findAnswerById: async (prisma, id) => {
    return await prisma.answer.findUnique({ where: { id } });
  },

  findQuestionById: async (prisma, questionId) => {
    return await prisma.question.findUnique({ where: { id: questionId } });
  },

  findAnswerLike: async (prisma, answerId, userId) => {
    return await prisma.answerLike.findUnique({
      where: {
        answerId_userId: {
          answerId,
          userId,
        },
      },
    });
  },

  createAnswerLike: async (prisma, answerId, userId) => {
    return await prisma.answerLike.create({
      data: { answerId, userId },
    });
  },

  deleteAnswerLike: async (prisma, answerId, userId) => {
    return await prisma.answerLike.delete({
      where: {
        answerId_userId: {
          answerId,
          userId,
        },
      },
    });
  },

  countAnswerLikes: async (prisma, answerId) => {
    return await prisma.answerLike.count({ where: { answerId } });
  },

  deleteAnswer: async (prisma, answerId) => {
  return await prisma.answer.delete({
    where: { id: answerId },
  });
},
};
