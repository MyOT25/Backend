import * as commentRepo from '../repositories/qcomment.repository.js';
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

export const CommentService = {
  addQuestionComment,
  listQuestionComments,
  removeQuestionComment,
  addAnswerComment,
  listAnswerComments,
  removeAnswerComment,
};
