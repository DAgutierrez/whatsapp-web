// ChatAdmin.tsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Conexión con tu backend
const socket = io("http://localhost:5000");

interface Mensaje {
  from: string;
  text: string;
  sender: "user" | "admin"; // Distinción entre usuario real y admin
}

export default function ChatRealtime() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [destinatario, setDestinatario] = useState("");

  useEffect(() => {
    socket.on("nuevoMensaje", (msg: Mensaje) => {
      setMensajes((prev) => [...prev, msg]);
      if (msg.sender === "user") setDestinatario(msg.from);
    });

    return () => {
      socket.off("nuevoMensaje");
    };
  }, []);

  const enviar = () => {
    if (!texto.trim() || !destinatario) return;

    socket.emit("enviarAdmin", { to: destinatario, text: texto });
    setMensajes((prev) => [...prev, { from: "Admin", text: texto, sender: "admin" }]);
    setTexto("");
  };

  return (
    <div className="flex flex-col h-[500px] border border-gray-300 rounded-lg">
      {/* Header */}
      <div className="bg-green-600 text-white p-3 rounded-t-lg font-semibold">
        Chat con usuarios
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#ece5dd]">
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={`flex mb-2 ${m.sender === "admin" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-xs text-sm ${
                m.sender === "admin"
                  ? "bg-green-100 text-gray-900 rounded-bl-none"
                  : "bg-green-500 text-white rounded-br-none"
              }`}
            >
              {m.text}
              <div className="text-[10px] opacity-70 mt-1">
                {m.sender === "admin" ? "Tú (Admin)" : m.from}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white flex items-center space-x-2 border-t">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 border border-gray-300 rounded-full px-3 py-2 focus:outline-none"
        />
        <button
          onClick={enviar}
          className="bg-green-500 text-white rounded-full p-3 hover:bg-green-600 transition"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
