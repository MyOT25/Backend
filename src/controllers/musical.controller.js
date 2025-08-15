import asyncHandler from "../middlewares/asyncHandler.js";
import { searchMusicalByName } from "../services/musical.service.js";

/**
 * @swagger
 * /api/viewingrecords/musicals:
 *   get:
 *     summary: 뮤지컬 검색
 *     description: 뮤지컬 이름으로 검색하여 뮤지컬 정보와 극장 좌석 구조를 반환합니다.
 *     tags:
 *       - ViewingRecord
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색할 뮤지컬 이름 (부분 검색 가능)
 *     responses:
 *       200:
 *         description: 뮤지컬 검색 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: SUCCESS
 *               error: null
 *               success:
 *                 message: 뮤지컬 검색 성공
 *                 data:
 *                   - id: 1
 *                     name: "엘리자벳"
 *                     period: "2025-01-01 ~ 2025-03-31"
 *                     theater: "블루스퀘어"
 *                     avgRating: "4.70"
 *                     poster: "https://example.com/poster.jpg"
 *                     performanceCount: 50
 *                     ticketpic: "https://example.com/ticket.jpg"
 *                     seatStructure:
 *                       hasFloor: true
 *                       hasZone: false
 *                       hasRowNumber: true
 *                       hasColumn: false
 *       400:
 *         description: 잘못된 요청 (name 파라미터 없음)
 *         content:
 *           application/json:
 *             example:
 *               resultType: FAIL
 *               error:
 *                 reason: "뮤지컬 이름(name) 쿼리 파라미터가 필요합니다."
 *               success: null
 */
export const getMusicalByName = asyncHandler(async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({
      resultType: "FAIL",
      error: { reason: "뮤지컬 이름(name) 쿼리 파라미터가 필요합니다." },
      success: null,
    });
  }

  const result = await searchMusicalByName(name);

  return res.status(200).json({
    resultType: "SUCCESS",
    error: null,
    success: {
      message: "뮤지컬 검색 성공",
      data: result,
    },
  });
});
