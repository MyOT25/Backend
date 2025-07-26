import prisma from '../config/prismaClient.js';

class BookmarkRepository {
  // 북마크 생성
  async createBookmark(userId, postId) {
    return await prisma.postBookmark.create({
      data: { userId, postId },
    });
  }

  // 북마크 제거
  async deleteBookmark(userId, postId) {
    return await prisma.postBookmark.delete({
      where: {
        userId_postId: { userId, postId },
      },
    });
  }

  // 게시물 북마크 여부 체크
  async isBookmarked(userId, postId) {
    return await prisma.postBookmark.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });
  }
}

export default new BookmarkRepository();
