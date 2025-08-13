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


// 존재 여부(내가 댓글 남겼는지) 체크
export const existsQuestionCommentByUser = async (questionId, userId) => {
  const row = await prisma.questionComment.findFirst({
    where: { questionId: Number(questionId), userId },
    select: { id: true },
  });
  return !!row;
};

// 질문 댓글 단건
export const findCommentById = (commentId) =>
  prisma.questionComment.findUnique({
    where: { id: Number(commentId) },
    select: { id: true, questionId: true, userId: true },
  });

// 좋아요 존재 여부
export const findCommentLike = (commentId, userId) =>
  prisma.questionCommentLike.findUnique({
    where: { commentId_userId: { commentId: Number(commentId), userId: Number(userId) } },
  });

// 좋아요 등록/취소
export const likeComment = (commentId, userId) =>
  prisma.questionCommentLike.create({ data: { commentId: Number(commentId), userId: Number(userId) } });

export const unlikeComment = (commentId, userId) =>
  prisma.questionCommentLike.delete({
    where: { commentId_userId: { commentId: Number(commentId), userId: Number(userId) } },
  });

// 좋아요 수
export const countCommentLikes = (commentId) =>
  prisma.questionCommentLike.count({ where: { commentId: Number(commentId) } });