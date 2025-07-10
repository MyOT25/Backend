import prisma from '../config/prismaClient.js';
import { UnauthorizedError } from '../middlewares/CustomError.js';
import PostRepository from "../repositories/post.repository.js";

export const getTicketbook = async (userId) => {
  console.log(Object.keys(prisma)); // 모델들 확인
  const viewings = await prisma.viewingRecord.findMany({
    where: { userId },
    include: {
      musical: {
        include: {
          theater: {
            include: {
              region: true
            }
          }
        }
      }
    },
    orderBy: { date: 'desc' }
  });

  if (!viewings || viewings.length === 0) {
    throw new UnauthorizedError('티켓북에 기록이 없습니다.', 404);
  }

  return viewings.map((v) => ({
    musical_id: v.musical.id,
    title: v.musical.name,
    poster: v.musical.poster,
    watch_date: v.date,
    theater: {
      name: v.musical.theater.name,
      region: v.musical.theater.region.name
    }
  }));
};

/**
 * 신규 월별 정산판 조회 (함수 방식으로 추가)
 */
export const getMonthlySummary = async (userId, year, month) => {
    const viewings = await PostRepository.findViewingRecordsByMonth(userId, year, month);
  
    if (!viewings || viewings.length === 0) {
      throw new UnauthorizedError('해당 월에 관람 기록이 없습니다.', 404);
    }
  
    return viewings.map((v) => ({
      postId: v.id,
      musicalId: v.musical.id,
      musicalTitle: v.musical.name,
      watchDate: v.date,
      watchTime: v.time,
      seat: {
        locationId: v.seat?.id,
        row: v.seat?.row,
        column: v.seat?.column,
        seatType: v.seat?.seat_type
      },
      content: v.content,
      imageUrls: [v.musical.poster] || []
    }));
  };