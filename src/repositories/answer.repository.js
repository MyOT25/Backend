export const AnswerRepository = {
  // 생성/조회
  createAnswer: async (prisma, data) => {
    return prisma.answer.create({ data });
  },

  findAnswerById: async (prisma, id) => {
    return prisma.answer.findUnique({ where: { id: Number(id) } });
  },

  // ✅ 선택: _count로 한 번에 카운트 가져오기 (관계명 확인 필요)
  findAnswerByIdWithCounts: async (prisma, id) => {
    return prisma.answer.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        questionId: true,
        _count: {
          select: {
            likes: true,     // Answer.likes  relation name
            comments: true,  // Answer.comments relation name (AnswerComment[])
          },
        },
      },
    });
  },

  // 좋아요
  findAnswerLike: async (prisma, answerId, userId) => {
    return prisma.answerLike.findUnique({
      where: {
        answerId_userId: {
          answerId: Number(answerId),
          userId: Number(userId),
        },
      },
    });
  },

  createAnswerLike: async (prisma, answerId, userId) => {
    return prisma.answerLike.create({
      data: { answerId: Number(answerId), userId: Number(userId) },
    });
  },

  deleteAnswerLike: async (prisma, answerId, userId) => {
    return prisma.answerLike.delete({
      where: {
        answerId_userId: {
          answerId: Number(answerId),
          userId: Number(userId),
        },
      },
    });
  },

  countAnswerLikes: async (prisma, answerId) => {
    return prisma.answerLike.count({ where: { answerId: Number(answerId) } });
  },

  // ✅ 댓글 카운트/존재 여부 (메타용)
  countAnswerComments: async (prisma, answerId) => {
    return prisma.answerComment.count({ where: { answerId: Number(answerId) } });
  },

  existsAnswerCommentByUser: async (prisma, answerId, userId) => {
    const row = await prisma.answerComment.findFirst({
      where: { answerId: Number(answerId), userId: Number(userId) },
      select: { id: true },
    });
    return !!row;
  },

  // 삭제
  deleteAnswer: async (prisma, answerId) => {
    return prisma.answer.delete({ where: { id: Number(answerId) } });
  },
};
