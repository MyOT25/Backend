import prisma from '../config/prismaClient.js';

class BookmarkRepository {
  // 북마크 생성
  async createBookmark(userId, postId) {
    const pid = Number(postId);

    return prisma.$transaction(async (tx) => {
      // 이미 북마크 되어 있으면 count만 조회해서 리턴
      const exists = await tx.postBookmark.findUnique({
        where: { userId_postId: { userId, postId: pid } },
      });
      if (exists) {
        const cur = await tx.post.findUnique({
          where: { id: pid },
          select: { bookmarkCount: true },
        });
        return { created: false, bookmarkCount: cur?.bookmarkCount ?? 0 };
      }

      // 북마크 생성
      await tx.postBookmark.create({ data: { userId, postId: pid } });

      // Post.bookmarkCount +1
      const updated = await tx.post.update({
        where: { id: pid },
        data: { bookmarkCount: { increment: 1 } },
        select: { bookmarkCount: true },
      });

      return { created: true, bookmarkCount: updated.bookmarkCount };
    });
  }

  // 북마크 제거
  async deleteBookmark(userId, postId) {
    const pid = Number(postId);

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.postBookmark.deleteMany({
        where: { userId, postId: pid },
      });

      if (deleted.count === 0) {
        const cur = await tx.post.findUnique({
          where: { id: pid },
          select: { bookmarkCount: true },
        });
        return { deleted: false, bookmarkCount: cur?.bookmarkCount ?? 0 };
      }

      const updated = await tx.post.update({
        where: { id: pid },
        data: { bookmarkCount: { decrement: deleted.count } },
        select: { bookmarkCount: true },
      });

      return { deleted: true, bookmarkCount: updated.bookmarkCount };
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
        post: { createdAt: 'desc' }, // post의 createdAt 기준으로 정렬
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
