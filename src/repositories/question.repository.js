// src/repositories/question.repository.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * 질문 생성
 * - service가 authorId를 넘겨도, userId를 넘겨도 받도록 호환 처리
 * - isAnonymous 저장
 */
export const createQuestion = async ({ userId, authorId, title, content, isAnonymous = false }) => {
  const uid = userId ?? authorId;
  if (!uid) throw new Error('createQuestion: userId가 필요합니다.');
  return await prisma.question.create({
    data: { userId: uid, title, content, isAnonymous: Boolean(isAnonymous) },
  });
};

/**
 * 질문 이미지 여러 개 저장
 */
export const createQuestionImages = async (questionId, userId, imageUrls) => {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) return { count: 0 };
  return await prisma.questionImage.createMany({
    data: imageUrls.map((url) => ({
      questionId,
      userId,
      imageUrl: url,
    })),
  });
};

/**
 * 태그 연결
 */
export const createQuestionTags = async (questionId, userId, tagIds) => {
  if (!Array.isArray(tagIds) || tagIds.length === 0) return [];
  return await Promise.all(
    tagIds.map((tagId) =>
      prisma.questionTag.create({
        data: {
          question: { connect: { id: questionId } },
          user: { connect: { id: userId } },
          tag: { connect: { id: tagId } },
        },
        include: { tag: true },
      })
    )
  );
};

/**
 * 질문 목록 조회
 * - isAnonymous 포함 (스칼라라서 기본 포함되지만 가독성 위해 주석만)
 */
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
      questionTags: { include: { tag: true } },
      images: true,
      // isAnonymous는 스칼라 필드라 기본 포함됨
    },
  });
};

/**
 * 질문 상세 조회
 * - 질문/답변의 isAnonymous와 사용자 정보 포함
 * - answers는 최신순 정렬
 */
export const getQuestionDetail = async (questionId) => {
  return await prisma.question.findUnique({
    where: { id: Number(questionId) },
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
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      questionTags: { include: { tag: true } },
      images: true,
      // isAnonymous는 스칼라 필드라 기본 포함됨
    },
  });
};

/**
 * 질문 단건 조회 (내부용)
 */
export const getQuestionById = async (id) => {
  return await prisma.question.findUnique({ where: { id: Number(id) } });
};

/**
 * (참고) 답변 생성은 별도 AnswerRepository가 있다면 제거 가능
 * 현재 파일을 계속 사용할 경우 isAnonymous를 지원하도록 확장
 */
export const createAnswer = async (questionId, userId, content, isAnonymous = false) => {
  return await prisma.answer.create({
    data: {
      questionId: Number(questionId),
      userId,
      content,
      isAnonymous: Boolean(isAnonymous),
    },
  });
};

/**
 * 좋아요 기능
 */
export const findQuestionLike = async (questionId, userId) => {
  return await prisma.questionLike.findUnique({
    where: {
      questionId_userId: {
        questionId: Number(questionId),
        userId,
      },
    },
  });
};

export const likeQuestion = async (questionId, userId) => {
  return await prisma.questionLike.create({
    data: {
      questionId: Number(questionId),
      userId,
    },
  });
};

export const unlikeQuestion = async (questionId, userId) => {
  return await prisma.questionLike.delete({
    where: {
      questionId_userId: {
        questionId: Number(questionId),
        userId,
      },
    },
  });
};

export const getQuestionLikeCount = async (questionId) => {
  return await prisma.questionLike.count({ where: { questionId: Number(questionId) } });
};

/**
 * 질문 삭제
 * - FK 깨지지 않도록 연관 데이터(답변/좋아요/태그/이미지) 먼저 삭제
 */
export const deleteQuestion = async (questionId) => {
  const id = Number(questionId);

  // 1) 답변 삭제
  await prisma.answer.deleteMany({ where: { questionId: id } });

  // 2) 좋아요 삭제
  await prisma.questionLike.deleteMany({ where: { questionId: id } });

  // 3) 태그 연결 삭제
  await prisma.questionTag.deleteMany({ where: { questionId: id } });

  // 4) 이미지 삭제 (누락 보완)
  await prisma.questionImage.deleteMany({ where: { questionId: id } });

  // 5) 질문 삭제
  return await prisma.question.delete({ where: { id } });
};

// 여러 개 ID로 질문 묶어 가져오기 (정렬은 서비스에서 유지)
export const getQuestionsByIds = async (ids = []) => {
  console.log('[getQuestionsByIds] ids=', ids); 
  const list = ids.map(Number).filter((n) => Number.isInteger(n));
  if (list.length === 0) return [];

  return await prisma.question.findMany({        // ✅ findMany!
    where: { id: { in: list } },                 // ✅ in 조건
    include: {
      user: { select: { id: true, nickname: true, profileImage: true } },
      questionTags: { include: { tag: true } },
      images: true,
      answers: {
        include: { user: { select: { id: true, nickname: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
};

// 오래된순(ASC) 페이징
export const getQuestionsOldest = async ({ skip = 0, take = 20 } = {}) => {
  return await prisma.question.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, nickname: true, profileImage: true } },
      questionTags: { include: { tag: true } },
      images: true,
    },
    skip,
    take,
  });
};