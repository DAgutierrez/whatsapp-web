import React, { useEffect, useMemo, useState } from "react";
import { Loader2, PlusCircle, Trash2, Tags } from "lucide-react";
import { supabase } from "../lib/supabase";

type Service = {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    duration: number | null;
    created_at: string;
    business_id?: string;
};

type FormState = {
    name: string;
    description: string;
    price: string;    // texto en el form
    duration: string; // texto en el form (minutos)
};

type Business = {
    id: string;
    name?: string;
    code?: string;
};

const initialForm: FormState = {
    name: "",
    description: "",
    price: "",
    duration: "",
};

export default function ServiceManager() {
    const [form, setForm] = useState<FormState>(initialForm);
    const [services, setServices] = useState<Service[]>([]);
    const [business, setBusiness] = useState<Business | null>(null);

    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // 🔹 si es null = creando; si tiene id = editando ese servicio
    const [editingId, setEditingId] = useState<string | null>(null);

    // ---------- Cargar negocio + servicios ----------
    useEffect(() => {
        async function loadBusinessAndServices() {
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

            // 2) Buscar negocio del owner
            const { data: businessesData, error: bizError } = await supabase
                .from("businesses")
                .select("id, name, code, owner_id")
                .eq("owner_id", user.id);

            if (bizError) {
                console.error(bizError);
                setError("No se pudo cargar el negocio.");
                setIsFetching(false);
                return;
            }

            const currentBusiness =
                businessesData && businessesData.length > 0
                    ? ({
                        id: businessesData[0].id,
                        name: businessesData[0].name,
                        code: businessesData[0].code,
                    } as Business)
                    : null;

            if (!currentBusiness) {
                setError("No se encontró un negocio asociado a tu cuenta.");
                setIsFetching(false);
                return;
            }

            setBusiness(currentBusiness);

            // 3) Listar servicios mediante la Edge Function
            const { data, error: invokeError } = await supabase.functions.invoke(
                "create-service",
                {
                    body: {
                        action: "list",
                    },
                }
            );

            if (invokeError) {
                console.error(invokeError);
                setError("No se pudieron cargar los servicios.");
                setServices([]);
            } else {
                setServices((data?.services as Service[]) || []);
            }

            setIsFetching(false);
        }

        loadBusinessAndServices();
    }, []);

    async function reloadServices() {
        const { data, error } = await supabase.functions.invoke("create-service", {
            body: { action: "list" },
        });

        if (error) {
            console.error(error);
            setError("No se pudieron recargar los servicios.");
            setServices([]);
        } else {
            setServices((data?.services as Service[]) || []);
        }
    }

    // ---------- Validación del formulario ----------
    const isFormValid = useMemo(() => {
        const name = form.name.trim();
        const priceNum = Number(form.price);
        const durationNum = Number(form.duration);
        return (
            name.length >= 3 &&
            !Number.isNaN(priceNum) &&
            priceNum > 0 &&
            !Number.isNaN(durationNum) &&
            durationNum > 0
        );
    }, [form.name, form.price, form.duration]);

    const handleChange =
        (field: keyof FormState) =>
            (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                setForm((prev) => ({
                    ...prev,
                    [field]: event.target.value,
                }));
            };

    // ---------- Cancelar edición ----------
    function handleCancelEdit() {
        setEditingId(null);
        setForm(initialForm);
        setError(null);
        setSuccess(null);
    }

    // ---------- Crear / actualizar servicio ----------
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!isFormValid) {
            setError(
                "Completa al menos: nombre (min 3 letras), precio (>0) y duración en minutos (>0)."
            );
            return;
        }

        if (!business) {
            setError("No se encontró el negocio para asociar el servicio.");
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
            const { data, error: invokeError } = await supabase.functions.invoke(
                "create-service",
                {
                    body: {
                        action: editingId ? "update" : "create",
                        id: editingId ?? undefined,
                        name: form.name.trim(),
                        description: form.description.trim() || null,
                        price: Number(form.price),
                        duration: Number(form.duration),
                    },
                }
            );

            if (invokeError) throw invokeError;

            if (editingId) {
                const updated = data?.service as Service;
                setServices((prev) =>
                    prev.map((s) => (s.id === updated.id ? updated : s))
                );
                setSuccess(`Servicio "${updated.name}" actualizado correctamente ✅`);
            } else {
                setSuccess("Servicio creado correctamente ✅");
                if (data?.service) {
                    setServices((prev) => [...prev, data.service as Service]);
                } else {
                    await reloadServices();
                }
            }

            setForm(initialForm);
            setEditingId(null);
        } catch (err: any) {
            console.error(err);
            setSuccess(null);
            setError(
                err.message ||
                (editingId
                    ? "No se pudo actualizar el servicio."
                    : "No se pudo crear el servicio.")
            );
        } finally {
            setLoading(false);
        }
    }

    // ---------- Eliminar servicio ----------
    async function handleDelete(id: string) {
        const confirmed = window.confirm(
            "¿Seguro que deseas eliminar este servicio?"
        );
        if (!confirmed) return;

        try {
            const { error: invokeError } = await supabase.functions.invoke(
                "create-service",
                {
                    body: {
                        action: "delete",
                        id,
                    },
                }
            );

            if (invokeError) throw invokeError;

            setSuccess("Servicio eliminado correctamente.");
            setServices((prev) => prev.filter((s) => s.id !== id));

            // si justo estabas editando ese servicio, resetea el form
            setEditingId((prevId) => {
                if (prevId === id) {
                    setForm(initialForm);
                    return null;
                }
                return prevId;
            });

        } catch (err: any) {
            console.error(err);
            setError(err.message || "No se pudo eliminar el servicio.");
        }
    }

    // ---------- Editar servicio (usa el formulario, no prompt) ----------
    function handleEdit(service: Service) {
        setError(null);
        setSuccess(null);

        setEditingId(service.id);
        setForm({
            name: service.name,
            description: service.description ?? "",
            price: service.price != null ? String(service.price) : "",
            duration: service.duration != null ? String(service.duration) : "",
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                            <Tags className="w-6 h-6 text-indigo-600" />
                            Mantenedor de Servicios
                        </h2>
                        <p className="text-gray-600">
                            Crea, edita y elimina los servicios de tu peluquería.
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
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                            Nombre del servicio
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={handleChange("name")}
                            placeholder="Ej: Corte de pelo"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                            Precio
                        </label>
                        <input
                            type="number"
                            min={0}
                            step="100"
                            value={form.price}
                            onChange={handleChange("price")}
                            placeholder="Ej: 8000"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                            Duración (minutos)
                        </label>
                        <input
                            type="number"
                            min={0}
                            step="5"
                            value={form.duration}
                            onChange={handleChange("duration")}
                            placeholder="Ej: 30"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                            Descripción (opcional)
                        </label>
                        <textarea
                            value={form.description}
                            onChange={handleChange("description")}
                            placeholder="Ej: Corte clásico, incluye lavado."
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[40px]"
                        />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-3">
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all"
                            >
                                Cancelar edición
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all disabled:bg-indigo-300"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : editingId ? (
                                <>
                                    <PlusCircle className="w-4 h-4" />
                                    Guardar cambios
                                </>
                            ) : (
                                <>
                                    <PlusCircle className="w-4 h-4" />
                                    Crear Servicio
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

            {/* Tabla de servicios */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                        Servicios registrados
                    </h3>
                    <span className="text-sm text-gray-500">
                        {services.length} servicios
                    </span>
                </div>

                {isFetching ? (
                    <div className="flex items-center justify-center py-16 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Cargando servicios...
                    </div>
                ) : services.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-2xl">
                        Aún no has registrado servicios para este negocio. Crea el primero
                        usando el formulario superior.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Servicio
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Precio
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Duración
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Creado
                                    </th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 uppercase tracking-wider text-right">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {services.map((service) => (
                                    <tr
                                        key={service.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                            <div className="flex flex-col">
                                                <span>{service.name}</span>
                                                {service.description && (
                                                    <span className="text-xs text-gray-500">
                                                        {service.description}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {service.price != null ? `$${service.price}` : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {service.duration != null
                                                ? `${service.duration} min`
                                                : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {service.created_at &&
                                                new Date(
                                                    service.created_at + "Z" // interpretamos como UTC y lo mostramos en hora local (Chile)
                                                ).toLocaleString("es-CL", {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                })}
                                        </td>

                                        <td className="px-4 py-3 text-sm flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(service)}
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition-colors"
                                                title="Editar servicio"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(service.id)}
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors"
                                                title="Eliminar servicio"
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
