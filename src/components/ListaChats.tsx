// ListaChats.tsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { v4 as uuid } from "uuid";

const socket = io(import.meta.env.VITE_BACKEND_URL || "https://backendbot-fof9.onrender.com");


interface Mensaje {
  id: string;
  from: string;
  text: string;
  sender: "user" | "admin";
  hora?: string;
  assigned_to?: string | null;
  chat_id: string;
}

interface Conversacion {
  id: string; // chat_id
  from: string; // wa_id
  mensajes: Mensaje[];
  noLeidos?: number;
  assigned_to?: string | null;
  last_message?: string;
}

interface Props {
  currentAdmin: string; // admin logueado
}

export default function ListaChat({ currentAdmin }: Props) {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // 🔹 Unirse a "room" del admin al conectar
  useEffect(() => {
    if (currentAdmin) {
      socket.emit("joinAdmin", currentAdmin); // se une con su correo
      socket.emit("getChats", currentAdmin);  // carga sus chats al mismo tiempo
    }
  }, [currentAdmin]);


  // 🔹 Cargar chats al inicio
  useEffect(() => {
    socket.emit("getChats", currentAdmin);

    socket.on("chats", (data: any[]) => {
      const filtrados = data.filter(
        (c) => !c.assigned_to || c.assigned_to === currentAdmin
      );

      const convs = filtrados.map((c) => ({
        id: c.id, // chat_id
        from: c.wa_id,
        mensajes: (c.messages || []).map((m: any) => ({
          id: m.id || uuid(),
          from: m.wa_id,
          text: m.message,
          sender: m.direction === "incoming" ? "user" : "admin",
          hora: m.timestamp
            ? new Date(m.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
            : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          assigned_to: c.assigned_to || null,
          chat_id: c.id,
        })),
        noLeidos: (c.messages || []).filter((m: any) => m.direction === "incoming").length,
        assigned_to: c.assigned_to || null,
        last_message: c.last_message || "",
      }));

      setConversaciones(convs);
    });

    return () => {
      socket.off("chats");
    };
  }, [currentAdmin]);

  // 🔹 Escuchar nuevos mensajes
  useEffect(() => {
    socket.on("nuevoMensaje", (msg: Mensaje) => {
      if (msg.assigned_to && msg.assigned_to !== currentAdmin && msg.sender === "user") return;

      const mensajeConHora = {
        ...msg,
        hora: msg.hora || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setConversaciones((prev) => {
        const existe = prev.find((c) => c.id === mensajeConHora.chat_id);
        if (existe) {
          return prev.map((c) =>
            c.id === mensajeConHora.chat_id
              ? {
                ...c,
                mensajes: [...c.mensajes, mensajeConHora],
                noLeidos:
                  c.id === selectedChat
                    ? 0
                    : mensajeConHora.sender === "user"
                      ? (c.noLeidos || 0) + 1
                      : c.noLeidos,
                assigned_to: c.assigned_to || mensajeConHora.assigned_to || null,
              }
              : c
          );
        } else {
          return [
            ...prev,
            {
              id: mensajeConHora.chat_id,
              from: mensajeConHora.from,
              mensajes: [mensajeConHora],
              noLeidos: mensajeConHora.sender === "user" ? 1 : 0,
              assigned_to: mensajeConHora.assigned_to || null,
              last_message: mensajeConHora.text,
            },
          ];
        }
      });
    });

    return () => {
      socket.off("nuevoMensaje");
    };
  }, [selectedChat, currentAdmin]);

  // 🔹 Escuchar cuando llega un nuevo chat desde el backend
  // Escuchar cuando llega un nuevo chat desde el backend
  useEffect(() => {
    socket.on("nuevoChat", (data: any) => {
      console.log("🆕 Nuevo chat recibido:", data);

      // Agregar chat si no existe
      setConversaciones((prev) => {
        const existe = prev.find((c) => c.id === data.chat_id);
        if (existe) return prev;

        return [
          {
            id: data.chat_id,
            from: data.from,
            mensajes: [
              {
                id: uuid(),
                from: data.from,
                text: data.text,
                sender: "user",
                hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                chat_id: data.chat_id,
                assigned_to: null,
              },
            ],
            noLeidos: 1,
            assigned_to: null,
            last_message: data.text,
          },
          ...prev,
        ];
      });
    });

    return () => {
      socket.off("nuevoChat");
    };
  }, [currentAdmin]);




  // 🔹 Escuchar asignaciones de chats
  useEffect(() => {
    socket.on(
      "chatAsignado",
      ({ chat_id, assigned_to, text }: { chat_id: string; assigned_to: string; text: string }) => {
        if (assigned_to !== currentAdmin) {
          // Remover el chat si fue asignado a otro admin
          setConversaciones((prev) => prev.filter((c) => c.id !== chat_id));
          setSelectedChat((prev) => (prev === chat_id ? null : prev));
        } else {
          // Actualizar assigned_to y último mensaje
          setConversaciones((prev) =>
            prev.map((c) =>
              c.id === chat_id ? { ...c, assigned_to, last_message: text } : c
            )
          );
        }
      }
    );

    return () => {
      socket.off("chatAsignado");
    };
  }, [currentAdmin]);

  // 🔹 Enviar mensaje admin
  const enviar = () => {
    if (!texto.trim() || !selectedChat) return;
    console.log("Enviando mensaje como admin:", currentAdmin);

    const nuevoMsg: Mensaje = {
      id: uuid(),
      from: "Admin",
      text: texto,
      sender: "admin",
      hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      assigned_to: currentAdmin,
      chat_id: selectedChat,
    };

    socket.emit("enviarAdmin", { chat_id: selectedChat, text: texto, adminEmail: currentAdmin });


    setConversaciones((prev) =>
      prev.map((c) =>
        c.id === selectedChat
          ? { ...c, mensajes: [...c.mensajes, nuevoMsg], assigned_to: currentAdmin, last_message: texto }
          : c
      )
    );

    setTexto("");
  };

  const chatSeleccionado = conversaciones.find((c) => c.id === selectedChat);

  const getIniciales = (nombre: string) =>
    nombre
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const conversacionesFiltradas = conversaciones.filter((c) =>
    c.from.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex h-[600px] border rounded-lg shadow-lg">
      {/* Lista de conversaciones */}
      <div className="w-1/3 border-r flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b bg-green-600 text-white">
          <h2 className="text-lg font-semibold">Conversaciones</h2>
          <span className="text-sm bg-white text-green-700 px-2 py-1 rounded-full">
            {conversaciones.length} activas
          </span>
        </div>

        {/* Buscador */}
        <div className="p-3 border-b bg-gray-50">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar conversaciones..."
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1">
          {conversacionesFiltradas.map((c) => {
            const ultimoMensaje = c.mensajes[c.mensajes.length - 1];
            const noLeidos = c.noLeidos || 0;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedChat(c.id)}
                className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-100 border-b ${selectedChat === c.id ? "bg-green-100" : "bg-white"
                  }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                    {getIniciales(c.from)}
                  </div>
                </div>

                {/* Info */}
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">{c.from}</h3>
                    <span className="text-xs text-gray-500">{ultimoMensaje?.hora || ""}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{ultimoMensaje?.text}</p>
                </div>

                {/* Badge mensajes nuevos */}
                {noLeidos > 0 && (
                  <div className="ml-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {noLeidos}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat seleccionado */}
      <div className="flex-1 flex flex-col bg-[#ece5dd]">
        {chatSeleccionado ? (
          <>
            <div className="bg-green-600 text-white p-3 font-semibold">
              {chatSeleccionado.from}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {chatSeleccionado.mensajes.map((m) => (
                <div
                  key={m.id}
                  className={`flex mb-2 ${m.sender === "admin" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg max-w-xs text-sm shadow ${m.sender === "admin"
                      ? "bg-white text-gray-900 rounded-bl-none"
                      : "bg-[#dcf8c6] text-gray-900 rounded-br-none"
                      }`}
                  >
                    {m.text}
                    <span
                      className={`block text-[10px] mt-1 text-right ${m.sender === "admin" ? "text-gray-400" : "text-gray-500"
                        }`}
                    >
                      {m.hora}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-white flex items-center space-x-2 border-t">
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 border rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={enviar}
                className="bg-green-500 text-white rounded-full p-3 hover:bg-green-600 transition"
              >
                ➤
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Selecciona una conversación
          </div>
        )}
      </div>
    </div>
  );
}
