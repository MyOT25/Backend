import { createChatRoomService,
getChatRoomsByUserId,sendMessageService } from "../services/chat.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import prisma from "../config/prismaClient.js";
// 채팅방 생성 API
export const createChatRoomController = async (req, res) => {
  try {
    const userId = req.user.id; // 로그인된 유저 ID (JWT 인증에서 추출)
    const { type, opponentId, userIds, name } = req.body;

    // 1:1이면 상대방 하나만 받고, 그룹이면 명시적 배열 받아야 함
    const participantIds =
      type === "ONE_TO_ONE" ? [userId, opponentId] : [userId, ...userIds];

    const { existing, chatRoom } = await createChatRoomService({
      type,
      userIds: participantIds,
      name,
    });

    return res.status(existing ? 200 : 201).json({
      resultType: "SUCCESS",
      error: null,
      success: {
        message: existing
          ? "기존 1:1 채팅방이 존재하여 반환합니다."
          : "채팅방 생성 완료",
        data: {
          chatRoomId: chatRoom.id,
          type: chatRoom.type,
          name: chatRoom.name,
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({
      resultType: "FAIL",
      error: {
        message: err.message || "서버 오류가 발생했습니다.",
      },
      success: null,
    });
  }
};

// 채팅방 조회 API
export const getChatRoomListController = async (req, res, next) => {
    try {
      const userId = req.user.id;
  
      const rooms = await getChatRoomsByUserId(userId);
  
      return res.status(200).json({
        resultType: "SUCCESS",
        error: null,
        success: {
          message: "채팅방 목록 조회 성공",
          data: rooms,
        },
      });
    } catch (err) {
      next(err);
    }
  };

// 메세지 전송 API
export const sendMessage = asyncHandler(async (req, res) => {
    const senderId = req.user.id;
    const { chatRoomId, content } = req.body;
  
    const message = await sendMessageService({ chatRoomId, senderId, content });
  
    return res.status(200).json({
        resultType: "SUCCESS",
        error: null,
        success: {
          message: "메시지 전송 성공",
          data: message,
        },
      });
  });
  