// testClient.js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("✅ 연결 성공");

  // 메시지 보내기
  socket.emit("send_message", {
    chatRoomId: 1,
    content: "테스트 메시지야"
  });
});

socket.on("receive_message", (msg) => {
  console.log("📩 받은 메시지:", msg);
});
