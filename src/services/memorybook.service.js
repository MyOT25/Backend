import prisma from "../config/prismaClient.js";
import CustomError, { BadRequestError } from "../middlewares/CustomError.js";

export const createMemoryBookService = async (userId, body) => {
  console.log("📦 body in service:", body);
  const { targetType, targetId, title, content }=body;
  console.log("📦 targetType in service:", targetType);
  console.log("📦 typeof targetType:", typeof targetType);

  if (!targetType) {
    throw new CustomError.BadRequestError("targetType은 필수입니다.");
  }

  const type = targetType.toUpperCase();

  if (type === "MUSICAL") {
    const musical = await prisma.musical.findUnique({
      where: { id: targetId },
    });
    if (!musical) {
      throw new CustomError.BadRequestError("존재하지 않는 뮤지컬입니다.");
    }
  } else if (type === "ACTOR") {
    const actor = await prisma.actor.findUnique({
      where: { id: targetId },
    });
    if (!actor) {
      throw new CustomError.BadRequestError("존재하지 않는 배우입니다.");
    }
  } else {
    throw new CustomError.BadRequestError("잘못된 targetType입니다. (MUSICAL 또는 ACTOR만 허용)");
  }

  const memoryBook = await prisma.memoryBook.create({
    data: {
      userId,
      targetType: type, // DB 저장 시 대문자로 통일
      targetId,
      title,
      content,
    },
  });

  return memoryBook;
};

export const getMemoryBookService= async (userId, targetType, targetId) => {
  const memoryBook = await prisma.memoryBook.findFirst({
    where: {
      userId,
      targetType,
      targetId,
    },
  });

  if (!memoryBook) {
    throw new BadRequestError("메모리북이 존재하지 않습니다.");
  }

  return memoryBook;
};

export const updateMemoryBookService = async (
  userId,
  targetType,
  targetId,
  title,
  content
) => {
  const existingMemoryBook = await prisma.memoryBook.findFirst({
    where: {
      userId,
      targetType,
      targetId,
    },
  });

  if (!existingMemoryBook) {
    throw new BadRequestError("메모리북이 존재하지 않습니다.");
  }

  const updatedMemoryBook = await prisma.memoryBook.update({
    where: { id: existingMemoryBook.id },
    data: {
      title,
      content,
      updatedAt: new Date(),
    },
  });

  return updatedMemoryBook;
};