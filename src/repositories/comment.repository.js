import prisma from '../config/prismaClient.js';

class CommentRepository {
  async createComment(userId, postId, content) {
    console.log(userId);
    return await prisma.postComment.create({
      data: {
        content,
        user: {
          connect: { id: userId },
        },
        post: {
          connect: { id: postId },
        },
      },
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
    return await prisma.postComment.delete({
      where: { id: commentId },
    });
  }

  async findCommentById(commentId) {
    return await prisma.postComment.findUnique({
      where: { id: commentId },
    });
  }
}

export default new CommentRepository();
