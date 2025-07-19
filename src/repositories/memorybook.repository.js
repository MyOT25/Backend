import prisma from "../config/prismaClient.js";

export const createMemoryBook = async (userId, targetType, targetId, title, content) => {
  return await prisma.memoryBook.create({
    data: {
      userId,
      targetType,
      targetId,
      title,
      content,
    },
  });
};
