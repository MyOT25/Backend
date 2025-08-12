import prisma from "../config/prismaClient.js";

export const getMessagesByChatRoomId = async ({ chatRoomId, cursor, limit = 30 }) => {
  const messages = await prisma.message.findMany({
    where: {
      chatRoomId: Number(chatRoomId),
    },
    take: limit,
    ...(cursor && {
      skip: 1,
      cursor: { id: Number(cursor) },
    }),
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sender: {
        select: {
          id: true,
          nickname: true,
        },
      },
      readUsers: {
        select: {
          userId: true,
        },
      },
    },
  });

  const nextCursor = messages.length === limit ? messages[limit - 1].id : null;

  return {
    messages,
    nextCursor,
  };
};
