import { createChatRoomService,
getChatRoomsByUserId,sendMessageService } from "../services/chat.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import prisma from "../config/prismaClient.js";

// 채팅방 생성 API
/**
 * @swagger
 * /api/chatrooms:
 *   post:
 *     summary: 채팅방 생성
 *     description: 새로운 채팅방을 생성합니다.
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [ONE_TO_ONE, GROUP]
 *                 example: ONE_TO_ONE
 *               opponentId:
 *                 type: integer
 *                 example: 2
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2, 3]
 *               name:
 *                 type: string
 *                 example: 그룹채팅방 이름
 *     responses:
 *       201:
 *         description: 채팅방 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 채팅방 생성 완료
 *                     data:
 *                       type: object
 *                       properties:
 *                         chatRoomId:
 *                           type: integer
 *                           example: 1
 *                         type:
 *                           type: string
 *                           example: ONE_TO_ONE
 *                         name:
 *                           type: string
 *                           example: null
 */

export const createChatRoomController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, opponentId, userIds, name } = req.body;

    const participantIds =
      type === "ONE_TO_ONE" ? [userId, opponentId] : [userId, ...userIds];

    const { existing, chatRoom } = await createChatRoomService({
      type,
      userIds: participantIds,
      name,
    });

    const participants = chatRoom.users.map((u) => ({
      id: u.user.id,
      nickname: u.user.nickname,
    }));

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
          participants,
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
/**
 * @swagger
 * /api/chat/rooms:
 *   get:
 *     summary: 채팅방 목록 조회
 *     description: 로그인한 사용자의 채팅방 목록을 조회합니다.
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 채팅방 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 채팅방 목록 조회 성공
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: null
 *                           type:
 *                             type: string
 *                             example: ONE_TO_ONE
 */
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
/**
 * @swagger
 * /api/chat/send:
 *   post:
 *     summary: 메시지 전송
 *     description: 특정 채팅방에 메시지를 전송합니다.
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatRoomId:
 *                 type: integer
 *                 example: 1
 *               content:
 *                 type: string
 *                 example: 안녕하세요!
 *     responses:
 *       200:
 *         description: 메시지 전송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 메시지 전송 성공
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 10
 *                         content:
 *                           type: string
 *                           example: 안녕하세요!
 *                         senderId:
 *                           type: integer
 *                           example: 1
 *                         chatRoomId:
 *                           type: integer
 *                           example: 1
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 */

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
  