import prisma from '../config/prismaClient.js';
import { UnauthorizedError } from '../middlewares/CustomError.js';

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
