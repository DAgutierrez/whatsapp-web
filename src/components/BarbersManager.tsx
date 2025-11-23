import React, { useEffect, useMemo, useState } from "react";
import { Loader2, PlusCircle, Trash2, Scissors } from "lucide-react";
import { supabase } from "../lib/supabase";

type Barber = {
    id: string;
    name: string;
    active: boolean;
    created_at: string;
    business_id?: string;
};

type FormState = {
    name: string;
    active: boolean;
};

type Business = {
    id: string;
    name?: string;
    code?: string;
};

const initialForm: FormState = {
    name: "",
    active: true,
};

export default function BarberManager() {
    const [form, setForm] = useState<FormState>(initialForm);
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [business, setBusiness] = useState<Business | null>(null);

    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // ---------- Cargar negocio + barberos de ese negocio ----------
    useEffect(() => {
        async function loadBusinessAndBarbers() {
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
                setError("No se pudo cargar el negocio.");
                console.error(bizError);
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

            // 3) Listar barberos mediante la Edge Function
            const { data, error: invokeError } = await supabase.functions.invoke(
                "barbers-manager",
                {
                    body: {
                        action: "list",
                    },
                }
            );

            if (invokeError) {
                console.error(invokeError);
                setError("No se pudieron cargar los barberos.");
                setBarbers([]);
            } else {
                setBarbers((data?.barbers as Barber[]) || []);
            }

            setIsFetching(false);
        }

        loadBusinessAndBarbers();
    }, []);

    async function reloadBarbers() {
        const { data, error } = await supabase.functions.invoke("barbers-manager", {
            body: {
                action: "list",
            },
        });

        if (error) {
            console.error(error);
            setError("No se pudieron recargar los barberos.");
            setBarbers([]);
        } else {
            setBarbers((data?.barbers as Barber[]) || []);
        }
    }

    // ---------- Validación del formulario ----------
    const isFormValid = useMemo(() => {
        const trimmedName = form.name.trim();
        return trimmedName.length >= 3;
    }, [form.name]);

    const handleChangeName = (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({
            ...prev,
            name: event.target.value,
        }));
    };

    const handleChangeActive = (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({
            ...prev,
            active: event.target.checked,
        }));
    };

    // ---------- Crear barbero ----------
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!isFormValid) {
            setError("El nombre debe tener al menos 3 caracteres.");
            return;
        }

        if (!business) {
            setError("No se encontró el negocio para asociar al barbero.");
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
                "barbers-manager",
                {
                    body: {
                        action: "create",
                        name: form.name.trim(),
                        active: form.active,
                    },
                }
            );

            if (invokeError) {
                throw invokeError;
            }

            setSuccess("Barbero creado correctamente ✅");
            setForm(initialForm);

            // Podemos usar el que viene en la respuesta o recargar todo
            if (data?.barber) {
                setBarbers((prev) => [data.barber as Barber, ...prev]);
            } else {
                await reloadBarbers();
            }

            window.dispatchEvent(new Event("admin-tutorial-next"));

        } catch (requestError: any) {
            console.error(requestError);
            setSuccess(null);
            setError(requestError.message || "No se pudo crear el barbero.");
        } finally {
            setLoading(false);
        }
    }

    // ---------- Eliminar barbero ----------
    async function handleDelete(id: string) {
        const confirmed = window.confirm(
            "¿Seguro que deseas eliminar este barbero?"
        );
        if (!confirmed) return;

        try {
            const { error: invokeError } = await supabase.functions.invoke(
                "barbers-manager",
                {
                    body: {
                        action: "delete",
                        id,
                    },
                }
            );

            if (invokeError) {
                throw invokeError;
            }

            setSuccess("Barbero eliminado correctamente.");
            setBarbers((prev) => prev.filter((b) => b.id !== id));
        } catch (err: any) {
            console.error(err);
            setError(err.message || "No se pudo eliminar el barbero.");
        }
    }

    // ---------- Activar / desactivar barbero ----------
    async function handleToggleActive(barber: Barber) {
        setError(null);
        setSuccess(null);

        try {
            const { data, error } = await supabase.functions.invoke(
                "barbers-manager",
                {
                    body: {
                        action: "update",
                        id: barber.id,
                        active: !barber.active,
                    },
                }
            );

            if (error) {
                throw error;
            }

            const updated = data?.barber as Barber;

            setBarbers((prev) =>
                prev.map((b) => (b.id === updated.id ? updated : b))
            );

            setSuccess(
                `Barbero "${updated.name}" ahora está ${updated.active ? "activo" : "inactivo"
                }.`
            );
        } catch (err: any) {
            console.error(err);
            setError(
                err?.message || "No se pudo actualizar el estado del barbero."
            );
        }
    }


    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 id="barbers-title" className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                            <Scissors className="w-6 h-6 text-indigo-600" />
                            Mantenedor de Barberos
                        </h2>
                        <p className="text-gray-600">
                            Administra los barberos asociados a tu peluquería.
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
                    className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end"
                >
                    <div id="barbers-form" className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                            Nombre del barbero
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={handleChangeName}
                            placeholder="Ej: Juan Pérez"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={form.active}
                                onChange={handleChangeActive}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Activo
                        </label>
                    </div>

                    <div className="flex items-end">
                        <button
                            id="barber-create-button"
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
                                    Crear Barbero
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

            {/* Tabla de barberos */}
            <div id="barbers-table" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                        Barberos registrados
                    </h3>
                    <span className="text-sm text-gray-500">
                        {barbers.length} barberos
                    </span>
                </div>

                {isFetching ? (
                    <div className="flex items-center justify-center py-16 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Cargando barberos...
                    </div>
                ) : barbers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-2xl">
                        Aún no has registrado barberos para este negocio. Crea el primero
                        usando el formulario superior.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Barbero
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Registrado
                                    </th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 uppercase tracking-wider text-right">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {barbers.map((barber) => (
                                    <tr
                                        key={barber.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                            {barber.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(barber)}
                                                className={
                                                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border transition-colors " +
                                                    (barber.active
                                                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                        : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200")
                                                }
                                            >
                                                {barber.active ? "Activo" : "Inactivo"}
                                            </button>
                                        </td>

                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {barber.created_at &&
                                                new Date(barber.created_at).toLocaleString("es-CL", {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                })}
                                        </td>
                                        <td className="px-4 py-3 text-sm flex justify-end">
                                            <button
                                                onClick={() => handleDelete(barber.id)}
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors"
                                                title="Eliminar barbero"
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
