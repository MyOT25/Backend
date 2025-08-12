-- 이 파일엔 Seat 변경만 최소로 남기세요
-- (DB가 리셋되어 테이블이 비어 재생성된다는 전제)
ALTER TABLE `Seat`
  ADD COLUMN `columnNumber` INT NOT NULL;

-- 필요 시 blockNumber, seatIndex가 이전 init에서 생겼다면 같이 제거
ALTER TABLE `Seat`
  DROP COLUMN `seatIndex`,
  DROP COLUMN `blockNumber`;

CREATE UNIQUE INDEX `seat_unique_by_position`
  ON `Seat`(`theaterId`,`floor`,`zone`,`rowNumber`,`columnNumber`);
