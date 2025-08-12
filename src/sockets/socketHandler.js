export const setupSocket = (io) => {
    io.on("connection", (socket) => {
      console.log("📡 클라이언트 연결됨:", socket.id);
  
      // 메시지 받기
      socket.on("send_message", (data) => {
        console.log("📨 메시지 도착:", data);
  
        // 전체 클라이언트에게 전송
        io.emit("receive_message", data);
      });
  
      socket.on("disconnect", () => {
        console.log("❌ 연결 종료:", socket.id);
      });
    });
  };
  