import pkg from '@prisma/client';
const { PrismaClient } = pkg;

export const prisma = new PrismaClient();

export const createQuestion = async ({ userId, title, content }) => {
  console.log(Object.keys(prisma));
  return await prisma.question.create({
    data: {
      userId,
      title,
      content,
    },
  });
};

export const getAllQuestions = async () => {
  return await prisma.question.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          profileImage: true,
        },
      },
    },
  });
};

export const getQuestionById = async (id) => {
  return await prisma.question.findUnique({
    where: { id },
  });
};

export const createAnswer = async (questionId, userId, content) => {
  return await prisma.answer.create({
    data: {
      questionId,
      userId,
      content,
    },
  });
};

export const getQuestionDetail = async (questionId) => {
  return await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          profileImage: true,
        },
      },
      answers: {
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
};