import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// ----------------- TIPOS -----------------

interface Client {
  id: string;
  name: string;
  phone: string;
  business_id?: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Booking {
  id: string;
  date: string;
  status: string;
  created_at: string;
  clients: Client | null;
  services: Service | null;
}

interface Business {
  id: string;
  tutorial_completed: boolean;
}

// -----------------------------------------------------

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [form, setForm] = useState({
    client_id: "",
    service_id: "",
    date: "",
  });

  const [loading, setLoading] = useState(false);

  // ---- NUEVO: estado para crear cliente rápido ----
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState<{ name: string; phone: string }>(
    {
      name: "",
      phone: "",
    }
  );
  const [creatingClient, setCreatingClient] = useState(false);

  // ---- NEGOCIO (solo para filtrar datos, sin tutorial aquí) ----
  const [business, setBusiness] = useState<Business | null>(null);

  // ---- Cargar negocio asociado al usuario ----
  useEffect(() => {
    async function loadBusinessForUser() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Error obteniendo usuario:", userError);
          return;
        }

        const { data: businessesData, error: businessError } = await supabase
          .from("businesses")
          .select("id, tutorial_completed, owner_id")
          .eq("owner_id", user.id);

        if (businessError) {
          console.error("Error obteniendo negocio:", businessError);
          return;
        }

        const businessData =
          businessesData && businessesData.length > 0
            ? (businessesData[0] as Business)
            : null;

        if (businessData) {
          setBusiness(businessData);
        }
      } catch (err) {
        console.error("Error inesperado:", err);
      }
    }

    loadBusinessForUser();
  }, []);

  // ---- Cuando ya tenemos business, cargamos datos filtrados por ese negocio ----
  useEffect(() => {
    if (business?.id) {
      loadData(business.id);
    }
  }, [business]);

  // ------------------ Cargar datos de reservas / clientes ------------------

  async function loadData(businessId: string) {
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        date,
        status,
        created_at,
        clients!inner ( id, name, phone, business_id ),
        services ( id, name, price )
      `
      )
      .eq("clients.business_id", businessId)
      .order("date", { ascending: true });

    if (bookingsError) {
      console.error("Error cargando reservas:", bookingsError);
    }

    const { data: clientsData, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .eq("business_id", businessId);

    if (clientsError) {
      console.error("Error cargando clientes:", clientsError);
    }

    const { data: servicesData, error: servicesError } = await supabase
      .from("services")
      .select("*")
      .eq("business_id", businessId);

    if (servicesError) {
      console.error("Error cargando servicios:", servicesError);
    }

    const normalizedBookings: Booking[] = (bookingsData || []).map(
      (b: any) => ({
        id: String(b.id),
        date: String(b.date),
        status: String(b.status),
        created_at: String(b.created_at),
        clients: b.clients
          ? {
              id: String(b.clients.id),
              name: String(b.clients.name),
              phone: String(b.clients.phone),
              business_id: String(b.clients.business_id),
            }
          : null,
        services: b.services
          ? {
              id: String(b.services.id),
              name: String(b.services.name),
              price: Number(b.services.price),
            }
          : null,
      })
    );

    setBookings(normalizedBookings);
    setClients((clientsData as Client[]) || []);
    setServices((servicesData as Service[]) || []);
  }

  // ------------------- Crear cliente rápido -------------------

  async function handleCreateClient() {
    if (!newClient.name.trim() || !newClient.phone.trim()) {
      alert("⚠️ Ingresa nombre y teléfono del cliente");
      return;
    }

    try {
      setCreatingClient(true);

      const { data, error } = await supabase.functions.invoke("bright-task", {
        body: {
          name: newClient.name.trim(),
          phone: newClient.phone.trim(),
        },
      });

      if (error) {
        console.error(
          "Error al invocar bright-task (detalles):",
          JSON.stringify(error, null, 2)
        );
        alert("❌ No se pudo crear el cliente (error en servidor).");
        return;
      }

      if (!data?.client) {
        console.error("Respuesta inesperada de bright-task:", data);
        alert("❌ No se pudo crear el cliente (respuesta inválida).");
        return;
      }

      const createdClient = data.client as Client;

      setClients((prev) => [...prev, createdClient]);
      setForm((prev) => ({
        ...prev,
        client_id: createdClient.id,
      }));
      setNewClient({ name: "", phone: "" });
      setIsAddingClient(false);

      if (data.whatsapp?.ok) {
        alert(`✅ Cliente "${createdClient.name}" creado y WhatsApp enviado ✅`);
      } else {
        alert(
          `✅ Cliente "${createdClient.name}" creado.\n` +
            `⚠️ Pero el WhatsApp no se pudo enviar automáticamente.`
        );
      }
    } finally {
      setCreatingClient(false);
    }
  }

  // ------------------- Crear nueva reserva -------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.client_id || !form.service_id || !form.date) {
      alert("⚠️ Completa todos los campos");
      return;
    }

    if (!business?.id) {
      alert(
        "⚠️ No se encontró el negocio para asociar la reserva (aunque se deduce por el cliente)."
      );
    }

    setLoading(true);

    const { error } = await supabase.from("bookings").insert([
      {
        client_id: form.client_id,
        service_id: form.service_id,
        date: form.date,
        status: "confirmed",
      },
    ]);

    setLoading(false);

    if (error) {
      alert("❌ Error al crear la reserva: " + error.message);
    } else {
      alert("✅ Reserva creada correctamente");
      setForm({ client_id: "", service_id: "", date: "" });
      if (business?.id) {
        loadData(business.id);
      }
    }
  }

  // ------------------- Eliminar / actualizar -------------------

  async function handleDelete(id: string) {
    if (!window.confirm("¿Seguro que deseas eliminar esta reserva?")) return;

    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (error) alert("Error eliminando reserva: " + error.message);
    else if (business?.id) loadData(business.id);
  }

  async function handleStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) alert("Error actualizando estado: " + error.message);
    else if (business?.id) loadData(business.id);
  }

  // ------------------------- RENDER ---------------------------

  return (
    <div className="relative p-6 max-w-5xl mx-auto">
      <h2 id="title" className="text-3xl font-bold mb-6">
        📅 Panel de Reservas
      </h2>

      {/* ---------------- Formulario Reserva ---------------- */}
      <form
        id="add-booking"
        onSubmit={handleSubmit}
        className="bg-gray-100 p-4 rounded-2xl mb-6 shadow flex flex-col gap-3"
      >
        <h3 className="font-semibold text-lg mb-2">➕ Nueva Reserva</h3>

        {/* Select de clientes + opción Añadir nuevo */}
        <div>
          <select
            id="new-client"
            className="p-2 border rounded w-full"
            value={form.client_id || (isAddingClient ? "__new__" : "")}
            onChange={(e) => {
              const value = (e.target as HTMLSelectElement).value;
              if (value === "__new__") {
                setIsAddingClient(true);
                setForm((prev) => ({ ...prev, client_id: "" }));
              } else {
                setIsAddingClient(false);
                setForm((prev) => ({ ...prev, client_id: value }));
              }
            }}
          >
            <option value="">Selecciona un cliente</option>
            <option value="__new__">➕ Añadir nuevo cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>

          {isAddingClient && (
            <div className="mt-2 bg-white border rounded-lg p-3 space-y-2">
              <h4 className="font-semibold text-sm">Nuevo cliente</h4>
              <input
                type="text"
                placeholder="Nombre del cliente"
                className="w-full p-2 border rounded text-sm"
                value={newClient.name}
                onChange={(e) =>
                  setNewClient((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                type="tel"
                placeholder="Teléfono (con código de país)"
                className="w-full p-2 border rounded text-sm"
                value={newClient.phone}
                onChange={(e) =>
                  setNewClient((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
              <button
                type="button"
                onClick={handleCreateClient}
                className="mt-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                disabled={creatingClient}
              >
                {creatingClient
                  ? "Creando..."
                  : "Crear cliente"}
              </button>
            </div>
          )}
        </div>

        {/* Select de servicios */}
        <select
          id="new-service"
          className="p-2 border rounded"
          value={form.service_id}
          onChange={(e) =>
            setForm({
              ...form,
              service_id: (e.target as HTMLSelectElement).value,
            })
          }
        >
          <option value="">Selecciona un servicio</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — ${s.price}
            </option>
          ))}
        </select>

        <input
          id="new-date"
          type="datetime-local"
          className="p-2 border rounded"
          value={form.date}
          onChange={(e) =>
            setForm({
              ...form,
              date: (e.target as HTMLInputElement).value,
            })
          }
        />

        <button
          id="booking-add-button"
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded py-2 font-medium transition"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Agregar Reserva"}
        </button>
      </form>

      {/* ---------------- Tabla de Reservas ---------------- */}
      <div id="bookings-table" className="overflow-x-auto">
        <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden border-collapse">
          <thead className="bg-blue-500 text-white text-left">
            <tr>
              <th className="p-3">Cliente</th>
              <th className="p-3">Servicio</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {bookings.length > 0 ? (
              bookings.map((b) => (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{b.clients?.name}</td>
                  <td className="p-3">{b.services?.name}</td>
                  <td className="p-3">
                    {new Date(b.date).toLocaleString("es-CL", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="p-3 capitalize">{b.status}</td>

                  <td className="p-3 flex justify-center gap-2 booking-actions">
                    <button
                      onClick={() => handleStatus(b.id, "completed")}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      Completar
                    </button>
                    <button
                      onClick={() => handleStatus(b.id, "cancelled")}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No hay reservas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
