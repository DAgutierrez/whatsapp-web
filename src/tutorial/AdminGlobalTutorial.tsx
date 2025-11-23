import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { adminTutorialSteps, TutorialStep } from "./AdminTutorialSteps";
import { supabase } from "../lib/supabase";

interface TooltipPosition {
    top: number;
    left: number;
    transform: string;
}

interface Business {
    id: string;
    tutorial_completed: boolean | null;
}

const AdminGlobalTutorial: React.FC = () => {
    const [stepIndex, setStepIndex] = useState<number>(-1); // -1 = apagado
    const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const location = useLocation();

    // 🔹 Cargar negocio y decidir si mostrar el tutorial
    useEffect(() => {
        async function loadBusinessAndTutorial() {
            try {
                setLoading(true);

                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError || !user) {
                    console.error("Error obteniendo usuario para tutorial:", userError);
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from("businesses")
                    .select("id, tutorial_completed, owner_id")
                    .eq("owner_id", user.id);

                if (error) {
                    console.error("Error obteniendo negocio para tutorial:", error);
                    setLoading(false);
                    return;
                }

                const biz =
                    data && data.length > 0
                        ? ({
                            id: data[0].id,
                            tutorial_completed: data[0].tutorial_completed,
                        } as Business)
                        : null;

                setBusiness(biz);

                // Si NO está completado, arrancamos en el paso 0
                if (biz && biz.tutorial_completed === false) {
                    setStepIndex(0);
                } else {
                    setStepIndex(-1);
                }
            } catch (err) {
                console.error("Error inesperado en tutorial global:", err);
            } finally {
                setLoading(false);
            }
        }

        loadBusinessAndTutorial();
    }, []);

    // 🔹 Marcar tutorial como completado en la tabla businesses
    const finishTutorial = useCallback(async () => {
        try {
            if (business?.id) {
                const { error } = await supabase
                    .from("businesses")
                    .update({ tutorial_completed: true })
                    .eq("id", business.id);

                if (error) {
                    console.error("Error marcando tutorial_completed:", error);
                }
            }
        } finally {
            setStepIndex(-1);
        }
    }, [business]);

    // 🔹 Avanzar de paso (botón "Siguiente" o evento externo)
    const nextStep = useCallback(() => {
        setStepIndex((prev) => {
            if (prev < 0) return prev;
            const next = prev + 1;
            if (next >= adminTutorialSteps.length) {
                // terminó el tutorial
                finishTutorial();
                return -1;
            }
            return next;
        });
    }, [finishTutorial]);

    // 🔹 Escuchar evento global para avanzar (ej: después de crear servicio)
    useEffect(() => {
        const handler = () => {
            nextStep();
        };

        window.addEventListener("admin-tutorial-next", handler);
        return () => {
            window.removeEventListener("admin-tutorial-next", handler);
        };
    }, [nextStep]);

    // 🔹 Recalcular posición del tooltip cuando cambia el paso o la ruta
    useEffect(() => {
        if (stepIndex < 0 || loading) {
            setTooltipPos(null);
            return;
        }

        const step: TutorialStep | undefined = adminTutorialSteps[stepIndex];
        if (!step) return;

        const updatePosition = () => {
            const el = document.querySelector(
                step.highlightSelector
            ) as HTMLElement | null;

            if (!el) {
                setTooltipPos(null);
                return;
            }

            // 🔹 NO hagas scroll cuando el target está en el sidebar / botón hamburguesa
            const isSidebarLikeTarget =
                step.highlightSelector === "#sidebar-toggle" ||
                step.highlightSelector === "#sidebar-barbers" ||
                step.highlightSelector === "#sidebar-clients" ||
                step.highlightSelector === "#sidebar-bookings";

            if (!isSidebarLikeTarget) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }

            const rect = el.getBoundingClientRect();
            let top = 0;
            let left = 0;
            let transform = "translate(-50%, -50%)";

            switch (step.placement) {
                case "bottom":
                    top = rect.bottom + 16;
                    left = rect.left + rect.width / 2;
                    transform = "translate(-50%, 0)";
                    break;
                case "top":
                    top = rect.top - 16;
                    left = rect.left + rect.width / 2;
                    transform = "translate(-50%, -100%)";
                    break;
                case "left":
                    top = rect.top + rect.height / 2;
                    left = rect.left - 16;
                    transform = "translate(-100%, -50%)";
                    break;
                case "right":
                    top = rect.top + rect.height / 2;
                    left = rect.right + 16;
                    transform = "translate(0, -50%)";
                    break;
                case "right-bottom":
                    top = rect.bottom + 12;
                    left = rect.right + 24;
                    transform = "translate(0, 0)";
                    break;
                default:
                    top = window.innerHeight / 2;
                    left = window.innerWidth / 2;
                    transform = "translate(-50%, -50%)";
            }

            // evitar que se salga totalmente de la pantalla
            const margin = 16;
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            top = Math.min(Math.max(top, margin), vh - margin);
            left = Math.min(Math.max(left, margin), vw - margin);

            setTooltipPos({ top, left, transform });
        };

        const timeout = setTimeout(updatePosition, 200);

        // 🆕 si estamos en el paso 8 (id=8 → index=7), seguir la animación del sidebar
        let interval: any = null;
        if (stepIndex === 7) {
            interval = setInterval(updatePosition, 100);
        }

        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        return () => {
            clearTimeout(timeout);
            if (interval) clearInterval(interval);
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [stepIndex, location.pathname, loading]);



    const skipTutorial = () => {
        finishTutorial();
    };

    if (loading || stepIndex < 0) return null;

    const currentStep = adminTutorialSteps[stepIndex];

    const tooltipTop = tooltipPos ? tooltipPos.top : "50%";
    const tooltipLeft = tooltipPos ? tooltipPos.left : "50%";
    const tooltipTransform = tooltipPos
        ? tooltipPos.transform
        : "translate(-50%, -50%)";

    // 👈 Paso específico del botón del menú lateral (ajusta el id si cambiaste)
    const SIDEBAR_TOGGLE_IDS = [8, 14, 20];
    const SIDEBAR_OPTION_IDS = [9, 15, 21];

    const isSidebarStep = SIDEBAR_TOGGLE_IDS.includes(currentStep.id);
    const isBarbersMenuStep = SIDEBAR_OPTION_IDS.includes(currentStep.id);

    return (
        <>
            {/* Fondo oscuro */}
            <div
                style={{
                    position: "fixed",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    // 👇 en el paso del botón hamburguesa NO tapamos el header
                    top: isSidebarStep ? "4rem" : 0, // 4rem ≈ h-16 del header
                    background:
                        isBarbersMenuStep
                            ? "transparent"
                            : "rgba(0,0,0,0.55)",
                    zIndex: 9000,
                    pointerEvents: isBarbersMenuStep || isSidebarStep ? "none" : "auto",
                }}
            />


            {/* Tooltip */}
            <div
                style={{
                    position: "fixed",
                    top: tooltipTop,
                    left: tooltipLeft,
                    transform: tooltipTransform,
                    background: "#ffffff",
                    padding: "1.5rem",
                    borderRadius: "0.9rem",
                    maxWidth: "28rem",
                    width: "90%",
                    textAlign: "center",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
                    zIndex: 9002, // ⬅ sigue por encima del overlay
                    pointerEvents: isSidebarStep ? "none" : "auto",
                }}
            >

                <p
                    style={{
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        marginBottom: "1rem",
                    }}
                >
                    {currentStep.text}
                </p>

                {/* En el paso del menú lateral NO mostramos botones, solo el mensaje */}
                {!isSidebarStep && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "0.75rem",
                        }}
                    >
                        {stepIndex < adminTutorialSteps.length - 1 ? (
                            <>
                                <button
                                    onClick={nextStep}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                                >
                                    Siguiente →
                                </button>
                                <button
                                    onClick={skipTutorial}
                                    className="text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-100"
                                >
                                    Omitir
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={finishTutorial}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                >
                                    Finalizar ✔
                                </button>
                                <button
                                    onClick={skipTutorial}
                                    className="text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-100"
                                >
                                    Omitir
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Highlight dinámico */}
            <style>
                {`
  /* Estilo base para TODOS los pasos */
  ${currentStep.highlightSelector} {
    position: relative;
    z-index: 9001 !important;
    box-shadow: 0 0 0 4px #4f46e5;
    border-radius: 12px;
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }

  ${currentStep.highlightSelector}::after {
    content: '';
    position: absolute;
    inset: -8px;
    border-radius: 12px;
    box-shadow: 0 0 0 2px rgba(79,70,229,0.35);
    pointer-events: none;
  }

  /* 🔵 Paso ESPECIAL del botón del menú lateral */
  ${currentStep.highlightSelector === "#sidebar-toggle"
                        ? `
  /* el header se convierte en una capa independiente con fondo oscuro */
  #admin-header {
    position: sticky;
    top: 0;
    z-index: 20; /* por encima del overlay (20) */
  }

  #admin-header::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.55);
    pointer-events: none;
    z-index: 1;
  }

  /* el botón hamburguesa se pone por encima de ese oscurecido
     y se ve blanco y con glow */
  #sidebar-toggle {
    position: relative;
    z-index: 30 !important;   /* por encima del ::before del header */
    background: #ffffff !important;
    border-radius: 9999px !important;
    box-shadow:
      0 0 0 3px #4f46e5,
      0 0 18px rgba(79,70,229,0.9) !important;
  }

  #sidebar-toggle::after {
    inset: -6px;
    border-radius: 9999px;
    box-shadow:
      0 0 0 1px rgba(129,140,248,0.8),
      0 0 22px rgba(79,70,229,1);
  }
  `
                        : ""
                    }

    /* ⭐ Sidebar: Bookings / Barbers / Clients bien iluminados */
  ${["#sidebar-barbers", "#sidebar-clients", "#sidebar-bookings"].includes(
                        currentStep.highlightSelector
                    )
                        ? `
    #admin-sidebar-nav::before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 8999;
      pointer-events: none;
    }

    ${currentStep.highlightSelector} {
      position: relative;
      z-index: 9002 !important;
      background: #ffffff !important;
      color: #1f2937 !important;
      border-radius: 12px;
      box-shadow:
        0 0 0 3px #4f46e5,
        0 0 16px rgba(79,70,229,1),
        0 0 28px rgba(79,70,229,0.9);
    }

    ${currentStep.highlightSelector}::after {
      inset: -6px;
      border-radius: 14px;
      box-shadow:
        0 0 0 1px rgba(129,140,248,1),
        0 0 28px rgba(79,70,229,0.8);
    }
  `
                        : ""
                    }


    /* 🟣 Estilo ESPECIAL SOLO para el formulario de barberos */
  ${currentStep.highlightSelector === "#barbers-form"
                        ? `
      #barbers-form {
        padding: 12px;
        border-radius: 14px;
        background: #ffffff !important;
        box-shadow:
          0 0 0 4px #4f46e5,
          0 0 22px rgba(79,70,229,0.7);
      }

      #barbers-form::after {
        inset: -8px;
        border-radius: 16px;
        box-shadow:
          0 0 0 2px rgba(129,140,248,0.7),
          0 0 30px rgba(79,70,229,0.6);
      }
    `
                        : ""
                    }
    /* 🟢 Estilo especial para el formulario de clientes (nombre + teléfono) */
${currentStep.highlightSelector === "#clients-form-name"
                        ? `
    #clients-form-name,
    #clients-form-phone {
      position: relative;
      z-index: 9001 !important;
      background: #ffffff !important;
      box-shadow:
        0 0 0 4px #4f46e5,
        0 0 22px rgba(79,70,229,0.7) !important;
      border-radius: 12px;
    }

    #clients-form-name::after,
    #clients-form-phone::after {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 12px;
      box-shadow:
        0 0 0 1px rgba(129,140,248,0.8),
        0 0 24px rgba(79,70,229,0.9);
      pointer-events: none;
    }
  `
                        : ""
                    }

  `}
            </style>

        </>
    );
};

export default AdminGlobalTutorial;
