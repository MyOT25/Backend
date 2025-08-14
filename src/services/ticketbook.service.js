// services/ticketbook.service.js
import prisma from "../config/prismaClient.js";

/** 시즌 라벨: 같은 연도면 "YYYY", 다르면 "YYYY-YYYY" */
const toYearLabel = (startDate, endDate) => {
    if (!startDate || !endDate) return "기간 미정";
    const s = new Date(startDate).getFullYear();
    const e = new Date(endDate).getFullYear();
    return s === e ? String(s) : `${s}-${e}`;
  };
  
  /** 이름 정규화: 공백/괄호/숫자/구두점 제거 + 소문자 */
  const normalizeTitle = (s) =>
    (s ?? "")
      .toLowerCase()
      .replace(/[()\[\]{}]/g, "")
      .replace(/\s+/g, "")
      .replace(/[\d~\-_.·:]/g, "")
      .replace(/–|—/g, "");
  
  /** 날짜 경계 보정 포함 범위 체크 */
  const inSeasonRange = (viewDate, start, end) => {
    if (!start || !end) return true;
    const vd = new Date(viewDate), s = new Date(start), e = new Date(end);
    vd.setHours(0,0,0,0); s.setHours(0,0,0,0); e.setHours(23,59,59,999);
    return vd >= s && vd <= e;
  };
  
  export const getTicketbookSeries = async (userId, musicalId) => {
    const base = await prisma.musical.findUnique({
      where: { id: Number(musicalId) },
      select: { id: true, name: true }
    });
    if (!base?.name) return { notFound: true, message: "작품명이 설정되지 않은 뮤지컬입니다." };
  
    const baseKey = normalizeTitle(base.name);
    const baseNameTrimmed = base.name.trim();
  
    // 1차 후보군: contains (MySQL에서는 mode 미지원이라 제거)
    let seasonsCandidate = await prisma.musical.findMany({
      where: {
        // name이 NULL이면 매칭 안 되므로 별도 not null 조건 필요 없음
        name: { contains: baseNameTrimmed }
      },
      select: {
        id: true, name: true, startDate: true, endDate: true, poster: true,
        theater: { select: { name: true, region: { select: { name: true } } } }
      },
      orderBy: [{ startDate: "desc" }, { id: "desc" }]
    });
  
    // 2차 확정: 정규화 키로 동일작품만 남기기
    let seasons = seasonsCandidate.filter(s => normalizeTitle(s.name) === baseKey);
  
    // contains가 못 잡는 케이스(콜레이션/표기차 등) 대비: 전수조회 후 정규화 매칭 (선택적 fallback)
    if (seasons.length === 0) {
      const allMusicals = await prisma.musical.findMany({
        select: {
          id: true, name: true, startDate: true, endDate: true, poster: true,
          theater: { select: { name: true, region: { select: { name: true } } } }
        },
        orderBy: [{ startDate: "desc" }, { id: "desc" }]
      });
      seasons = allMusicals.filter(s => normalizeTitle(s.name) === baseKey);
    }
  
    if (seasons.length === 0) return { title: base.name, series: [] };
  
    const seasonIds = seasons.map(s => s.id);
  
    // 좌석은 응답에 내보내지 않지만, 관극 당시 극장명 정확도를 위해 seat->theater만 내부 조회
    const myViewings = await prisma.viewingRecord.findMany({
      where: { userId: Number(userId), musicalId: { in: seasonIds } },
      include: { seat: { include: { theater: { include: { region: true } } } } }
    });
  
    const firstNonEmpty = v => (v && String(v).trim()) ? v : null;
    const representativePoster =
      firstNonEmpty(seasons.find(s => firstNonEmpty(s.poster))?.poster) ?? null;
  
    const series = seasons.map(s => {
      const entries = myViewings
        .filter(v => v.musicalId === s.id)
        .filter(v => inSeasonRange(v.date, s.startDate, s.endDate))
        .sort((a,b) => new Date(b.date) - new Date(a.date))
        .map(v => {
          const seatTheater = v.seat?.theater;
          const theaterName = seatTheater?.name ?? s.theater?.name ?? null;
          const regionName  = seatTheater?.region?.name ?? s.theater?.region?.name ?? null;
          return {
            viewingId: v.id,
            watchDate: v.date,
            watchTime: v.time ?? null,
            theater: (theaterName || regionName) ? { name: theaterName, region: regionName } : null,
            rating: v.rating ?? null,
            content: v.content ?? null
          };
        });
  
      return {
        label: toYearLabel(s.startDate, s.endDate),
        period: { startDate: s.startDate, endDate: s.endDate },
        poster: firstNonEmpty(s.poster) ?? representativePoster,
        theater: s.theater ? { name: s.theater.name, region: s.theater.region?.name ?? null } : null,
        seasonMusicalId: s.id,
        entries
      };
    }).filter(block => block.entries.length > 0);
  
    return { title: base.name, series };
  };