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
      url: "/",
      description: "Same origin",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        // 이름은 bearerAuth로 지정
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT", // 옵션 (UI에 표시)
      },
    },
  },
  security: [
    {
      bearerAuth: [], // 모든 API에 기본 적용
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./src/controllers/**/*.js"], // 주석으로 API 문서 작성할 경로
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
