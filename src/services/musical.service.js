import prisma from "../config/prismaClient.js";

export const searchMusicalByName = async (name) => {
  const musicals = await prisma.musical.findMany({
    where: {
      name: {
        contains: name,
      },
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      poster: true,
      performanceCount: true,
      ticketpic: true,
      ratingCount: true,
      ratingSum: true,
      theater: {
        select: {
          name: true,
          seats: {
            take: 1, // 한 좌석만 가져와서 구조 정보 확인
            select: {
              hasFloor: true,
              hasZone: true,
              hasRowNumber: true,
              hasColumn: true,
            },
          },
        },
      },
    },
  });

  return musicals.map((musical) => {
    const avgRating =
      musical.ratingCount > 0
        ? (musical.ratingSum / musical.ratingCount).toFixed(2)
        : null;

    const seatStructure = musical.theater?.seats?.[0] || {
      hasFloor: false,
      hasZone: false,
      hasRowNumber: false,
      hasColumn: false,
    };

    return {
      id: musical.id,
      name: musical.name,
      period: `${musical.startDate} ~ ${musical.endDate}`,
      theater: musical.theater?.name ?? null,
      avgRating,
      poster: musical.poster,
      performanceCount: musical.performanceCount,
      ticketpic: musical.ticketpic,
      seatStructure,
    };
  });
};
