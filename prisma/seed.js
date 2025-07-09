// prisma/seed.js
import { PrismaClient } from '../src/generated/prisma/index.js'; // 경로 주의
const prisma = new PrismaClient();
async function main() {
  // 1. Setting 더미 데이터 생성
  const setting = await prisma.setting.create({
    data: {
        id: 11,
      useBackground: false,
      useProfilePhoto: true,
      allowRepost: true,
    },
  });

  // 2. User 더미 생성 (userId가 1이 되게 하려면 clean 상태거나 truncate 했어야 함)
  await prisma.user.create({
    data: {
      loginId: 'dummyuser',
      password: '1234',
      username: '더미',
      email: 'dummy@cc.com',
      nickname: '더미유저!',
      settingId: setting.id,
    },
  });

  console.log('✅ 더미 유저 삽입 완료!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
