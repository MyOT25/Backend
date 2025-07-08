import { getTicketbook } from '../services/post.service.js';
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
