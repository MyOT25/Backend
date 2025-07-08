import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed 시작");

  // ✅ Region 생성 (autoincrement 있으므로 id 지정 필요 X)
  const region = await prisma.region.create({
    data: {
      name: "서울",
    },
  });

  // ✅ Setting 생성 (id 수동 지정)
  const setting = await prisma.setting.create({
    data: {
      id: 1, // 👈 직접 지정
      useBackground: false,
      useProfilePhoto: true,
      allowRepost: true,
    },
  });

  // ✅ User 생성 (autoincrement 있음)
  const user = await prisma.user.create({
    data: {
      loginId: "testuser",
      username: "테스트유저",
      password: "password123",
      email: "test@example.com",
      nickname: "Testy",
      birthDate: new Date("2000-01-01"),
      isSubscribed: true,
      settingId: setting.id,
    },
  });

  // ✅ Theater 생성 (id 수동 지정)
  const theater = await prisma.theater.create({
    data: {
      id: 1, // 👈 직접 지정
      name: "예술의전당",
      seatCount: 1000,
      roadAddress: "서울시 서초구 남부순환로 2406",
      regionId: region.id,
    },
  });

  // ✅ Musical 생성 (id 수동 지정)
  const musical = await prisma.musical.create({
    data: {
      id: 1, // 👈 직접 지정
      name: "엘리자벳",
      startDate: new Date("2025-05-01"),
      endDate: new Date("2025-06-30"),
      poster: "https://example.com/poster1.jpg",
      theaterId: theater.id,
    },
  });

  // ✅ ViewingRecord 생성 (id 수동 지정)
  await prisma.viewingRecord.create({
    data: {
      id: 1, // 👈 직접 지정
      userId: user.id,
      musicalId: musical.id,
      date: new Date("2025-05-15"),
      seat: "A열 12번",
    },
  });

  console.log("🌱 Seed 완료");
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error("🔥 Seed 중 오류 발생:", err);
    prisma.$disconnect();
    process.exit(1);
  });
