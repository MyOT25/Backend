import prisma from "../config/prismaClient.js";

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

  // 북마크 게시글 조회
  async getBookmarkPosts(userId, skip = 0, take = 10) {
    return prisma.postBookmark.findMany({
      where: { userId },
      orderBy: {
        post: { createdAt: "desc" }, // post의 createdAt 기준으로 정렬
      },
      skip,
      take,
      select: {
        post: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            commentCount: true,
            likeCount: true,
            repostCount: true,
            bookmarkCount: true,
            isRepost: true,
            repostType: true,
            user: { select: { id: true, nickname: true, profileImage: true } },
            postImages: { select: { url: true } },
            community: { select: { id: true, type: true, coverImage: true } },
            postLikes: { where: { userId }, select: { id: true } },
            postBookmarks: { where: { userId }, select: { id: true } },
            repostTarget: {
              select: {
                id: true,
                content: true,
                createdAt: true,
                user: {
                  select: { id: true, nickname: true, profileImage: true },
                },
                postImages: { select: { url: true } },
                community: {
                  select: { id: true, type: true, coverImage: true },
                },
              },
            },
          },
        },
      },
    });
  }
}

export default new BookmarkRepository();
