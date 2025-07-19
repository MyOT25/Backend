import asyncHandler from "../middlewares/asyncHandler.js";
import { createMemoryBookService, 
  getMemoryBookService, 
  updateMemoryBookService } from "../services/memorybook.service.js";
import { BadRequestError } from "../middlewares/CustomError.js";

/**
 * POST /api/posts/memorybooks
 * 메모리북 생성
 */
/**
 * @swagger
 * /api/posts/memorybooks:
 *   post:
 *     summary: 메모리북 생성
 *     description: 뮤지컬 또는 배우에 대한 메모리북을 생성합니다.
 *     tags:
 *       - MemoryBook
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetType:
 *                 type: string
 *                 enum: [MUSICAL, ACTOR]
 *                 description: 메모리북 대상 유형 (뮤지컬 또는 배우)
 *               targetId:
 *                 type: integer
 *                 description: 대상 ID (뮤지컬 ID 또는 배우 ID)
 *               title:
 *                 type: string
 *                 description: 메모리북 제목
 *               content:
 *                 type: object
 *                 description: 메모리북 본문 (JSON 구조)
 *             required:
 *               - targetType
 *               - targetId
 *               - title
 *               - content
 *           example:
 *             targetType: MUSICAL
 *             targetId: 1
 *             title: "엘리자벳 후기"
 *             content:
 *               paragraphs:
 *                 - "정말 인생 뮤지컬이었습니다."
 *                 - "데스의 연기력이 미쳤어요."
 *               images:
 *                 - "https://your-bucket.s3.amazonaws.com/memory1.jpg"
 *                 - "https://your-bucket.s3.amazonaws.com/memory2.jpg"
 *     responses:
 *       200:
 *         description: 메모리북 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                 error:
 *                   type: object
 *                   nullable: true
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     data:
 *                       type: object
 *                       properties:
 *                         memoryBookId:
 *                           type: integer
 *                         title:
 *                           type: string
 *                         targetType:
 *                           type: string
 *                         targetId:
 *                           type: integer
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *             example:
 *               resultType: SUCCESS
 *               error: null
 *               success:
 *                 message: "메모리북이 성공적으로 생성되었습니다."
 *                 data:
 *                   memoryBookId: 5
 *                   title: "엘리자벳 후기"
 *                   targetType: "MUSICAL"
 *                   targetId: 1
 *                   createdAt: "2025-07-18T12:34:56.000Z"
 */
export const addMemoryBook = asyncHandler(async (req, res) => {
  const userId = req.user.id; // JWT로부터 유저 ID
  const { targetType, targetId, title, content } = req.body;

  console.log("🔥 req.body in controller:", req.body);

  const memoryBook = await createMemoryBookService(userId, req.body);

  res.success({
    message: "메모리북이 성공적으로 생성되었습니다.",
    data: {
      memoryBookId: memoryBook.id,
      title: memoryBook.title,
      targetType: memoryBook.targetType,
      targetId: memoryBook.targetId,
      createdAt: memoryBook.createdAt,
    },
  });
});
/**
 * GET /api/posts/memorybooks
 * 메모리북 상세 조회 
 */

export const getMemoryBook = async (req, res, next) => {
  try {
    const userId = req.user.id; // JWT로부터 userId 추출
    const { targetType, targetId } = req.query;

    if (!targetType || !targetId) {
      throw new BadRequestError("targetType과 targetId는 필수입니다.");
    }

    const memoryBook = await getMemoryBookService(userId, targetType, parseInt(targetId));

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: {
        message: "메모리북 조회 성공",
        data: {
          memoryBookId: memoryBook.id,
          title: memoryBook.title,
          content: memoryBook.content, // JSON 그대로 반환
          targetType: memoryBook.targetType,
          targetId: memoryBook.targetId,
          createdAt: memoryBook.createdAt,
          updatedAt: memoryBook.updatedAt,
        },
      },
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      resultType: "FAIL",
      error: {
        code: err.status || 500,
        message: err.message,
      },
      success: null,
    });
  }
};

/**
 * PUT /api/posts/memorybooks
 * 메모리북 수정  
 */
export const updateMemoryBook = async (req, res, next) => {
  try {
    const userId = req.user.id; // JWT에서 userId 추출
    const { targetType, targetId, title, content } = req.body;

    if (!targetType || !targetId || !title || !content) {
      throw new BadRequestError("targetType, targetId, title, content는 필수입니다.");
    }

    const updatedMemoryBook = await updateMemoryBookService(
      userId,
      targetType,
      targetId,
      title,
      content
    );

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: {
        message: "메모리북이 성공적으로 수정되었습니다.",
        data: {
          memoryBookId: updatedMemoryBook.id,
          title: updatedMemoryBook.title,
          targetType: updatedMemoryBook.targetType,
          targetId: updatedMemoryBook.targetId,
          updatedAt: updatedMemoryBook.updatedAt,
        },
      },
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      resultType: "FAIL",
      error: {
        code: err.status || 500,
        message: err.message,
      },
      success: null,
    });
  }
};