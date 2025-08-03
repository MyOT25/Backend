import * as questionRepository from '../repositories/question.repository.js';
import { AnswerRepository } from '../repositories/answer.repository.js';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

const registerQuestion = async (userId, title, content, tagIds, imageUrls = []) => {
  // ✅ 문자열로 들어온 tagIds 처리
  let parsedTagIds = tagIds;
  if (typeof tagIds === 'string') {
    try {
      parsedTagIds = JSON.parse(tagIds);
    } catch {
      throw {
        errorCode: 'Q101',
        reason: 'tagIds는 JSON 배열 형식이어야 합니다.',
      };
    }
  }

  if (!userId || !title || !content || !Array.isArray(parsedTagIds)) {
    throw {
      errorCode: 'Q100',
      reason: 'userId, title, content, tagIds는 모두 필수입니다.',
    };
  }

  const newQuestion = await questionRepository.createQuestion({
    userId,
    title,
    content,
  });

  // ✅ tagIds → parsedTagIds 사용
  await questionRepository.createQuestionTags(newQuestion.id, userId, parsedTagIds);

  if (imageUrls.length > 0) {
    await questionRepository.createQuestionImages(newQuestion.id, userId, imageUrls);
  }

  const fullQuestion = await questionRepository.getQuestionDetail(newQuestion.id);
  return formatQuestionDetail(fullQuestion);
};

// ───────── 질문 목록/상세 조회 ─────────
const getQuestionList = async () => {
  const questions = await questionRepository.getAllQuestions();
  return questions.map(formatQuestionSummary);
};

const getQuestionDetail = async (questionId) => {
  const question = await questionRepository.getQuestionDetail(questionId);
  console.log('✅ question.questionTags:', JSON.stringify(question.questionTags, null, 2));
  if (!question) {
    throw { errorCode: 'Q404', reason: '존재하지 않는 질문입니다.' };
  }
  return formatQuestionDetail(question);
};

// ───────── 질문 삭제 ─────────
const deleteQuestion = async (questionId, userId) => {
  const question = await questionRepository.getQuestionById(questionId);
  if (!question) {
    throw { errorCode: 'Q404', reason: '존재하지 않는 질문입니다.' };
  }
  if (question.userId !== userId) {
    throw { errorCode: 'Q403', reason: '삭제 권한이 없습니다.' };
  }
  await questionRepository.deleteQuestion(questionId);
};

// ───────── 좋아요 ─────────
const likeQuestion = async (questionId, userId) => {
  const existing = await questionRepository.findQuestionLike(questionId, userId);
  if (existing) {
    throw { errorCode: 'ALREADY_LIKED', reason: '이미 좋아요한 질문입니다.' };
  }
  return await questionRepository.likeQuestion(questionId, userId);
};

const unlikeQuestion = async (questionId, userId) => {
  const existing = await questionRepository.findQuestionLike(questionId, userId);
  if (!existing) {
    throw { errorCode: 'LIKE_NOT_FOUND', reason: '좋아요한 적이 없습니다.' };
  }
  return await questionRepository.unlikeQuestion(questionId, userId);
};

const getQuestionLikeCount = async (questionId) => {
  return await questionRepository.getQuestionLikeCount(questionId);
};

// ───────── 답변 등록 ─────────
const registerAnswer = async (questionId, userId, content) => {
  const question = await questionRepository.getQuestionById(questionId);
  if (!question) {
    throw { errorCode: 'Q404', reason: '존재하지 않는 질문입니다.' };
  }
  return await AnswerRepository.createAnswer(prisma, {
    questionId,
    userId,
    content,
  });
};

// ───────── 응답 구조 Formatter ─────────

export const formatQuestionSummary = (q) => ({
  id: q.id,
  title: q.title,
  content: q.content,
  imageUrl: q.images?.[0]?.imageUrl || null,
  tagList: q.questionTags
    .map((qt) => qt.tag?.tagName)
    .filter((t) => t !== undefined && t !== null),
  createdAt: q.createdAt,
  user: {
    id: q.user.id,
    username: q.user.nickname,
    profileImage: q.user.profileImage || null,
  },
});

const formatQuestionDetail = (q) => ({
  id: q.id,
  title: q.title,
  content: q.content,
  imageUrl: q.images?.map((img) => img.imageUrl) ?? [],
  tagList: q.questionTags .map((qt) => qt.tag?.tagName)
    .filter((t) => t !== undefined && t !== null),
  createdAt: q.createdAt,
  user: {
    id: q.user.id,
    username: q.user.nickname,
    profileImage: q.user.profileImage || null,
  },
  answers: q.answers?.map(a => ({
    id: a.id,
    content: a.content,
    createdAt: a.createdAt,
    user: { id: a.user.id, username: a.user.nickname },
  })) ?? [],
});



// ───────── 서비스 객체 Export ─────────
export const QuestionService = {
  registerQuestion,
  getQuestionList,
  getQuestionDetail,
  deleteQuestion,
  likeQuestion,
  unlikeQuestion,
  getQuestionLikeCount,
  registerAnswer,
};
