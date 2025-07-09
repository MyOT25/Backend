import * as questionRepository from '../repositories/question.repository.js';

export const registerQuestion = async (userId, title, content) => {
  // ✨ 추가 비즈니스 로직이 있다면 여기에 작성
  // 예: 질문 수가 하루 10개 이상이면 차단 등
  console.log('등록 요청 들어옴', userId, title, content); 
  const newQuestion = await questionRepository.createQuestion({
    userId,
    title,
    content,
  });

  
  return newQuestion;
};


export const getQuestionList = async () => {
  return await questionRepository.getAllQuestions();
};

export const registerAnswer = async (questionId, userId, content) => {
  const question = await questionRepository.getQuestionById(questionId);
  if (!question) {
    throw {
      errorCode: 'Q404',
      reason: '존재하지 않는 질문입니다.',
    };
  }

  return await questionRepository.createAnswer(questionId, userId, content);
};

export const getQuestionDetail = async (questionId) => {
  return await questionRepository.getQuestionDetail(questionId);
};