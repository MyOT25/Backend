import { QuestionTagRepository } from '../repositories/questionTag.repository.js';
// questionTag.service.js
import { formatQuestionSummary } from './question.service.js';


export const QuestionTagService = {
  getAllTags: async () => {
    return await QuestionTagRepository.findAllTags();
  },

  getQuestionsByTags: async (tagIds) => {
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      throw new Error('유효하지 않은 tagIds');
    }
    const questions = await QuestionTagRepository.findQuestionsByTagIds(tagIds);
    return questions.map(formatQuestionSummary);
   
  },
};
