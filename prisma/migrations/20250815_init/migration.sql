-- DropForeignKey
ALTER TABLE `Answer` DROP FOREIGN KEY `Answer_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `Answer` DROP FOREIGN KEY `Answer_userId_fkey`;

-- DropForeignKey
ALTER TABLE `AnswerComment` DROP FOREIGN KEY `AnswerComment_answerId_fkey`;

-- DropForeignKey
ALTER TABLE `AnswerComment` DROP FOREIGN KEY `AnswerComment_userId_fkey`;

-- DropForeignKey
ALTER TABLE `AnswerLike` DROP FOREIGN KEY `AnswerLike_answerId_fkey`;

-- DropForeignKey
ALTER TABLE `AnswerLike` DROP FOREIGN KEY `AnswerLike_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `AnswerLike` DROP FOREIGN KEY `AnswerLike_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Casting` DROP FOREIGN KEY `Casting_actorId_fkey`;

-- DropForeignKey
ALTER TABLE `Casting` DROP FOREIGN KEY `Casting_musicalId_fkey`;

-- DropForeignKey
ALTER TABLE `ChatRoomUser` DROP FOREIGN KEY `ChatRoomUser_chatRoomId_fkey`;

-- DropForeignKey
ALTER TABLE `ChatRoomUser` DROP FOREIGN KEY `ChatRoomUser_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Follow` DROP FOREIGN KEY `Follow_followerId_fkey`;

-- DropForeignKey
ALTER TABLE `Follow` DROP FOREIGN KEY `Follow_followingId_fkey`;

-- DropForeignKey
ALTER TABLE `MemoryBook` DROP FOREIGN KEY `MemoryBook_communityId_fkey`;

-- DropForeignKey
ALTER TABLE `MemoryBook` DROP FOREIGN KEY `MemoryBook_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_chatRoomId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `MessageRead` DROP FOREIGN KEY `MessageRead_messageId_fkey`;

-- DropForeignKey
ALTER TABLE `MessageRead` DROP FOREIGN KEY `MessageRead_userId_fkey`;

-- DropForeignKey
ALTER TABLE `MultiProfile` DROP FOREIGN KEY `MultiProfile_communityId_fkey`;

-- DropForeignKey
ALTER TABLE `MultiProfile` DROP FOREIGN KEY `MultiProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Musical` DROP FOREIGN KEY `Musical_theaterId_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_communityId_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_repostTargetId_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_userId_fkey`;

-- DropForeignKey
ALTER TABLE `PostBookmark` DROP FOREIGN KEY `PostBookmark_postId_fkey`;

-- DropForeignKey
ALTER TABLE `PostBookmark` DROP FOREIGN KEY `PostBookmark_userId_fkey`;

-- DropForeignKey
ALTER TABLE `PostComment` DROP FOREIGN KEY `PostComment_postId_fkey`;

-- DropForeignKey
ALTER TABLE `PostComment` DROP FOREIGN KEY `PostComment_userId_fkey`;

-- DropForeignKey
ALTER TABLE `PostImage` DROP FOREIGN KEY `PostImage_postId_fkey`;

-- DropForeignKey
ALTER TABLE `PostLike` DROP FOREIGN KEY `PostLike_postId_fkey`;

-- DropForeignKey
ALTER TABLE `PostLike` DROP FOREIGN KEY `PostLike_userId_fkey`;

-- DropForeignKey
ALTER TABLE `PostTag` DROP FOREIGN KEY `PostTag_postId_fkey`;

-- DropForeignKey
ALTER TABLE `PostTag` DROP FOREIGN KEY `PostTag_tagId_fkey`;

-- DropForeignKey
ALTER TABLE `PostTag` DROP FOREIGN KEY `PostTag_tagPostId_fkey`;

-- DropForeignKey
ALTER TABLE `Question` DROP FOREIGN KEY `Question_userId_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionComment` DROP FOREIGN KEY `QuestionComment_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionComment` DROP FOREIGN KEY `QuestionComment_userId_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionCommentLike` DROP FOREIGN KEY `QuestionCommentLike_commentId_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionCommentLike` DROP FOREIGN KEY `QuestionCommentLike_userId_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionGood` DROP FOREIGN KEY `QuestionGood_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionGood` DROP FOREIGN KEY `QuestionGood_userId_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionImage` DROP FOREIGN KEY `QuestionImage_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionImage` DROP FOREIGN KEY `QuestionImage_userId_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionLike` DROP FOREIGN KEY `QuestionLike_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionLike` DROP FOREIGN KEY `QuestionLike_userId_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionTag` DROP FOREIGN KEY `QuestionTag_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionTag` DROP FOREIGN KEY `QuestionTag_tagId_fkey`;

-- DropForeignKey
ALTER TABLE `QuestionTag` DROP FOREIGN KEY `QuestionTag_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Review` DROP FOREIGN KEY `Review_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Review` DROP FOREIGN KEY `review_postId_fkey`;

-- DropForeignKey
ALTER TABLE `Seat` DROP FOREIGN KEY `Seat_theaterId_fkey`;

-- DropForeignKey
ALTER TABLE `Setting` DROP FOREIGN KEY `Setting_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Subscribe` DROP FOREIGN KEY `Subscribe_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Theater` DROP FOREIGN KEY `Theater_regionId_fkey`;

-- DropForeignKey
ALTER TABLE `UserCommunity` DROP FOREIGN KEY `UserCommunity_communityId_fkey`;

-- DropForeignKey
ALTER TABLE `UserCommunity` DROP FOREIGN KEY `UserCommunity_userId_fkey`;

-- DropForeignKey
ALTER TABLE `UserSeat` DROP FOREIGN KEY `UserSeat_seatId_fkey`;

-- DropForeignKey
ALTER TABLE `UserSeat` DROP FOREIGN KEY `UserSeat_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ViewingImage` DROP FOREIGN KEY `ViewingImage_viewingId_fkey`;

-- DropForeignKey
ALTER TABLE `ViewingLike` DROP FOREIGN KEY `ViewingLike_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ViewingLike` DROP FOREIGN KEY `ViewingLike_viewingId_fkey`;

-- DropForeignKey
ALTER TABLE `ViewingRecord` DROP FOREIGN KEY `ViewingRecord_musicalId_fkey`;

-- DropForeignKey
ALTER TABLE `ViewingRecord` DROP FOREIGN KEY `ViewingRecord_seatId_fkey`;

-- DropForeignKey
ALTER TABLE `ViewingRecord` DROP FOREIGN KEY `ViewingRecord_userId_fkey`;

-- DropTable
DROP TABLE `Actor`;

-- DropTable
DROP TABLE `Answer`;

-- DropTable
DROP TABLE `AnswerComment`;

-- DropTable
DROP TABLE `AnswerLike`;

-- DropTable
DROP TABLE `Bookmark`;

-- DropTable
DROP TABLE `Casting`;

-- DropTable
DROP TABLE `ChatRoom`;

-- DropTable
DROP TABLE `ChatRoomUser`;

-- DropTable
DROP TABLE `Community`;

-- DropTable
DROP TABLE `Follow`;

-- DropTable
DROP TABLE `Image`;

-- DropTable
DROP TABLE `MemoryBook`;

-- DropTable
DROP TABLE `Message`;

-- DropTable
DROP TABLE `MessageRead`;

-- DropTable
DROP TABLE `MultiProfile`;

-- DropTable
DROP TABLE `Musical`;

-- DropTable
DROP TABLE `MusicalCommunity`;

-- DropTable
DROP TABLE `Post`;

-- DropTable
DROP TABLE `PostBookmark`;

-- DropTable
DROP TABLE `PostComment`;

-- DropTable
DROP TABLE `PostImage`;

-- DropTable
DROP TABLE `PostLike`;

-- DropTable
DROP TABLE `PostTag`;

-- DropTable
DROP TABLE `Question`;

-- DropTable
DROP TABLE `QuestionComment`;

-- DropTable
DROP TABLE `QuestionCommentLike`;

-- DropTable
DROP TABLE `QuestionGood`;

-- DropTable
DROP TABLE `QuestionImage`;

-- DropTable
DROP TABLE `QuestionLike`;

-- DropTable
DROP TABLE `QuestionTag`;

-- DropTable
DROP TABLE `QuestionTagMaster`;

-- DropTable
DROP TABLE `Region`;

-- DropTable
DROP TABLE `Review`;

-- DropTable
DROP TABLE `Seat`;

-- DropTable
DROP TABLE `Setting`;

-- DropTable
DROP TABLE `Subscribe`;

-- DropTable
DROP TABLE `Tag`;

-- DropTable
DROP TABLE `Tag_Post`;

-- DropTable
DROP TABLE `Theater`;

-- DropTable
DROP TABLE `User`;

-- DropTable
DROP TABLE `UserCommunity`;

-- DropTable
DROP TABLE `UserSeat`;

-- DropTable
DROP TABLE `ViewingImage`;

-- DropTable
DROP TABLE `ViewingLike`;

-- DropTable
DROP TABLE `ViewingRecord`;

