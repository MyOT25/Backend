import asyncHandler from "../middlewares/asyncHandler.js";
import prisma from "../config/prismaClient.js";
import { NotFoundError } from "../middlewares/CustomError.js";

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
