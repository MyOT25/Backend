import prisma from "../config/prismaClient.js";
import {
  NotFoundError,
  UnauthorizedError,
} from "../middlewares/CustomError.js";
import PostRepository from "../repositories/post.repository.js";
import { findPostsByActorName } from "../repositories/post.repositories.js";
import CommentRepository from "../repositories/comment.repository.js";
import { formatPostResponse } from "../dtos/post.dto.js";

/* 티켓북 조회 */
export const getTicketbook = async (userId) => {
    console.log("getTicketbook → userId:", userId, typeof userId);
    console.log(Object.keys(prisma)); // 모델들 확인
  
    // userId를 기준으로 유저 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    console.log(userId);  // userId 확인
    console.log(user);  
  
    const viewings = await prisma.viewingRecord.findMany({
      where: { userId },
      include: {
        musical: {
          include: {
            theater: {
              include: {
                region: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });
  
  
  
    if (!viewings || viewings.length === 0) {
      throw new UnauthorizedError("티켓북에 기록이 없습니다.", 404);
    }
  
    return viewings.map((v) => ({
      musical_id: v.musical.id,
      title: v.musical.name,
      poster: v.musical.poster,
      watch_date: v.date,
      theater: {
        name: v.musical.theater.name,
        region: v.musical.theater.region.name,
      },
    }));
  };

/**
 * 신규 월별 정산판 조회 (함수 방식으로 추가)
 */
export const getMonthlySummary = async (userId, year, month) => {
    const viewings = await PostRepository.findViewingRecordsByMonth(
      userId,
      year,
      month
    );
  
    if (!viewings || viewings.length === 0) {
      throw new UnauthorizedError("해당 월에 관람 기록이 없습니다.", 404);
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
        seatType: v.seat?.seat_type,
      },
      content: v.content,
      imageUrls: [v.musical.poster] || [],
    }));
  };

/* 오늘의 관극 등록
 */
export const createViewingRecord = async (userId, body) => {
    const {
      musicalId,
      watchDate,
      watchTime,
      seat,        // { theaterId, floor, zone, rowNumber(string), columnNumber(int) }
      casts,       // [{ actorId, role }]
      content,
      rating,
      imageUrls,
    } = body;
  
    const theaterId     = Number(seat?.theaterId ?? seat?.locationId);
    const floor         = Number(seat?.floor);
    const zone          = String(seat?.zone ?? "").trim();
    const rowNumber     = String(seat?.rowNumber ?? seat?.row ?? "").trim(); // 문자열
    const columnNumber  = Number(seat?.columnNumber ?? seat?.column);
  
    if (!Number.isInteger(theaterId) || !Number.isInteger(floor) || !Number.isInteger(columnNumber) || !zone || !rowNumber) {
      throw new Error("좌석 필드 형식이 올바르지 않습니다. (theaterId/floor/columnNumber=정수, zone/rowNumber=문자열)");
    }
  
    const result = await prisma.$transaction(async (tx) => {
      // 1) 좌석 존재 확인(사전 시드 필수). 없으면 에러
      const seatRecord = await tx.seat.findUnique({
        where: {
          seat_unique_by_position: { theaterId, floor, zone, rowNumber, columnNumber },
        },
      });
      if (!seatRecord) {
        throw new Error("존재하지 않는 좌석입니다. 좌석을 먼저 등록해 주세요.");
      }
  
      // 2) 관극 기록 생성
      const viewing = await tx.viewingRecord.create({
        data: {
          userId,
          musicalId,
          seatId: seatRecord.id,
          date: new Date(watchDate),
          time: new Date(`${watchDate}T${watchTime}`),
          content,
          rating,
        },
      });
  
      // 3) UserSeat 카운트 증가: 있으면 +1, 없으면 디폴트(1)로 생성
      await tx.userSeat.upsert({
        where: { userId_seatId: { userId, seatId: seatRecord.id } },
        update: { numberOfSittings: { increment: 1 } },
        create: { userId, seatId: seatRecord.id }, // default(1) 사용
      });
  
      // 4) 이미지
      if (imageUrls?.length) {
        await tx.viewingImage.createMany({
          data: imageUrls.map((url) => ({ viewingId: viewing.id, url })),
        });
      }
  
      // 5) 출연진
      if (casts?.length) {
        await tx.casting.createMany({
          data: casts.map((c) => ({ musicalId, actorId: c.actorId, role: c.role })),
          skipDuplicates: true,
        });
      }
  
      return viewing;
    });
  
    return result;
  };