import { getTicketbook, getMonthlySummary as getMonthlySummaryService } from '../services/post.service.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import prisma from '../config/prismaClient.js';


/**
 * GET /api/posts/ticketbook
 * @desc 나의 티켓북 조회
 */

export const getUserTicketbook = asyncHandler(async (req, res) => {
    // 일단 임시로 
   // const userId = req.user.id; // JWT 인증 미들웨어로부터 유저 ID 추출
   const userId= 1;

  const records = await getTicketbook(userId);

  res.success({
    message: '티켓북 조회 성공',
    data: records
  });
});

/**
 * 월별 정산판 조회
 * GET /api/posts/monthly-summary?year=YYYY&month=MM
 */
export const getMonthlySummary = async (req, res, next) => {
    try {
      const { year, month } = req.query;
  
      if (!year || !month) {
        throw new Error('year와 month는 필수입니다.');
      }
  
      const userId = req.user?.id || 1; // 임시 userId
  
      // ⬇️ 수정: userId도 같이 넘김
      const data = await getMonthlySummaryService(userId, parseInt(year, 10), parseInt(month, 10));
  
      res.status(200).json({
        resultType: 'SUCCESS',
        error: {
          errorCode: null,
          reason: null,
          data: null
        },
        success: {
          message: `${year}년 ${month}월 월별 정산판 조회 성공`,
          data
        }
      });
    } catch (err) {
      next(err);
    }
  };
  
 
  
  
