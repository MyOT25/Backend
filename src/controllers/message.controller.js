import { getMessagesByChatRoomId } from "../services/message.service.js";

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
