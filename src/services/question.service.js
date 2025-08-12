// src/services/question.service.js
import * as questionRepository from '../repositories/question.repository.js';
import { PrismaClient } from '@prisma/client';
import { maskAuthor } from '../middlewares/mask.js';

const prisma = new PrismaClient();

// 답변 좋아요 개수 (답변에는 댓글 기능 제거, 좋아요만 유지)
const countAnswerLikes = (answerId) =>
  prisma.answerLike.count({ where: { answerId: Number(answerId) } });

/**
 * 질문 등록
 */
const registerQuestion = async (
  userId,
  title,
  content,
  tagIds,
  imageUrls = [],
  isAnonymous = false
) => {
  // tagIds 문자열 허용
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

  const newQuestion = await questionRepository.createQuestion({
    authorId: userId,
    title,
    content,
    isAnonymous: Boolean(isAnonymous),
  });

  await questionRepository.createQuestionTags(newQuestion.id, userId, parsedTagIds);

  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    await questionRepository.createQuestionImages(newQuestion.id, userId, imageUrls);
  }

  const fullQuestion = await questionRepository.getQuestionDetail(newQuestion.id);
  return formatQuestionDetail(fullQuestion);
};

// ───────── 질문 목록/상세 조회 ─────────

// 목록: 질문별 like/comment를 DB에서 한 번에 집계해서 합성
const getQuestionList = async () => {
  const questions = await questionRepository.getAllQuestions();
  const qIds = questions.map((q) => q.id);

  // ✅ 배치 집계 (N+1 회피)
  const [likeAgg, commentAgg] = await Promise.all([
    prisma.questionLike.groupBy({
      by: ['questionId'],
      _count: { _all: true },
      where: { questionId: { in: qIds } },
    }),
    prisma.questionComment.groupBy({
      by: ['questionId'],
      _count: { _all: true },
      where: { questionId: { in: qIds } },
    }),
  ]);

  const likeMap = new Map(likeAgg.map((r) => [r.questionId, r._count._all]));
  const commentMap = new Map(commentAgg.map((r) => [r.questionId, r._count._all]));

  return questions.map((q) => ({
    ...formatQuestionSummary(q),
    likeCount: likeMap.get(q.id) ?? 0,
    commentCount: commentMap.get(q.id) ?? 0, // ✅ 질문 댓글 수만 유지
  }));
};

// 상세: 질문의 like/comment 집계 + 답변엔 like만
const getQuestionDetail = async (questionId) => {
  const q = await questionRepository.getQuestionDetail(questionId);
  if (!q) throw { errorCode: 'Q404', reason: '존재하지 않는 질문입니다.' };

  const [likeCount, commentCount] = await Promise.all([
    prisma.questionLike.count({ where: { questionId: q.id } }),
    prisma.questionComment.count({ where: { questionId: q.id } }), // ✅ 질문 댓글만
  ]);

  // 답변에는 댓글 기능 제거 → likeCount만 붙임
  const answersWithLike = await Promise.all(
    (q.answers ?? []).map(async (a) => {
      const aLikeCount = await countAnswerLikes(a.id);
      return {
        id: a.id,
        content: a.content,
        isAnonymous: Boolean(a.isAnonymous),
        createdAt: a.createdAt,
        user: maskAuthor(a.user, Boolean(a.isAnonymous)),
        likeCount: aLikeCount, // ✅ 답변 댓글 카운트는 없음
      };
    })
  );

  const base = formatQuestionDetail({ ...q, answers: [] });
  return { ...base, likeCount, commentCount, answers: answersWithLike };
};

// ───────── 질문 삭제/좋아요 ─────────
const deleteQuestion = async (questionId, userId) => {
  const question = await questionRepository.getQuestionById(questionId);
  if (!question) throw { errorCode: 'Q404', reason: '존재하지 않는 질문입니다.' };
  if (question.userId !== userId) throw { errorCode: 'Q403', reason: '삭제 권한이 없습니다.' };
  await questionRepository.deleteQuestion(questionId);
};

const likeQuestion = async (questionId, userId) => {
  const existing = await questionRepository.findQuestionLike(questionId, userId);
  if (existing) throw { errorCode: 'ALREADY_LIKED', reason: '이미 좋아요한 질문입니다.' };
  return await questionRepository.likeQuestion(questionId, userId);
};

const unlikeQuestion = async (questionId, userId) => {
  const existing = await questionRepository.findQuestionLike(questionId, userId);
  if (!existing) throw { errorCode: 'LIKE_NOT_FOUND', reason: '좋아요한 적이 없습니다.' };
  return await questionRepository.unlikeQuestion(questionId, userId);
};

const getQuestionLikeCount = async (questionId) => {
  return await questionRepository.getQuestionLikeCount(questionId);
};

// ───────── Formatter ─────────
export const formatQuestionSummary = (q) => ({
  id: q.id,
  title: q.title,
  content: q.content,
  thumbnailUrl: q.images?.[0]?.imageUrl || null, // 목록에선 썸네일 1장
  tagList: (q.questionTags ?? [])
    .map((qt) => qt.tag?.tagName)
    .filter((t) => t != null),
  isAnonymous: Boolean(q.isAnonymous),
  createdAt: q.createdAt,
  user: maskAuthor(q.user, Boolean(q.isAnonymous)),
});

const formatQuestionDetail = (q) => ({
  id: q.id,
  title: q.title,
  content: q.content,
  imageUrl: q.images?.map((img) => img.imageUrl) ?? [], // 상세는 모든 이미지
  tagList: (q.questionTags ?? [])
    .map((qt) => qt.tag?.tagName)
    .filter((t) => t != null),
  isAnonymous: Boolean(q.isAnonymous),
  createdAt: q.createdAt,
  user: maskAuthor(q.user, Boolean(q.isAnonymous)),
  // answers는 getQuestionDetail에서 likeCount만 주입해서 리턴
  answers: (q.answers ?? []).map((a) => ({
    id: a.id,
    content: a.content,
    isAnonymous: Boolean(a.isAnonymous),
    createdAt: a.createdAt,
    user: maskAuthor(a.user, Boolean(a.isAnonymous)),
  })),
});

// ───────── Export ─────────
export const QuestionService = {
  registerQuestion,
  getQuestionList,
  getQuestionDetail,
  deleteQuestion,
  likeQuestion,
  unlikeQuestion,
  getQuestionLikeCount,
};
