import * as questionRepository from '../repositories/question.repository.js';
import { AnswerRepository } from '../repositories/answer.repository.js'; // ✅ 추가
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


export const registerQuestion = async (userId, title, content, tagIds) => {
  if (!userId || !title || !content || !Array.isArray(tagIds)) {
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

  await questionRepository.createQuestionTags(
    newQuestion.id,
    userId,
    tagIds
  );

  const fullQuestion = await questionRepository.getQuestionDetail(newQuestion.id);

  return fullQuestion;
};

export const getQuestionList = async () => {
  return await questionRepository.getAllQuestions();
};

export const getQuestionDetail = async (questionId) => {
  const question = await questionRepository.getQuestionDetail(questionId);
  if (!question) {
    throw {
      errorCode: 'Q404',
      reason: '존재하지 않는 질문입니다.',
    };
  }
  return question;
};

export const likeQuestion = async (questionId, userId) => {
  const existing = await questionRepository.findQuestionLike(questionId, userId);
  if (existing) {
    throw {
      errorCode: 'ALREADY_LIKED',
      reason: '이미 좋아요한 질문입니다.',
    };
  }
  return await questionRepository.createQuestionLike(questionId, userId);
};

export const unlikeQuestion = async (questionId, userId) => {
  const existing = await questionRepository.findQuestionLike(questionId, userId);
  if (!existing) {
    throw {
      errorCode: 'LIKE_NOT_FOUND',
      reason: '좋아요한 적이 없습니다.',
    };
  }
  return await questionRepository.deleteQuestionLike(questionId, userId);
};

export const getQuestionLikeCount = async (questionId) => {
  return await questionRepository.countQuestionLikes(questionId);
};


export const registerAnswer = async (questionId, userId, content) => {
  // 질문 존재 여부 먼저 체크
  const question = await questionRepository.getQuestionById(questionId);
  if (!question) {
    throw {
      errorCode: 'Q404',
      reason: '존재하지 않는 질문입니다.',
    };
  }

  // 답변 등록 (AnswerRepository 활용)
  return await AnswerRepository.createAnswer(prisma, {
    questionId,
    userId,
    content,
  });
};

export const deleteQuestion = async (questionId, userId) => {
  const question = await questionRepository.getQuestionById(questionId);
  if (!question) {
    throw { errorCode: 'Q404', reason: '존재하지 않는 질문입니다.' };
  }
  if (question.userId !== userId) {
    throw { errorCode: 'Q403', reason: '삭제 권한이 없습니다.' };
  }

  // 삭제
  await questionRepository.deleteQuestion(questionId);
};


export const QuestionService = {
  registerQuestion,
  getQuestionList,
  registerAnswer,
  getQuestionDetail,
  deleteQuestion,
};

