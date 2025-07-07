import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "MyOT API",
    version: "1.0.0",
    description: "MyOT 프로젝트 API 명세서",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "로컬 개발 서버",
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.js", "./src/controllers/*.js"], // 주석으로 API 문서 작성할 경로
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;