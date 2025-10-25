// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Cuando un cliente se conecta
io.on("connection", (socket) => {
  console.log("🔌 Usuario conectado:", socket.id);

  // Escuchar mensajes desde el cliente
  socket.on("mensaje", (msg) => {
    console.log("📩 Mensaje recibido:", msg);

    // Enviar la respuesta a ese cliente
    socket.emit("respuesta", `¡Hola Buenas tardes! Claro estare encantado de ayudarte, ¿Que tipo de pregunta te gustar consultar? `);
  });

  // Cuando un cliente se desconecta
  socket.on("disconnect", () => {
    console.log("❌ Usuario desconectado:", socket.id);
  });
});

// Levantar servidor
server.listen(4000, () => {
  console.log("✅ Servidor escuchando en http://localhost:4000");
});
