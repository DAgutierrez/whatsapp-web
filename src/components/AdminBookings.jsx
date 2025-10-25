import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ client_id: "", service_id: "", date: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Cargar reservas, clientes y servicios
  async function loadData() {
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select(`
        id,
        date,
        status,
        created_at,
        clients ( name, phone ),
        services ( name, price )
      `)
      .order("date", { ascending: true });

    const { data: clientsData } = await supabase.from("clients").select("*");
    const { data: servicesData } = await supabase.from("services").select("*");

    setBookings(bookingsData || []);
    setClients(clientsData || []);
    setServices(servicesData || []);
  }

  // 🔹 Crear una nueva reserva
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.client_id || !form.service_id || !form.date) {
      alert("⚠️ Completa todos los campos");
      return;
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
      loadData();
    }
  }

  // 🔹 Eliminar reserva
  async function handleDelete(id) {
    if (!window.confirm("¿Seguro que deseas eliminar esta reserva?")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) alert("Error eliminando reserva: " + error.message);
    else loadData();
  }

  // 🔹 Cambiar estado
  async function handleStatus(id, newStatus) {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) alert("Error actualizando estado: " + error.message);
    else loadData();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">📅 Panel de Reservas</h2>

      {/* Formulario para agregar una nueva reserva */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-100 p-4 rounded-2xl mb-6 shadow flex flex-col gap-3"
      >
        <h3 className="font-semibold text-lg mb-2">➕ Nueva Reserva</h3>

        <select
          className="p-2 border rounded"
          value={form.client_id}
          onChange={(e) => setForm({ ...form, client_id: e.target.value })}
        >
          <option value="">Selecciona un cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.phone})
            </option>
          ))}
        </select>

        <select
          className="p-2 border rounded"
          value={form.service_id}
          onChange={(e) => setForm({ ...form, service_id: e.target.value })}
        >
          <option value="">Selecciona un servicio</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — ${s.price}
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          className="p-2 border rounded"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded py-2 font-medium transition"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Agregar Reserva"}
        </button>
      </form>

      {/* Tabla de reservas */}
      <div className="overflow-x-auto">
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
                  <td className="p-3 flex justify-center gap-2">
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
                <td colSpan="5" className="p-4 text-center text-gray-500">
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
