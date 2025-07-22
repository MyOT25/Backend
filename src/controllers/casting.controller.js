import { getMusicalCastingsService } from "../services/casting.service.js";
import { successResponse } from "../dtos/casting.dto.js";

/**
 * 출연진 목록 조회 API
 * GET /api/posts/musical/castings?musicalId=1
 */
/**
 * @swagger
 * /api/posts/musical/castings:
 *   get:
 *     summary: 특정 뮤지컬의 출연진 목록 조회
 *     description: 뮤지컬 ID를 기반으로 해당 뮤지컬의 배우 및 역할 정보를 반환합니다.
 *     tags:
 *       - Casting
 *     parameters:
 *       - in: query
 *         name: musicalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 출연진을 조회할 뮤지컬의 ID
 *     responses:
 *       200:
 *         description: 출연진 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 출연진 목록 조회 성공
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           actorId:
 *                             type: integer
 *                             example: 12
 *                           actorName:
 *                             type: string
 *                             example: 홍길동
 *                           role:
 *                             type: string
 *                             example: 주연
 *                           imageUrl:
 *                             type: string
 *                             example: https://cdn.example.com/actors/12.jpg
 */

export const getMusicalCastings = async (req, res, next) => {
  try {
    const { musicalId } = req.query;

    if (!musicalId) {
      return res.status(400).json({
        resultType: "FAIL",
        error: {
          errorCode: "C001",
          reason: "musicalId가 필요합니다.",
        },
        success: null,
      });
    }

    const data = await getMusicalCastingsService(Number(musicalId));
    return res.status(200).json(successResponse(data));
  } catch (err) {
    next(err);
  }
};
