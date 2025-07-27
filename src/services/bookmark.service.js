import bookmarkRepository from '../repositories/bookmark.repository.js';
import { BadRequestError } from '../middlewares/CustomError.js';

// 북마크 추가
export const addBookmarkService = async (userId, postId) => {
  const exists = await bookmarkRepository.isBookmarked(userId, postId);
  if (exists) {
    throw new BadRequestError('이미 북마크한 게시글입니다.');
  }

  return await bookmarkRepository.createBookmark(userId, postId);
};

// 북마크 제거
export const removeBookmarkService = async (userId, postId) => {
  const exists = await bookmarkRepository.isBookmarked(userId, postId);
  if (!exists) {
    throw new BadRequestError('북마크하지 않은 게시글입니다.');
  }

  return await bookmarkRepository.deleteBookmark(userId, postId);
};
