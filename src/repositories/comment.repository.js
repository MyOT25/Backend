import prisma from '../config/prismaClient.js';

class CommentRepository {
  async createComment(userId, postId, content) {
    const pid = Number(postId);

    return prisma.$transaction(async (tx) => {
      const comment = await tx.postComment.create({
        data: {
          content,
          user: { connect: { id: userId } },
          post: { connect: { id: pid } },
        },
        select: { id: true, postId: true, content: true, createdAt: true },
      });

      const updated = await tx.post.update({
        where: { id: pid },
        data: { commentCount: { increment: 1 } },
        select: { id: true, commentCount: true },
      });

      // 원하는 경우 현재 카운트를 함께 리턴
      return { comment, commentCount: updated.commentCount };
    });
  }

  async getCommentsByPostId(postId) {
    return await prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: { user: true }, // 댓글 작성자 정보 포함
    });
  }

  async updateComment(commentId, content) {
    return await prisma.postComment.update({
      where: { id: commentId },
      data: { content },
    });
  }

  async deleteComment(commentId) {
    const cid = Number(commentId);

    return prisma.$transaction(async (tx) => {
      // 어떤 게시물의 댓글인지 먼저 확인
      const target = await tx.postComment.findUnique({
        where: { id: cid },
        select: { id: true, postId: true },
      });
      if (!target) {
        return { deleted: false, commentCount: null };
      }

      // 댓글 삭제
      await tx.postComment.delete({ where: { id: cid } });

      // 카운트 감소
      const updated = await tx.post.update({
        where: { id: target.postId },
        data: { commentCount: { decrement: 1 } },
        select: { id: true, commentCount: true },
      });

      return { deleted: true, commentCount: updated.commentCount };
    });
  }

  async findCommentById(commentId) {
    return await prisma.postComment.findUnique({
      where: { id: commentId },
    });
  }
}

export default new CommentRepository();
