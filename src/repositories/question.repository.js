// src/repositories/question.repository.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 질문 생성
export const createQuestion = async ({ userId, title, content }) => {
  return await prisma.question.create({
    data: { userId, title, content },
  });
};

// 태그 연결
export const createQuestionTags = async (questionId, userId, tagIds) => {
  return await prisma.questionTag.createMany({
    data: tagIds.map((tagId) => ({
      questionId,
      userId,
      tagId,
    })),
  });
};

// 질문 목록 조회
export const getAllQuestions = async () => {
  return await prisma.question.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          profileImage: true,
        },
      },
      questionTags: {
        include: { tag: true }, // ← 관계 이름 문제 발생 시 여기서 에러남
      },
    },
  });
};

// 질문 상세 조회
export const getQuestionDetail = async (questionId) => {
  return await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          profileImage: true,
        },
      },
      answers: {
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      questionTags: {
        include: { tag: true },
      },
    },
  });
};

// 질문 단건 조회 (내부용)
export const getQuestionById = async (id) => {
  return await prisma.question.findUnique({ where: { id } });
};

// 답변 생성
export const createAnswer = async (questionId, userId, content) => {
  return await prisma.answer.create({
    data: {
      questionId,
      userId,
      content,
    },
  });
};

// 좋아요 기능
export const hasLikedQuestion = async (questionId, userId) => {
  return await prisma.questionLike.findUnique({
    where: {
      questionId_userId: {
        questionId,
        userId,
      },
    },
  });
};

export const likeQuestion = async (questionId, userId) => {
  return await prisma.questionLike.create({
    data: {
      questionId,
      userId,
    },
  });
};

export const unlikeQuestion = async (questionId, userId) => {
  return await prisma.questionLike.delete({
    where: {
      questionId_userId: {
        questionId,
        userId,
      },
    },
  });
};

export const getQuestionLikeCount = async (questionId) => {
  return await prisma.questionLike.count({ where: { questionId } });
};

export const deleteQuestion = async (questionId) => {
  return await prisma.question.delete({ where: { id: questionId } });
};
