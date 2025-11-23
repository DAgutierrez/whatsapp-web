import React, { useEffect, useMemo, useState } from "react";
import { Loader2, PlusCircle, Trash2, UserRound } from "lucide-react";
import { supabase } from "../lib/supabase";

type Client = {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  business_id?: string;
};

type FormState = {
  name: string;
  phone: string;
};

type Business = {
  id: string;
  name?: string;
  code?: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
};

export default function ClientManager() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [clients, setClients] = useState<Client[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);

  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ---------- Cargar negocio + clientes de ese negocio ----------
  useEffect(() => {
    async function loadBusinessAndClients() {
      setIsFetching(true);
      setError(null);

      // 1) Usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("No se pudo obtener el usuario autenticado.");
        setIsFetching(false);
        return;
      }

      // 2) Buscar negocio(s) del usuario por owner_id
      const { data: businessesData, error: bizError } = await supabase
        .from("businesses")
        .select("id, name, code, owner_id")
        .eq("owner_id", user.id);

      if (bizError) {
        setError("No se pudo cargar el negocio.");
        console.error(bizError);
        setIsFetching(false);
        return;
      }

      const currentBusiness = businessesData && businessesData.length > 0
        ? ({ id: businessesData[0].id, name: businessesData[0].name, code: businessesData[0].code } as Business)
        : null;

      if (!currentBusiness) {
        setError("No se encontró un negocio asociado a tu cuenta.");
        setIsFetching(false);
        return;
      }

      setBusiness(currentBusiness);

      // 3) Cargar solo clientes de ese negocio
      const { data, error: fetchError } = await supabase
        .from("clients")
        .select("id, name, phone, created_at, business_id")
        .eq("business_id", currentBusiness.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setClients([]);
      } else {
        setClients((data as Client[]) || []);
      }

      setIsFetching(false);
    }

    loadBusinessAndClients();
  }, []);

  async function reloadClientsForBusiness(businessId: string) {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, phone, created_at, business_id")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setClients([]);
    } else {
      setClients((data as Client[]) || []);
    }
  }

  // ---------- Validación del formulario ----------
  const isFormValid = useMemo(() => {
    const trimmedName = form.name.trim();
    const trimmedPhone = form.phone.trim();
    return trimmedName.length >= 3 && trimmedPhone.length >= 8;
  }, [form.name, form.phone]);

  const handleChange =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  // ---------- Crear cliente ----------
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isFormValid) {
      setError(
        "Completa nombre (mín. 3 caracteres) y teléfono (mín. 8 dígitos)."
      );
      return;
    }

    if (!business) {
      setError("No se encontró el negocio para asociar al cliente.");
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
      // 👇 Aquí le pasamos también el business_id a tu Edge Function
      const { error: invokeError } = await supabase.functions.invoke(
        "bright-task",
        {
          body: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            business_id: business.id, // 👈 MUY IMPORTANTE
          },
        }
      );

      if (invokeError) {
        throw invokeError;
      }

      setSuccess("Cliente creado correctamente ✅");
      setForm(initialForm);

      window.dispatchEvent(new Event("admin-tutorial-next"));

      // Volver a cargar solo clientes de ESTE negocio
      await reloadClientsForBusiness(business.id);
    } catch (requestError: any) {
      setSuccess(null);
      setError(requestError.message || "No se pudo crear el cliente.");
    } finally {
      setLoading(false);
    }
  }

  // ---------- Eliminar cliente ----------
  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar este cliente?"
    );
    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setSuccess("Cliente eliminado correctamente.");
      if (business) {
        await reloadClientsForBusiness(business.id);
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="clients-title" className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <UserRound className="w-6 h-6 text-indigo-600" />
              Mantenedor de Clientes
            </h2>
            <p className="text-gray-600">
              Registra nuevos clientes con su nombre y teléfono de contacto.
            </p>
            {business && (
              <p className="text-xs text-gray-500 mt-1">
                Negocio actual:{" "}
                <span className="font-semibold">
                  {business.name || "Sin nombre"}{" "}
                  {business.code ? `(${business.code})` : ""}
                </span>
              </p>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4"
        > 
          <div id="clients-form-name" className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              placeholder="Ej: Ana Pérez"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div id="clients-form-phone" className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={handleChange("phone")}
              placeholder="Ej: 56912345678"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              id="client-create-button"
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
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {!error && success && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {success}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Clientes registrados
          </h3>
          <span className="text-sm text-gray-500">
            {clients.length} clientes
          </span>
        </div>

        {isFetching ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Cargando clientes...
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-2xl">
            Aún no has registrado clientes para este negocio. Crea el primero
            usando el formulario superior.
          </div>
        ) : (
          <div id="clients-table" className="overflow-hidden rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider"
                  >
                    Cliente
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider"
                  >
                    Teléfono
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider"
                  >
                    Registrado
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-sm font-semibold text-gray-700 uppercase tracking-wider text-right"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {client.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {client.phone}
                    </td>
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
