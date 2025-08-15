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
    castingIds=[],
    content,
    rating,      // number | undefined
    imageUrls,
  } = body;

  const theaterId    = Number(seat?.theaterId ?? seat?.locationId);
  const floor        = Number(seat?.floor);
  const zone         = String(seat?.zone ?? "").trim();
  const rowNumber    = String(seat?.rowNumber ?? seat?.row ?? "").trim(); // 문자열
  const columnNumber = seat?.columnNumber != null ? Number(seat.columnNumber) : null;

  if (!Number.isInteger(theaterId) || !Number.isInteger(floor) || !zone || !rowNumber) {
    throw new Error("좌석 필드 형식이 올바르지 않습니다. (theaterId/floor=정수, zone/rowNumber=문자열, columnNumber=정수 또는 null)");
  }
  if (columnNumber !== null && !Number.isInteger(columnNumber)) {
    throw new Error("columnNumber는 정수 또는 null이어야 합니다.");
  }

  const viewing = await prisma.$transaction(async (tx) => {
    // 1) 좌석 존재 확인
    const seatRecord = await tx.seat.findFirst({
      where: {
        theaterId,
        floor,
        zone,
        rowNumber,
        columnNumber: columnNumber, // null이면 null로 검색됨
      },
    });
    if (!seatRecord) {
      throw new Error("존재하지 않는 좌석입니다. 좌석을 먼저 등록해 주세요.");
    }

    // 2) 관극 기록 생성
    const created = await tx.viewingRecord.create({
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

    // 2-1) 뮤지컬 별점 집계 업데이트(별점이 있을 때만)
    if (typeof rating === "number") {
      await tx.musical.update({
        where: { id: musicalId },
        data: {
          ratingSum:   { increment: rating },
          ratingCount: { increment: 1 },
        },
      });
    }

    // 3) UserSeat 카운트 증가
    await tx.userSeat.upsert({
      where: { userId_seatId: { userId, seatId: seatRecord.id } },
      update: { numberOfSittings: { increment: 1 } },
      create: { userId, seatId: seatRecord.id },
    });

    // 4) 이미지
    if (imageUrls?.length) {
      await tx.viewingImage.createMany({
        data: imageUrls.map((url) => ({ viewingId: created.id, url })),
      });
    }

    // 🎯 viewingCast 저장
    if (castingIds.length) {
      const castingExist = await tx.casting.findMany({
        where: { id: { in: castingIds }, musicalId },
        select: { id: true },
      });
      const validIds = castingExist.map((c) => c.id);

      if (validIds.length) {
        await tx.viewingCast.createMany({
          data: validIds.map((castingId) => ({
            viewingId: created.id,
            castingId,
          })),
        });
      }
    }

    return created;
  });

  // 5) 평균 별점 계산(트랜잭션 종료 후)
  const musicalAgg = await prisma.musical.findUnique({
    where: { id: viewing.musicalId },
    select: { ratingSum: true, ratingCount: true },
  });

  const averageRating =
    musicalAgg && musicalAgg.ratingCount > 0
      ? Number(musicalAgg.ratingSum) / musicalAgg.ratingCount
      : null;

  return { ...viewing, averageRating };
};


/**
 * 역할별 출연진 목록 조회 
 */
export async function getMusicalCastGroupedByRole(musicalId, order = "asc") {
  const sortAsc = order !== "desc";

  // 1) 캐스팅 + 배우 정보 로드
  const castings = await prisma.casting.findMany({
    where: { musicalId: Number(musicalId) },
    select: {
      role: true,
      performanceCount: true,
      actor: {
        select: {
          id: true,
          name: true,
          image: true,
          birthDate: true,
          profile: true,
          snsLink: true,
        },
      },
    },
  });

  // 2) 역할별 그룹핑
  const byRole = new Map(); // role -> [{actorId, ...}]
  for (const c of castings) {
    const list = byRole.get(c.role ?? "미지정") ?? [];
    list.push({
      actorId: c.actor.id,
      name: c.actor.name ?? "",
      image: c.actor.image ?? null,
      birthDate: c.actor.birthDate ?? null,
      profile: c.actor.profile ?? null,
      snsLink: c.actor.snsLink ?? null,
      performanceCount: c.performanceCount ?? 0,
    });
    byRole.set(c.role ?? "미지정", list);
  }

  // 3) 각 역할 내부를 생년월일 기준 정렬 (NULL은 맨 뒤)
  const nullWeight = (d) => (d ? 0 : 1);
  const cmp = (a, b) => {
    const na = nullWeight(a.birthDate);
    const nb = nullWeight(b.birthDate);
    if (na !== nb) return na - nb; // null last
    if (!a.birthDate && !b.birthDate) {
      return a.name.localeCompare(b.name, "ko"); // 생일 둘 다 없음 → 이름으로
    }
    // 생일 있음 → asc/desc
    const ta = new Date(a.birthDate).getTime();
    const tb = new Date(b.birthDate).getTime();
    return sortAsc ? ta - tb : tb - ta;
  };

  const roles = [...byRole.entries()].map(([role, actors]) => ({
    role,
    actors: actors.sort(cmp),
  }));

  // 4) 역할 자체도 보기 좋게 정렬(알파벳/한글 오름차순)
  roles.sort((a, b) => a.role.localeCompare(b.role, "ko"));

  return {
    musicalId: Number(musicalId),
    roles,
  };
}