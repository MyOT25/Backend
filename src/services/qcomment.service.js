import * as qcommentRepo from '../repositories/qcomment.repository.js';
import { maskAuthor } from '../middlewares/mask.js';

const formatComment = (row) => ({
  id: row.id,
  content: row.content,
  isAnonymous: Boolean(row.isAnonymous),
  createdAt: row.createdAt,
  user: maskAuthor(row.user, Boolean(row.isAnonymous)),
});

// ── 질문 댓글 ─────────────────────────────────────────────
const addQuestionComment = async (questionId, userId, content, isAnonymous = false) => {
  if (!content?.trim()) throw { errorCode: 'QC100', reason: 'content는 필수입니다.' };
  const created = await commentRepo.createQuestionComment({ questionId, userId, content, isAnonymous });
  // 작성자 정보 포함 응답 위해 다시 조회
  const [full] = await commentRepo.getQuestionComments(questionId, { skip: 0, take: 1 });
  return formatComment(full ?? created);
};

const listQuestionComments = async (questionId, { page = 1, size = 20 } = {}) => {
  const take = Math.min(Math.max(size, 1), 50);
  const skip = (Math.max(page, 1) - 1) * take;
  const [rows, total] = await Promise.all([
    commentRepo.getQuestionComments(questionId, { skip, take }),
    commentRepo.countQuestionComments(questionId),
  ]);
  return {
    page, size: take, total,
    comments: rows.map(formatComment),
  };
};

const removeQuestionComment = async (commentId, requesterId, isAdmin = false) => {
  const found = await commentRepo.findQuestionCommentById(commentId);
  if (!found) throw { errorCode: 'QC404', reason: '댓글을 찾을 수 없습니다.' };
  if (!isAdmin && found.userId !== requesterId) {
    throw { errorCode: 'QC403', reason: '삭제 권한이 없습니다.' };
  }
  await commentRepo.deleteQuestionComment(commentId);
};

// ── 답변 댓글 ─────────────────────────────────────────────
const addAnswerComment = async (answerId, userId, content, isAnonymous = false) => {
  if (!content?.trim()) throw { errorCode: 'AC100', reason: 'content는 필수입니다.' };
  const created = await commentRepo.createAnswerComment({ answerId, userId, content, isAnonymous });
  const [full] = await commentRepo.getAnswerComments(answerId, { skip: 0, take: 1 });
  return formatComment(full ?? created);
};

const listAnswerComments = async (answerId, { page = 1, size = 20 } = {}) => {
  const take = Math.min(Math.max(size, 1), 50);
  const skip = (Math.max(page, 1) - 1) * take;
  const [rows, total] = await Promise.all([
    commentRepo.getAnswerComments(answerId, { skip, take }),
    commentRepo.countAnswerComments(answerId),
  ]);
  return {
    page, size: take, total,
    comments: rows.map(formatComment),
  };
};

const removeAnswerComment = async (commentId, requesterId, isAdmin = false) => {
  const found = await commentRepo.findAnswerCommentById(commentId);
  if (!found) throw { errorCode: 'AC404', reason: '댓글을 찾을 수 없습니다.' };
  if (!isAdmin && found.userId !== requesterId) {
    throw { errorCode: 'AC403', reason: '삭제 권한이 없습니다.' };
  }
  await commentRepo.deleteAnswerComment(commentId);
};

const ensureBelongs = async (questionId, commentId) => {
  const c = await qcommentRepo.findCommentById(commentId);
  if (!c || c.questionId !== Number(questionId)) {
    throw { errorCode: 'QC404', reason: '댓글을 찾을 수 없습니다.' };
  }
};

const likeQuestionComment = async (questionId, commentId, userId) => {
  await ensureBelongs(questionId, commentId);
  const existing = await qcommentRepo.findCommentLike(commentId, userId);
  if (existing) throw { errorCode: 'ALREADY_LIKED', reason: '이미 좋아요한 댓글입니다.' };
  return qcommentRepo.likeComment(commentId, userId);
};

const unlikeQuestionComment = async (questionId, commentId, userId) => {
  await ensureBelongs(questionId, commentId);
  const existing = await qcommentRepo.findCommentLike(commentId, userId);
  if (!existing) throw { errorCode: 'LIKE_NOT_FOUND', reason: '좋아요한 적이 없습니다.' };
  return qcommentRepo.unlikeComment(commentId, userId);
};

const getQuestionCommentLikeCount = async (questionId, commentId) => {
  await ensureBelongs(questionId, commentId);
  return qcommentRepo.countCommentLikes(commentId);
};

const hasLikedQuestionComment = async (questionId, commentId, userId) => {
  await ensureBelongs(questionId, commentId);
  const row = await qcommentRepo.findCommentLike(commentId, userId);
  return !!row; // Boolean
};

export const CommentService = {
  addQuestionComment,
  listQuestionComments,
  removeQuestionComment,
  addAnswerComment,
  listAnswerComments,
  removeAnswerComment,
  likeQuestionComment,
  unlikeQuestionComment,
  getQuestionCommentLikeCount,
  hasLikedQuestionComment,
};
