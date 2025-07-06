-- CreateTable
CREATE TABLE `유저` (
    `사용자 아이디` INTEGER NOT NULL AUTO_INCREMENT,
    `설정 아이디` INTEGER NOT NULL,
    `사용자명` VARCHAR(191) NULL,
    `비밀번호` VARCHAR(191) NULL,
    `이메일` VARCHAR(191) NULL,
    `닉네임` VARCHAR(191) NULL,
    `프로필 이미지` VARCHAR(191) NULL,
    `가입일` DATETIME(3) NULL,
    `수정일` DATETIME(3) NULL,
    `자기소개` VARCHAR(191) NULL,
    `생년월일` DATETIME(3) NULL,
    `구독 여부` BOOLEAN NULL,

    PRIMARY KEY (`사용자 아이디`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `게시글` (
    `글 아이디` INTEGER NOT NULL AUTO_INCREMENT,
    `사용자 아이디` INTEGER NOT NULL,
    `설정 아이디` INTEGER NOT NULL,
    `커뮤니티 아이디` INTEGER NOT NULL,
    `글 제목` VARCHAR(191) NULL,
    `글 내용` VARCHAR(191) NULL,
    `카테고리` VARCHAR(191) NULL,
    `글 공감(좋아요)` VARCHAR(191) NULL,
    `글 좋아요 수` INTEGER NULL,
    `댓글 수` INTEGER NULL,
    `글 작성일` DATETIME(3) NULL,
    `글 수정일` DATETIME(3) NULL,
    `리포스트` INTEGER NULL,
    `북마크` INTEGER NULL,
    `커뮤니티 그룹(커뮤니티명)` VARCHAR(191) NULL,
    `조회수` INTEGER NULL,
    `글 태그` VARCHAR(191) NULL,
    `이미지/영상` ENUM('image', 'video') NULL,
    `고정글 여부` BOOLEAN NULL,
    `탭 분류(하이라이트,미디어,메모리북?)` ENUM('highlight', 'media', 'memorybook') NULL,
    `글 공유 상태(노출 여부)` BOOLEAN NULL,
    `뮤지컬 아이디` INTEGER NULL,
    `배우 아이디` INTEGER NULL,
    `Field` VARCHAR(191) NULL,

    PRIMARY KEY (`글 아이디`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `댓글` (
    `댓글 아이디` INTEGER NOT NULL AUTO_INCREMENT,
    `글 아이디2` INTEGER NOT NULL,
    `사용자 아이디2` INTEGER NOT NULL,
    `설정 아이디` INTEGER NOT NULL,
    `커뮤니티 아이디` INTEGER NOT NULL,
    `댓글 내용` VARCHAR(191) NULL,
    `댓글 작성날짜` DATETIME(3) NULL,
    `익명 여부` BOOLEAN NULL,

    PRIMARY KEY (`댓글 아이디`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `후기` (
    `리뷰 아이디` INTEGER NOT NULL AUTO_INCREMENT,
    `사용자 아이디` INTEGER NOT NULL,
    `설정 아이디` INTEGER NOT NULL,
    `극장 고유 ID` INTEGER NOT NULL,
    `Key` INTEGER NOT NULL,
    `글 아이디` INTEGER NULL,
    `리뷰 내용` VARCHAR(191) NULL,
    `별점` INTEGER NULL,
    `스포일러 여부` BOOLEAN NULL,
    `리뷰 작성일` DATETIME(3) NULL,
    `리뷰 수정일` DATETIME(3) NULL,
    `리뷰 좋아요` VARCHAR(191) NULL,
    `리뷰 좋아요 수` INTEGER NULL,
    `리뷰 댓글` VARCHAR(191) NULL,
    `리뷰 이미지` VARCHAR(191) NULL,
    `신고` BOOLEAN NULL,
    `관람날짜` DATETIME(3) NULL,
    `관람시간` DATETIME(3) NULL,
    `Field2` VARCHAR(191) NULL,

    PRIMARY KEY (`리뷰 아이디`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `배우` (
    `배우 아이디` INTEGER NOT NULL AUTO_INCREMENT,
    `글 아이디` INTEGER NOT NULL,
    `사용자 아이디` INTEGER NOT NULL,
    `설정 아이디` INTEGER NOT NULL,
    `커뮤니티 아이디` INTEGER NOT NULL,
    `Key` INTEGER NOT NULL,
    `이름` VARCHAR(191) NULL,
    `배우 사진` VARCHAR(191) NULL,
    `자기소개/간단한 프로필` VARCHAR(191) NULL,
    `SNS 링크` VARCHAR(191) NULL,
    `FK` INTEGER NULL,

    PRIMARY KEY (`배우 아이디`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `뮤지컬` (
    `뮤지컬 아이디` INTEGER NOT NULL,
    `극장 고유 ID` INTEGER NOT NULL,
    `뮤지컬이름` VARCHAR(191) NULL,
    `시작날짜` DATETIME(3) NULL,
    `종료날짜` DATETIME(3) NULL,
    `뮤지컬 포스터` VARCHAR(191) NULL,
    `생성시간` DATETIME(3) NULL,
    `수정시간` DATETIME(3) NULL,

    PRIMARY KEY (`뮤지컬 아이디`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `공연장` (
    `극장 고유 ID` INTEGER NOT NULL,
    `지역 고유 ID` INTEGER NOT NULL,
    `극장 이름` VARCHAR(191) NULL,
    `총 좌석수` INTEGER NULL,
    `도로명 주소` VARCHAR(191) NULL,
    `생성시간` DATETIME(3) NULL,
    `수정시간` DATETIME(3) NULL,

    PRIMARY KEY (`극장 고유 ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `극장 내 좌석` (
    `좌석 고유 ID` INTEGER NOT NULL,
    `극장 고유 ID` INTEGER NOT NULL,
    `위치 고유 ID` INTEGER NOT NULL,
    `Field` VARCHAR(191) NULL,
    `Field2` VARCHAR(191) NULL,
    `Field3` VARCHAR(191) NULL,
    `층수` VARCHAR(191) NULL,

    PRIMARY KEY (`좌석 고유 ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `커뮤니티` (
    `커뮤니티 아이디` INTEGER NOT NULL,
    `생성시간` DATETIME(3) NULL,
    `커뮤니티 그룹(커뮤니티명)` VARCHAR(191) NULL,
    `커뮤니티 타입` VARCHAR(191) NULL,

    PRIMARY KEY (`커뮤니티 아이디`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `설정` (
    `설정 아이디` INTEGER NOT NULL,
    `배경 설정 여부` BOOLEAN NULL,
    `프로필사진 설정 여부` BOOLEAN NULL,
    `리포스트 허용 여부` BOOLEAN NULL,

    PRIMARY KEY (`설정 아이디`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `태그` (
    `태그 아이디` INTEGER NOT NULL,
    `글 아이디` INTEGER NOT NULL,
    `태그명` VARCHAR(191) NULL,
    `태그 타입` VARCHAR(191) NULL,

    PRIMARY KEY (`태그 아이디`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `이미지` (
    `이미지 아이디` INTEGER NOT NULL,
    `글 아이디` INTEGER NOT NULL,
    `이미지 경로` VARCHAR(191) NULL,
    `이미지 설명` VARCHAR(191) NULL,

    PRIMARY KEY (`이미지 아이디`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `구독` (
    `구독 아이디` INTEGER NOT NULL,
    `사용자 아이디` INTEGER NOT NULL,
    `구독 시작일` DATETIME(3) NULL,
    `구독 종료일` DATETIME(3) NULL,
    `구독 활성 상태` BOOLEAN NULL,

    PRIMARY KEY (`구독 아이디`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `팔로우` (
    `팔로우 아이디` INTEGER NOT NULL,
    `팔로워 아이디` INTEGER NOT NULL,
    `팔로잉 아이디` INTEGER NOT NULL,
    `팔로우 생성일` DATETIME(3) NULL,

    PRIMARY KEY (`팔로우 아이디`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `관극기록` (
    `관극기록 아이디` INTEGER NOT NULL,
    `사용자 아이디` INTEGER NOT NULL,
    `뮤지컬 아이디` INTEGER NOT NULL,
    `관극일` DATETIME(3) NULL,
    `좌석 정보` VARCHAR(191) NULL,

    PRIMARY KEY (`관극기록 아이디`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `사용자가 게시글에 누른 좋아요` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `likedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `질문` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `답변` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `questionId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `지역` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `뮤지컬_배우 중개테이블` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `musicalId` INTEGER NOT NULL,
    `actorId` INTEGER NOT NULL,
    `role` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `유저_커뮤니티 중개테이블` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `communityId` INTEGER NOT NULL,
    `joinedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `뮤지컬 커뮤니티` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `musicalId` INTEGER NOT NULL,
    `communityId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `멀티프로필` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `nickname` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `bio` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `유저` ADD CONSTRAINT `유저_설정 아이디_fkey` FOREIGN KEY (`설정 아이디`) REFERENCES `설정`(`설정 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `게시글` ADD CONSTRAINT `게시글_사용자 아이디_fkey` FOREIGN KEY (`사용자 아이디`) REFERENCES `유저`(`사용자 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `게시글` ADD CONSTRAINT `게시글_배우 아이디_fkey` FOREIGN KEY (`배우 아이디`) REFERENCES `배우`(`배우 아이디`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `게시글` ADD CONSTRAINT `게시글_설정 아이디_fkey` FOREIGN KEY (`설정 아이디`) REFERENCES `설정`(`설정 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `댓글` ADD CONSTRAINT `댓글_글 아이디2_fkey` FOREIGN KEY (`글 아이디2`) REFERENCES `게시글`(`글 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `댓글` ADD CONSTRAINT `댓글_사용자 아이디2_fkey` FOREIGN KEY (`사용자 아이디2`) REFERENCES `유저`(`사용자 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `후기` ADD CONSTRAINT `후기_사용자 아이디_fkey` FOREIGN KEY (`사용자 아이디`) REFERENCES `유저`(`사용자 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `후기` ADD CONSTRAINT `review_postId_fkey` FOREIGN KEY (`글 아이디`) REFERENCES `게시글`(`글 아이디`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `뮤지컬` ADD CONSTRAINT `뮤지컬_극장 고유 ID_fkey` FOREIGN KEY (`극장 고유 ID`) REFERENCES `공연장`(`극장 고유 ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `공연장` ADD CONSTRAINT `공연장_지역 고유 ID_fkey` FOREIGN KEY (`지역 고유 ID`) REFERENCES `지역`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `극장 내 좌석` ADD CONSTRAINT `극장 내 좌석_극장 고유 ID_fkey` FOREIGN KEY (`극장 고유 ID`) REFERENCES `공연장`(`극장 고유 ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `태그` ADD CONSTRAINT `태그_글 아이디_fkey` FOREIGN KEY (`글 아이디`) REFERENCES `게시글`(`글 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `이미지` ADD CONSTRAINT `이미지_글 아이디_fkey` FOREIGN KEY (`글 아이디`) REFERENCES `게시글`(`글 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `구독` ADD CONSTRAINT `구독_사용자 아이디_fkey` FOREIGN KEY (`사용자 아이디`) REFERENCES `유저`(`사용자 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `팔로우` ADD CONSTRAINT `팔로우_팔로워 아이디_fkey` FOREIGN KEY (`팔로워 아이디`) REFERENCES `유저`(`사용자 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `팔로우` ADD CONSTRAINT `팔로우_팔로잉 아이디_fkey` FOREIGN KEY (`팔로잉 아이디`) REFERENCES `유저`(`사용자 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `관극기록` ADD CONSTRAINT `관극기록_사용자 아이디_fkey` FOREIGN KEY (`사용자 아이디`) REFERENCES `유저`(`사용자 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `관극기록` ADD CONSTRAINT `관극기록_뮤지컬 아이디_fkey` FOREIGN KEY (`뮤지컬 아이디`) REFERENCES `뮤지컬`(`뮤지컬 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `사용자가 게시글에 누른 좋아요` ADD CONSTRAINT `사용자가 게시글에 누른 좋아요_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `게시글`(`글 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `사용자가 게시글에 누른 좋아요` ADD CONSTRAINT `사용자가 게시글에 누른 좋아요_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `유저`(`사용자 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `질문` ADD CONSTRAINT `질문_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `유저`(`사용자 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `답변` ADD CONSTRAINT `답변_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `질문`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `답변` ADD CONSTRAINT `답변_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `유저`(`사용자 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `뮤지컬_배우 중개테이블` ADD CONSTRAINT `뮤지컬_배우 중개테이블_musicalId_fkey` FOREIGN KEY (`musicalId`) REFERENCES `뮤지컬`(`뮤지컬 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `뮤지컬_배우 중개테이블` ADD CONSTRAINT `뮤지컬_배우 중개테이블_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `배우`(`배우 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `유저_커뮤니티 중개테이블` ADD CONSTRAINT `유저_커뮤니티 중개테이블_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `유저`(`사용자 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `유저_커뮤니티 중개테이블` ADD CONSTRAINT `유저_커뮤니티 중개테이블_communityId_fkey` FOREIGN KEY (`communityId`) REFERENCES `커뮤니티`(`커뮤니티 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `뮤지컬 커뮤니티` ADD CONSTRAINT `뮤지컬 커뮤니티_musicalId_fkey` FOREIGN KEY (`musicalId`) REFERENCES `뮤지컬`(`뮤지컬 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `뮤지컬 커뮤니티` ADD CONSTRAINT `뮤지컬 커뮤니티_communityId_fkey` FOREIGN KEY (`communityId`) REFERENCES `커뮤니티`(`커뮤니티 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `멀티프로필` ADD CONSTRAINT `멀티프로필_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `유저`(`사용자 아이디`) ON DELETE RESTRICT ON UPDATE CASCADE;
