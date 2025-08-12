import * as questionRepository from '../repositories/question.repository.js';
import * as commentRepository from '../repositories/qcomment.repository.js'; 
import { PrismaClient } from '@prisma/client';
import { maskAuthor } from '../middlewares/mask.js';

const prisma = new PrismaClient();

// 내부 헬퍼: 답변 좋아요 개수
const countAnswerLikes = (answerId) =>
  prisma.answerLike.count({ where: { answerId: Number(answerId) } });

/**
 * 질문 등록 (그대로)
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

  // ✅ 익명 여부 저장
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
  return formatQuestionDetail(fullQuestion); // 상세는 아래 getQuestionDetail 로직과 동일 포맷을 쓰고 싶다면 이 부분을 변경해도 OK
};

// ───────── 질문 목록/상세 조회 ─────────
const getQuestionList = async () => {
  const questions = await questionRepository.getAllQuestions();

  // ✅ 각 질문에 likeCount / commentCount 주입
  const withCounts = await Promise.all(
    questions.map(async (q) => {
      const [likeCount, commentCount] = await Promise.all([
        questionRepository.getQuestionLikeCount(q.id),
        commentRepository.countQuestionComments(q.id),
      ]);
      const base = formatQuestionSummary(q);
      return { ...base, likeCount, commentCount }; // ← 목록 응답에 포함
    })
  );

  return withCounts;
};

const getQuestionDetail = async (questionId) => {
  const q = await questionRepository.getQuestionDetail(questionId);
  if (!q) throw { errorCode: 'Q404', reason: '존재하지 않는 질문입니다.' };

  // ✅ 질문의 likeCount / commentCount
  const [likeCount, commentCount] = await Promise.all([
    questionRepository.getQuestionLikeCount(q.id),
    commentRepository.countQuestionComments(q.id),
  ]);

  // ✅ 각 답변에 likeCount / commentCount 주입
  const answersWithCounts = await Promise.all(
    (q.answers ?? []).map(async (a) => {
      const [aLikeCount, aCommentCount] = await Promise.all([
        countAnswerLikes(a.id),                 // 답변 좋아요 개수
        commentRepository.countAnswerComments(a.id), // 답변 댓글 개수
      ]);
      return {
        id: a.id,
        content: a.content,
        isAnonymous: Boolean(a.isAnonymous),
        createdAt: a.createdAt,
        user: maskAuthor(a.user, Boolean(a.isAnonymous)),
        likeCount: aLikeCount,
        commentCount: aCommentCount,
      };
    })
  );

  const base = formatQuestionDetail({ ...q, answers: [] });
  return { ...base, likeCount, commentCount, answers: answersWithCounts };
};

// ───────── 질문 삭제/좋아요 (그대로) ─────────
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

// ───────── Formatter (기존 그대로) ─────────
export const formatQuestionSummary = (q) => ({
  id: q.id,
  title: q.title,
  content: q.content,
  thumbnailUrl: q.images?.[0]?.imageUrl || null,
  tagList: (q.questionTags ?? [])
    .map((qt) => qt.tag?.tagName)
    .filter((t) => t !== undefined && t !== null),
  isAnonymous: Boolean(q.isAnonymous),
  createdAt: q.createdAt,
  user: maskAuthor(q.user, Boolean(q.isAnonymous)),
});

const formatQuestionDetail = (q) => ({
  id: q.id,
  title: q.title,
  content: q.content,
  imageUrl: q.images?.map((img) => img.imageUrl) ?? [],
  tagList: (q.questionTags ?? [])
    .map((qt) => qt.tag?.tagName)
    .filter((t) => t !== undefined && t !== null),
  isAnonymous: Boolean(q.isAnonymous),
  createdAt: q.createdAt,
  user: maskAuthor(q.user, Boolean(q.isAnonymous)),
  // answers는 getQuestionDetail에서 likeCount/commentCount 주입해서 리턴
  answers:
    (q.answers ?? []).map((a) => ({
      id: a.id,
      content: a.content,
      isAnonymous: Boolean(a.isAnonymous),
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
