import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── 질문 댓글 ─────────────────────────────────────────────
export const createQuestionComment = async ({ questionId, userId, content, isAnonymous = false }) => {
  return await prisma.questionComment.create({
    data: { questionId: Number(questionId), userId, content, isAnonymous: Boolean(isAnonymous) },
  });
};

export const getQuestionComments = async (questionId, { skip = 0, take = 20 } = {}) => {
  return await prisma.questionComment.findMany({
    where: { questionId: Number(questionId) },
    orderBy: { createdAt: 'asc' },
    skip, take,
    include: {
      user: { select: { id: true, nickname: true, profileImage: true } },
    },
  });
};


// ── 질문 댓글 카운트 ─────────────────────────────
export const countQuestionComments = async (questionId) => {
  return prisma.questionComment.count({
    where: { questionId: Number(questionId) },
  });
};
export const findQuestionCommentById = (commentId) =>
  prisma.questionComment.findUnique({ where: { id: Number(commentId) } });

export const deleteQuestionComment = (commentId) =>
  prisma.questionComment.delete({ where: { id: Number(commentId) } });

// ── 답변 댓글 ─────────────────────────────────────────────
export const createAnswerComment = async ({ answerId, userId, content, isAnonymous = false }) => {
  return await prisma.answerComment.create({
    data: { answerId: Number(answerId), userId, content, isAnonymous: Boolean(isAnonymous) },
  });
};

export const getAnswerComments = async (answerId, { skip = 0, take = 20 } = {}) => {
  return await prisma.answerComment.findMany({
    where: { answerId: Number(answerId) },
    orderBy: { createdAt: 'asc' },
    skip, take,
    include: {
      user: { select: { id: true, nickname: true, profileImage: true } },
    },
  });
};
// ── 답변 댓글 카운트 ─────────────────────────────
export const countAnswerComments = async (answerId) => {
  return prisma.answerComment.count({
    where: { answerId: Number(answerId) },
  });
};
export const findAnswerCommentById = (commentId) =>
  prisma.answerComment.findUnique({ where: { id: Number(commentId) } });

export const deleteAnswerComment = (commentId) =>
  prisma.answerComment.delete({ where: { id: Number(commentId) } });

// 존재 여부(내가 댓글 남겼는지) 체크
export const existsQuestionCommentByUser = async (questionId, userId) => {
  const row = await prisma.questionComment.findFirst({
    where: { questionId: Number(questionId), userId },
    select: { id: true },
  });
  return !!row;
};

export const existsAnswerCommentByUser = async (answerId, userId) => {
  const row = await prisma.answerComment.findFirst({
    where: { answerId: Number(answerId), userId },
    select: { id: true },
  });
  return !!row;
};