import * as questionRepository from '../repositories/question.repository.js';
import { AnswerRepository } from '../repositories/answer.repository.js';
import { PrismaClient } from '@prisma/client';
import { maskAuthor } from '../middlewares/mask.js';

const prisma = new PrismaClient();

/**
 * 질문 등록
 * - tagIds 문자열(JSON)도 허용
 * - imageUrls는 기존 로직 유지
 * - isAnonymous 추가
 */
const registerQuestion = async (
  userId,
  title,
  content,
  tagIds,
  imageUrls = [],
  isAnonymous = false
) => {
  // ✅ 문자열로 들어온 tagIds 처리
  let parsedTagIds = tagIds;
  if (typeof tagIds === 'string') {
    try {
      parsedTagIds = JSON.parse(tagIds);
    } catch {
      throw { errorCode: 'Q101', reason: 'tagIds는 JSON 배열 형식이어야 합니다.' };
    }
  }

  if (!userId || !title || !content || !Array.isArray(parsedTagIds)) {
    throw { errorCode: 'Q100', reason: 'userId, title, content, tagIds는 모두 필수입니다.' };
  }

  // ✅ 익명 여부 반영하여 저장 (레포지토리에서 isAnonymous 지원 필요)
  const newQuestion = await questionRepository.createQuestion({
    authorId: userId,
    title,
    content,
    isAnonymous: Boolean(isAnonymous),
  });

  // ✅ tagIds → parsedTagIds 사용
  await questionRepository.createQuestionTags(newQuestion.id, userId, parsedTagIds);

  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
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


// ───────── 응답 구조 Formatter ─────────

export const formatQuestionSummary = (q) => ({
  id: q.id,
  title: q.title,
  content: q.content,
  imageUrl: q.images?.[0]?.imageUrl || null,
  tagList:
    (q.questionTags ?? [])
      .map((qt) => qt.tag?.tagName)
      .filter((t) => t !== undefined && t !== null),
  isAnonymous: Boolean(q.isAnonymous), // ✅ 응답에 익명 여부 포함
  createdAt: q.createdAt,
  // ✅ 익명 여부에 따라 작성자 마스킹
  user: maskAuthor(q.user, Boolean(q.isAnonymous)),
});

const formatQuestionDetail = (q) => ({
  id: q.id,
  title: q.title,
  content: q.content,
  imageUrl: q.images?.map((img) => img.imageUrl) ?? [],
  tagList:
    (q.questionTags ?? [])
      .map((qt) => qt.tag?.tagName)
      .filter((t) => t !== undefined && t !== null),
  isAnonymous: Boolean(q.isAnonymous), // ✅ 응답에 익명 여부 포함
  createdAt: q.createdAt,
  // ✅ 익명 여부에 따라 작성자 마스킹
  user: maskAuthor(q.user, Boolean(q.isAnonymous)),
  // ✅ 각 답변의 익명 여부에 따라 작성자 마스킹
  answers:
    (q.answers ?? []).map((a) => ({
      id: a.id,
      content: a.content,
      isAnonymous: Boolean(a.isAnonymous), // ✅ 포함
      createdAt: a.createdAt,
      user: maskAuthor(a.user, Boolean(a.isAnonymous)),
    })),
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
};
