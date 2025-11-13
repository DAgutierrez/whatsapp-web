import React, { useEffect, useMemo, useState } from "react";
import { Loader2, PlusCircle, Trash2, UserRound } from "lucide-react";
import { supabase } from "../lib/supabase";

type Client = {
  id: string;
  name: string;
  phone: string;
  created_at: string;
};

type FormState = {
  name: string;
  phone: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
};

export default function ClientManager() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadClients() {
      setIsFetching(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("clients")
        .select("id, name, phone, created_at")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setClients([]);
      } else {
        setClients(data || []);
      }

      setIsFetching(false);
    }

    loadClients();
  }, []);

  const isFormValid = useMemo(() => {
    const trimmedName = form.name.trim();
    const trimmedPhone = form.phone.trim();
    return trimmedName.length >= 3 && trimmedPhone.length >= 8;
  }, [form.name, form.phone]);

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError("Completa nombre (mín. 3 caracteres) y teléfono (mín. 8 dígitos).");
      return;
    }

    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setError("No se pudo obtener el token de autenticación.");
      setLoading(false);
      return;
    }

    try {
      const { error: invokeError } = await supabase.functions.invoke("bright-task", {
        body: {
          name: form.name.trim(),
          phone: form.phone.trim(),
        },
      });

      if (invokeError) {
        throw invokeError;
      }

      setSuccess("Cliente creado correctamente ✅");
      setForm(initialForm);
      await supabase
        .from("clients")
        .select("id, name, phone, created_at")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setClients(data || []);
        });
    } catch (requestError: any) {
      setSuccess(null);
      setError(requestError.message || "No se pudo crear el cliente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("¿Seguro que deseas eliminar este cliente?");
    if (!confirmed) return;

    const { error: deleteError } = await supabase.from("clients").delete().eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setSuccess("Cliente eliminado correctamente.");
      await supabase
        .from("clients")
        .select("id, name, phone, created_at")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setClients(data || []);
        });
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <UserRound className="w-6 h-6 text-indigo-600" />
              Mantenedor de Clientes
            </h2>
            <p className="text-gray-600">
              Registra nuevos clientes con su nombre y teléfono de contacto.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              placeholder="Ej: Ana Pérez"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={form.phone}
              onChange={handleChange("phone")}
              placeholder="Ej: +56912345678"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all disabled:bg-indigo-300"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Crear Cliente
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 min-h-[24px] space-y-2">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          {!error && success && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Clientes registrados</h3>
          <span className="text-sm text-gray-500">{clients.length} clientes</span>
        </div>

        {isFetching ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Cargando clientes...
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-2xl">
            Aún no has registrado clientes. Crea el primero usando el formulario superior.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Registrado
                  </th>
                  <th scope="col" className="px-4 py-3 text-sm font-semibold text-gray-700 uppercase tracking-wider text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{client.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{client.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(client.created_at).toLocaleString("es-CL", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm flex justify-end">
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

