// src/repositories/question.repository.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 질문 생성
export const createQuestion = async ({ userId, title, content }) => {
  return await prisma.question.create({
    data: { userId, title, content,},
  });
};

// 질문 이미지 여러 개 저장
export const createQuestionImages = async (questionId, userId, imageUrls) => {
  return await prisma.questionImage.createMany({
    data: imageUrls.map((url) => ({
      questionId,
      userId,
      imageUrl: url,
    })),
  });
};


// 태그 연결
export const createQuestionTags = async (questionId, userId, tagIds) => {
  return await Promise.all(
    tagIds.map((tagId) =>
      prisma.questionTag.create({
        data: {
          question: { connect: { id: questionId } },
          user: { connect: { id: userId } },
          tag: { connect: { id: tagId } },
        },
        include: {
          tag: true,
        },
      })
    )
  );
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
      images: true,
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
      images: true, // ✅ 요거 추가!
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
export const findQuestionLike = async (questionId, userId) => {
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
  // 1. 답변 삭제
  await prisma.answer.deleteMany({
    where: { questionId },
  });

  // 2. 좋아요 삭제
  await prisma.questionLike.deleteMany({
    where: { questionId },
  });

  // 3. 태그 연결 삭제
  await prisma.questionTag.deleteMany({
    where: { questionId },
  });

  // 4. 질문 삭제
  return await prisma.question.delete({
    where: { id: questionId },
  });
};


