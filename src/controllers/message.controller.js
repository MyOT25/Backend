import { getMessagesByChatRoomId } from "../services/message.service.js";
// 메세지 조회 API
/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: 메시지 목록 조회
 *     description: 특정 채팅방에서 메시지를 커서 기반으로 조회합니다.
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chatRoomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *       - in: query
 *         name: cursor
 *         required: false
 *         schema:
 *           type: integer
 *         description: 마지막으로 조회한 메시지 ID (커서)
 *     responses:
 *       200:
 *         description: 메시지 조회 성공
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
 *                       example: 메시지 조회 성공
 *                     data:
 *                       type: object
 *                       properties:
 *                         messages:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 50
 *                               content:
 *                                 type: string
 *                                 example: 안녕하세요
 *                               senderId:
 *                                 type: integer
 *                                 example: 1
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                         nextCursor:
 *                           type: integer
 *                           nullable: true
 *                           example: 49
 */

export const getMessages = async (req, res, next) => {
  try {
    const { chatRoomId, cursor } = req.query;
    const userId = req.user.id;

    if (!chatRoomId) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "M001",
          reason: "chatRoomId는 필수입니다.",
          data: null,
        },
        success: null,
      });
    }

    const { messages, nextCursor } = await getMessagesByChatRoomId({
      chatRoomId,
      cursor,
      limit: 30,
    });

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: {
        message: "메시지 조회 성공",
        data: {
          messages,
          nextCursor,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
