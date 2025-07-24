/**
 * 성공 응답 DTO
 * @param {Array} data - 응답 데이터
 */

export const successResponse = (data) => ({
    resultType: "SUCCESS",
    error: null,
    success: {
      message: "출연진 목록 조회 성공",
      data,
    },
  });
  