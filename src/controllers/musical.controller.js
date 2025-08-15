import asyncHandler from "../middlewares/asyncHandler.js";
import { searchMusicalByName } from "../services/musical.service.js";

export const getMusicalByName = asyncHandler(async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({
      resultType: "FAIL",
      error: { reason: "뮤지컬 이름(name) 쿼리 파라미터가 필요합니다." },
      success: null,
    });
  }

  const result = await searchMusicalByName(name);

  return res.status(200).json({
    resultType: "SUCCESS",
    error: null,
    success: {
      message: "뮤지컬 검색 성공",
      data: result,
    },
  });
});
