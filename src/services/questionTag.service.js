import { QuestionTagRepository } from '../repositories/questionTag.repository.js';

export const QuestionTagService = {
  getAllTags: async () => {
    return await QuestionTagRepository.findAllTags();
  },
};
