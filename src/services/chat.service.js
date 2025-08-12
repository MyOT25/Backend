import prisma from "../config/prismaClient.js";

// 채팅방 생성 API
export const createChatRoomService = async ({ type, userIds, name }) => {
  if (!type || !userIds || !Array.isArray(userIds) || userIds.length < 2) {
    throw { status: 400, message: "userIds는 2명 이상이어야 합니다." };
  }

  // ✅ 유저 존재 여부 검증
  const existingUsers = await prisma.user.findMany({
    where: { id: { in: userIds } },
  });

  if (existingUsers.length !== userIds.length) {
    const missing = userIds.filter(
      (id) => !existingUsers.find((u) => u.id === id)
    );
    throw {
      status: 400,
      message: `존재하지 않는 유저 ID: ${missing.join(", ")}`,
    };
  }

  // ✅ 1:1 채팅 중복 체크
  if (type === "ONE_TO_ONE") {
    const existing = await prisma.chatRoom.findFirst({
      where: {
        type: "ONE_TO_ONE",
        users: {
          every: {
            userId: { in: userIds },
          },
        },
      },
      include: {
        users: {
          include: { user: { select: { id: true, nickname: true } } },
        },
      },
    });

    if (existing && existing.users.length === 2) {
      return {
        existing: true,
        chatRoom: existing,
      };
    }
  }

  // ✅ 채팅방 생성
  const chatRoom = await prisma.chatRoom.create({
    data: {
      type,
      name: type === "GROUP" ? name : null,
      users: {
        create: userIds.map((userId) => ({
          user: { connect: { id: userId } },
        })),
      },
    },
    include: {
      users: {
        include: { user: { select: { id: true, nickname: true } } },
      },
    },
  });

  return {
    existing: false,
    chatRoom,
  };
};


// 채팅방 목록 조회 API
export const getChatRoomsByUserId = async (userId) => {
  const rooms = await prisma.chatRoom.findMany({
    where: {
      users: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      users: {
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return rooms.map((room) => {
    const participants = room.users.map((u) => ({
      id: u.user.id,
      nickname: u.user.nickname,
    }));

    // 1:1 채팅방의 경우 상대방 닉네임을 이름으로 사용
    let roomName = room.name;
    if (room.type === "ONE_TO_ONE" && (!room.name || room.name.trim() === "")) {
      const otherUser = room.users.find((u) => u.user.id !== userId);
      roomName = otherUser?.user.nickname || "이름 없는 채팅방";
    }

    const lastMessageObj = room.messages[0];

    return {
      chatRoomId: room.id,
      name: roomName,
      type: room.type,
      participants: participants,
      lastMessage: lastMessageObj ? {
        content: lastMessageObj.content,
        createdAt: lastMessageObj.createdAt,
      } : null,
    };
  });
};


// 메세지 전송 API
export const sendMessageService = async ({ chatRoomId, senderId, content }) => {
    // 메시지 생성
    const message = await prisma.message.create({
      data: {
        chatRoomId,
        senderId,
        content,
        readUsers: {
          create: { userId: senderId } // 메시지 보낸 사람은 바로 읽은 상태
        }
      }
    });
  
    // 채팅방 updatedAt 갱신
    await prisma.chatRoom.update({
      where: { id: chatRoomId },
      data: { updatedAt: new Date() }
    });
  
    return {
      messageId: message.id,
      chatRoomId: message.chatRoomId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt
    };
  };
  