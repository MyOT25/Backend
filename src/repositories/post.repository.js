import prisma from '../config/prismaClient.js';

class PostRepository {
  async findViewingRecordsByMonth(userId, year, month) {
    if (!year || isNaN(year) || year < 1900 || year > 2100) {
        throw new Error(`Invalid year: ${year}`);
      }
  
      month = parseInt(month, 10);
      if (!month || isNaN(month) || month < 1 || month > 12) {
        throw new Error(`Invalid month: ${month}`);
      }
    
    // JS Date는 month가 0부터 시작 (0=1월)
    const startDate = new Date(year, month - 1, 1); // 현재 달 1일
    const endDate = new Date(year, month, 1);       // 다음 달 1일

    return prisma.viewingRecord.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      include: {
        musical: true,
        seat: true
      }
    });
  }
}

export default new PostRepository();
