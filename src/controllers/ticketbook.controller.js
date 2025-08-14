import asyncHandler from "../middlewares/asyncHandler.js";
import prisma from "../config/prismaClient.js";
import { NotFoundError } from "../middlewares/CustomError.js";
import { getTicketbookSeries } from "../services/ticketbook.service.js";

/**
 * 티켓북 상세 조회 (극장 ID + 좌석 정보)
 * GET /api/ticketbook/:musicalId
 */
/**
 * @swagger
 * /api/ticketbook/{musicalId}:
 *   get:
 *     summary: 티켓북 상세 조회
 *     description: 특정 뮤지컬에 대한 극장 ID와 좌석 정보를 조회합니다.
 *     tags:
 *       - TicketBook
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: musicalId
 *         schema:
 *           type: integer
 *         required: true
 *         description: 뮤지컬 ID
 *     responses:
 *       200:
 *         description: 티켓북 상세 조회 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: SUCCESS
 *               error: null
 *               success:
 *                 message: 티켓북 상세 조회 성공
 *                 data:
 *                   theaterId: 1
 *                   seats:
 *                     - floor: 1
 *                       zone: "A"
 *                       blockNumber: 1
 *                       rowNumber: 17
 *                       seatIndex: 5
 *                       numberOfSittings: 2
 */
export const getTicketBookDetail = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const musicalId = parseInt(req.params.musicalId, 10);

  // 1) 뮤지컬 조회
  const musical = await prisma.musical.findUnique({
    where: { id: musicalId }
  });
  if (!musical) throw new NotFoundError("뮤지컬을 찾을 수 없습니다.");

  // 2) 좌석 정보 조회
  const userSeats = await prisma.userSeat.findMany({
    where: {
      userId,
      seat: { theaterId: musical.theaterId }
    },
    include: { seat: true }
  });

  // 3) 응답
  res.success({
    message: "티켓북 상세 조회 성공",
    data: {
      theaterId: musical.theaterId,
      seats: userSeats.map((userSeat) => ({
        floor: userSeat.seat.floor,
        zone: userSeat.seat.zone,
        blockNumber: userSeat.seat.blockNumber,
        rowNumber: userSeat.seat.rowNumber,
        seatIndex: userSeat.seat.seatIndex,
        numberOfSittings: userSeat.numberOfSittings
      }))
    }
  });
});

/**
 * 나의 티켓북(series) 상세보기 -작품 모아보기
 */
/**
 * @swagger
 * /api/ticketbook/{musicalId}/series:
 *   get:
 *     summary: 티켓북 시리즈 조회
 *     description: |
 *       특정 뮤지컬 ID를 기준으로, 같은 작품명(정규화 기준)을 가진 모든 시즌별 관극 기록을 조회합니다.
 *       각 시즌에는 기간, 포스터, 극장 정보와 함께 해당 시즌의 관극 기록(entries)이 포함됩니다.
 *       좌석 정보는 응답에 포함되지 않습니다.
 *     tags:
 *       - TicketBook
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: musicalId
 *         schema:
 *           type: integer
 *         required: true
 *         description: 조회할 뮤지컬 ID
 *     responses:
 *       200:
 *         description: 티켓북 시리즈 조회 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: SUCCESS
 *               error: null
 *               success:
 *                 message: 티켓북 시리즈 조회 성공
 *                 data:
 *                   title: "레미제라블"
 *                   series:
 *                     - label: "2016"
 *                       period:
 *                         startDate: "2016-05-01T00:00:00.000Z"
 *                         endDate: "2016-10-31T00:00:00.000Z"
 *                       poster: "https://example.com/poster.jpg"
 *                       theater:
 *                         name: "충무아트센터"
 *                         region: "서울"
 *                       seasonMusicalId: 12
 *                       entries:
 *                         - viewingId: 101
 *                           watchDate: "2016-05-10T00:00:00.000Z"
 *                           watchTime: "2016-05-10T14:00:00.000Z"
 *                           theater:
 *                             name: "충무아트센터"
 *                             region: "서울"
 *                           rating: 5
 *                           content: "감동적인 공연이었음"
 */

export const getTicketbookSeriesController = asyncHandler(async (req, res) => {
  const userId = req.user.id; // authenticateJWT에서 주입
  const { musicalId } = req.params;

  const data = await getTicketbookSeries(userId, musicalId);

  if (data?.notFound) {
    return res.status(404).json({
      resultType: "FAIL",
      error: { errorCode: "C001", reason: data.message, data: null },
      success: null
    });
  }

  return res.json({
    resultType: "SUCCESS",
    error: null,
    success: { message: "티켓북 시리즈 조회 성공", data }
  });
});
