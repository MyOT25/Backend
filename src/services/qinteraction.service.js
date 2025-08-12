// src/services/interaction.service.js
import * as questionRepository from '../repositories/question.repository.js';
import * as qcommentRepository from '../repositories/qcomment.repository.js';
import { AnswerRepository } from '../repositories/answer.repository.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getQuestionMyStatus = async (questionId, userId) => {
  const [likedRow, commented] = await Promise.all([
    questionRepository.findQuestionLike(Number(questionId), Number(userId)),
    qcommentRepository.existsQuestionCommentByUser(Number(questionId), Number(userId)),
  ]);
  return { hasLiked: !!likedRow, hasCommented: !!commented };
};

const getAnswerMyStatus = async (answerId, userId) => {
  const likedRow = await AnswerRepository.findAnswerLike(prisma, Number(answerId), Number(userId));
  return { hasLiked: !!likedRow }; // 답변 댓글 기능은 없음
};

export const InteractionService = {
  getQuestionMyStatus,
  getAnswerMyStatus,
};
