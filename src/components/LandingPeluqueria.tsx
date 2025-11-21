import React, { useEffect, useState } from "react";
import "./LandingPeluqueria.css";
import { supabase } from "../lib/supabase"; // misma ruta que en tu LoginForm

// --------- Tipos para el tutorial ---------
type TooltipPlacement = "top" | "bottom" | "left" | "right";

interface TutorialStep {
  id: number;
  text: string;
  highlightSelector: string;
  placement: TooltipPlacement;
}

interface TooltipPosition {
  top: number;
  left: number;
  transform: string;
}

// ------------------------------------------

const LandingPeluqueria: React.FC = () => {
  const [form, setForm] = useState({
    businessName: "",
    businessType: "Peluquería",
    professionals: "",
    name: "",
    email: "",
    password: "", // contraseña para Supabase Auth
    phone: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  // ---------- Estado del tutorial ----------
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 1,
      text: "Bienvenido 👋 Aquí ves el mensaje principal de tu landing. Es lo primero que leerán tus futuros clientes.",
      highlightSelector: "#lp-hero-title",
      placement: "bottom",
    },
    {
      id: 2,
      text: "Este formulario es donde puedes registrar tu peluquería.",
      highlightSelector: "#cta",
      placement: "left",
    },
    {
      id: 3,
      text: "Empieza por el nombre de la peluquería o barbería. Con esto generamos el código único del negocio.",
      highlightSelector: "#business-name-field",
      placement: "left", // queremos el tooltip a la izquierda del input
    },
    {
      id: 4,
      text: "Por último, completa email, contraseña y teléfono. Con este botón creamos la cuenta y el negocio automáticamente.",
      highlightSelector: "#submit-btn",
      placement: "top",
    },
  ];

  // Mostrar el tutorial sólo la primera vez (localStorage)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem("landing_tutorial_done");
    if (!seen) {
      setTutorialStep(1);
    }
  }, []);

  // ---- función para calcular posición del tooltip ----
  const updateTooltipPosition = (stepIndex: number) => {
    const stepDef = tutorialSteps[stepIndex];
    if (!stepDef) return;

    const el = document.querySelector(
      stepDef.highlightSelector
    ) as HTMLElement | null;

    if (!el) {
      setTooltipPos(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    let top = 0;
    let left = 0;
    let transform = "translate(-50%, -50%)";

    switch (stepDef.placement) {
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
    }

    // límites para que no se salga de la pantalla
    const margin = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    top = Math.min(Math.max(top, margin), vh - margin);
    left = Math.min(Math.max(left, margin), vw - margin);

    setTooltipPos({ top, left, transform });
  };

  // 🔁 Calcular y actualizar posición del tooltip (incluye scroll/resize)
  useEffect(() => {
    if (tutorialStep === 0) {
      setTooltipPos(null);
      return;
    }

    const stepIndex = tutorialStep - 1;
    const stepDef = tutorialSteps[stepIndex];
    if (!stepDef) return;

    const el = document.querySelector(
      stepDef.highlightSelector
    ) as HTMLElement | null;

    // Scroll suave hacia el elemento del paso
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });

        // después del scroll volvemos a calcular posición
        setTimeout(() => {
          updateTooltipPosition(stepIndex);
        }, 300);
      }, 0);
    }

    // cálculo inicial
    updateTooltipPosition(stepIndex);

    // volver a calcular en scroll / resize mientras el tutorial está activo
    const handler = () => updateTooltipPosition(stepIndex);
    window.addEventListener("scroll", handler);
    window.addEventListener("resize", handler);

    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [tutorialStep]);

  function nextTutorialStep() {
    if (tutorialStep < tutorialSteps.length) {
      setTutorialStep((s) => s + 1);
    } else {
      finishTutorial();
    }
  }

  function finishTutorial() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("landing_tutorial_done", "1");
    }
    setTutorialStep(0);
  }

  function skipTutorial() {
    finishTutorial();
  }

  // ---------- Lógica del formulario / registro ----------

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔤 Generar code base: 3 letras del nombre + 3 números random
  const generateBusinessCode = (name: string): string => {
    const cleanName = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z]/g, "");

    const base = (cleanName || "NEG").slice(0, 3).toUpperCase().padEnd(3, "X");
    const randomNumber = Math.floor(100 + Math.random() * 900); // 100–999
    return `${base}${randomNumber}`; // ej: PEL493
  };

  // ✅ Generar un code que NO exista en Supabase
  const getUniqueBusinessCode = async (name: string): Promise<string> => {
    const maxAttempts = 7;

    for (let i = 0; i < maxAttempts; i++) {
      const code = generateBusinessCode(name);

      const { data, error } = await supabase
        .from("businesses")
        .select("id")
        .eq("code", code);

      if (error) {
        console.error("Error validando código de negocio:", error);
        break;
      }

      if (!data || data.length === 0) {
        return code;
      }
    }

    return generateBusinessCode(name);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      let email = form.email
        .normalize("NFKC")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/["'<>]/g, "");

      if (!email) {
        alert("Ingresa un correo válido.");
        setLoading(false);
        return;
      }

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password: form.password,
        });

      if (signUpError) {
        console.error("Error en signUp:", signUpError);
        alert(signUpError.message || "No pudimos crear tu cuenta.");
        setLoading(false);
        return;
      }

      const user = signUpData.user;
      if (!user) {
        alert("No se pudo obtener el usuario creado. Intenta nuevamente.");
        setLoading(false);
        return;
      }

      const code = await getUniqueBusinessCode(form.businessName);

      const { error: businessError } = await supabase.from("businesses").insert([
        {
          name: form.businessName,
          business_type: form.businessType,
          professionals: form.professionals,
          owner_name: form.name,
          owner_id: user.id,
          phone: form.phone,
          email,
          description: form.notes || null,
          code: code,
        },
      ]);

      if (businessError) {
        console.error("Error al crear negocio:", businessError);
        alert(
          "Creamos tu cuenta, pero hubo un problema al registrar tu negocio. Contáctanos por soporte."
        );
        setLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });

      if (signInError) {
        console.error(
          "Error al iniciar sesión después del registro:",
          signInError
        );
        alert(
          signInError.message || "No pudimos iniciar sesión automáticamente."
        );
        setLoading(false);
        return;
      }

      alert("¡Cuenta y negocio creados! Entrando a tu panel 💈");

      setForm({
        businessName: "",
        businessType: "Peluquería",
        professionals: "",
        name: "",
        email: "",
        password: "",
        phone: "",
        notes: "",
      });
    } catch (err) {
      console.error("Error inesperado:", err);
      alert("❌ Hubo un error inesperado. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      {/* ---------------- Tutorial overlay ---------------- */}
      {tutorialStep > 0 && (
        <>
          {/* Fondo oscuro */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              zIndex: 9000,
            }}
          />

          {/* Tooltip */}
          <div
            style={{
              position: "fixed",
              top: tooltipPos ? tooltipPos.top : "50%",
              left: tooltipPos ? tooltipPos.left : "50%",
              transform: tooltipPos
                ? tooltipPos.transform
                : "translate(-50%, -50%)",
              background: "#ffffff",
              padding: "1.5rem",
              borderRadius: "0.9rem",
              maxWidth: "28rem",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
              zIndex: 9002,
            }}
          >
            <p
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: "1rem",
              }}
            >
              {tutorialSteps[tutorialStep - 1].text}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.75rem",
              }}
            >
              {tutorialStep < tutorialSteps.length ? (
                <>
                  <button
                    onClick={nextTutorialStep}
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
          </div>

          {/* Highlight dinámico */}
          <style>
            {`
              ${tutorialSteps[tutorialStep - 1].highlightSelector} {
                position: relative;
                z-index: 9001 !important;
                box-shadow: 0 0 0 4px #4f46e5;
                border-radius: 12px;
                transition: box-shadow 0.2s ease, transform 0.2s ease;
              }
            `}
          </style>
        </>
      )}

      {/* NAV */}
      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <div className="lp-logo">
            <span className="lp-logo-icon">💈</span>
            <span className="lp-logo-text">PeluqPro</span>
          </div>
          <nav className="lp-nav">
            <a href="#features">Funciones</a>
            <a href="#how-it-works">Cómo funciona</a>
            <a href="#testimonials">Opiniones</a>
            <a href="#cta" className="lp-nav-cta">
              Probar gratis
            </a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-container lp-hero-grid">
          <div className="lp-hero-text">
            <p className="lp-badge">Prueba gratis, sin compromiso</p>
            <h1 id="lp-hero-title">
              El software de agenda online pensado para{" "}
              <span className="lp-highlight">peluquerías y barberías</span>
            </h1>
            <p className="lp-hero-sub">
              Deja de perder horas por WhatsApp y libretas. Automatiza tus
              reservas, recordatorios y clientes en un solo lugar.
            </p>

            <div className="lp-hero-features">
              <div className="lp-hero-feature">
                <span className="lp-feature-icon">📅</span>
                <div>
                  <h3>Agenda online 24/7</h3>
                  <p>
                    Tus clientes reservan cuando quieran, tú solo miras la agenda
                    llena.
                  </p>
                </div>
              </div>
              <div className="lp-hero-feature">
                <span className="lp-feature-icon">💬</span>
                <div>
                  <h3>Recordatorios por WhatsApp</h3>
                  <p>
                    Reduce inasistencias con mensajes automáticos de confirmación
                    y aviso.
                  </p>
                </div>
              </div>
              <div className="lp-hero-feature">
                <span className="lp-feature-icon">📊</span>
                <div>
                  <h3>Control de ingresos</h3>
                  <p>Sigue tus servicios, profesionales y ventas día a día.</p>
                </div>
              </div>
            </div>

            <div className="lp-hero-cta">
              <a href="#cta" className="lp-btn-primary">
                Quiero probar PeluqPro gratis
              </a>
              <p className="lp-hero-small">
                Sin tarjeta. Sin compromiso. Solo agenda y clientes felices.
              </p>
            </div>
          </div>

          {/* FORMULARIO */}
          <div id="cta" className="lp-form-card">
            <h2>Regístrate Gratis ¡Ahora!</h2>
            <p className="lp-form-subtitle">
              Déjanos tus datos y te ayudamos a poner tu agenda a trabajar por ti.
            </p>
            <form onSubmit={handleSubmit} className="lp-form">
              <label className="lp-field">
                Nombre de tu peluquería / barbería
                <input
                  id="business-name-field"
                  type="text"
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  placeholder="Ej: Peluquería DuoStyle"
                  required
                />
              </label>

              <label className="lp-field">
                Tipo de negocio
                <select
                  name="businessType"
                  value={form.businessType}
                  onChange={handleChange}
                >
                  <option>Peluquería</option>
                  <option>Barbería</option>
                  <option>Salón de belleza</option>
                  <option>Estilista independiente</option>
                  <option>Centro de estética</option>
                  <option>Otro</option>
                </select>
              </label>

              <label className="lp-field">
                ¿Cuántos profesionales atienden?
                <select
                  name="professionals"
                  value={form.professionals}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona una opción</option>
                  <option value="1">Soy profesional independiente</option>
                  <option value="2">2</option>
                  <option value="3-5">3-5</option>
                  <option value="6-15">6-15</option>
                  <option value="16+">16+</option>
                </select>
              </label>

              <label className="lp-field">
                Tu nombre y apellido
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </label>

              <div className="lp-two-cols">
                <label className="lp-field">
                  Teléfono / WhatsApp
                  <input
                    id="phone-field"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="569 1234 5678"
                    required
                  />
                </label>
              </div>

              <label className="lp-field">
                Email (será tu usuario)
                <input
                  id="email-field"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tucorreo@peluqueria.cl"
                  required
                />
              </label>

              <label className="lp-field">
                Contraseña
                <input
                  id="password-field"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </label>

              <label className="lp-field">
                Cuéntanos un poco de tu negocio (opcional)
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Ej: Tenemos 5 sillones, trabajamos mucho por WhatsApp, queremos automatizar reservas..."
                />
              </label>

              <button
                id="submit-btn"
                type="submit"
                className="lp-btn-primary lp-btn-full"
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Solicitar demo gratis"}
              </button>

              <p className="lp-terms">
                Al enviar el formulario aceptas ser contactado para recibir
                información sobre PeluqPro.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* RESTO IGUAL */}
      <section className="lp-metrics">
        <div className="lp-container lp-metrics-grid">
          <div>
            <h3>+10.000</h3>
            <p>cortes agendados cada mes con PeluqPro</p>
          </div>
          <div>
            <h3>82%</h3>
            <p>de reducción en inasistencias gracias a recordatorios</p>
          </div>
          <div>
            <h3>+5.000</h3>
            <p>profesionales de belleza usando agenda online</p>
          </div>
        </div>
      </section>

      <section id="features" className="lp-section">
        <div className="lp-container">
          <h2>¿Por qué usar PeluqPro en tu peluquería?</h2>
          <div className="lp-features-grid">
            <div className="lp-feature-card">
              <span className="lp-feature-icon-big">🚀</span>
              <h3>Aumenta tus reservas</h3>
              <p>
                Ofrece una web de reservas sencilla y rápida para tus clientes.
                Sin llamadas perdidas, sin mensajes sin responder.
              </p>
            </div>
            <div className="lp-feature-card">
              <span className="lp-feature-icon-big">📲</span>
              <h3>Recordatorios automáticos</h3>
              <p>
                Envía confirmaciones y recordatorios por WhatsApp para disminuir
                las inasistencias y asegurar tu agenda llena.
              </p>
            </div>
            <div className="lp-feature-card">
              <span className="lp-feature-icon-big">👥</span>
              <h3>Control de barberos y servicios</h3>
              <p>
                Administra tu equipo, horarios y servicios en un solo lugar.
                Ve quién atiende, a quién, y cuánto genera.
              </p>
            </div>
            <div className="lp-feature-card">
              <span className="lp-feature-icon-big">💵</span>
              <h3>Reporte de ingresos</h3>
              <p>
                Revisa tus ventas día a día, por barbero, por servicio o por
                sucursal. Toma decisiones con datos, no con intuición.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="lp-section lp-section-alt">
        <div className="lp-container">
          <h2>¿Cómo hacemos crecer tu peluquería?</h2>
          <ul className="lp-bullets">
            <li>
              Te damos una <strong>agenda online</strong> conectada a WhatsApp
              para que tus clientes reserven solos.
            </li>
            <li>
              Automatizamos <strong>recordatorios y confirmaciones</strong> para
              reducir inasistencias.
            </li>
            <li>
              Centralizamos tus <strong>clientes, servicios y barberos</strong>{" "}
              en un solo sistema.
            </li>
            <li>
              Te mostramos reportes simples para que sepas{" "}
              <strong>cuánto estás ganando</strong> y qué servicios funcionan
              mejor.
            </li>
          </ul>
          <a href="#cta" className="lp-btn-primary">
            Empezar prueba gratis
          </a>
        </div>
      </section>

      <section id="testimonials" className="lp-section">
        <div className="lp-container lp-testimonial">
          <h2>Lo que opinan nuestros clientes</h2>
          <p className="lp-quote">
            “Antes llevaba todo en una libreta y WhatsApp. Desde que usamos
            PeluqPro, los clientes reservan solos, casi no tenemos inasistencias
            y puedo ver exactamente cuánto vende cada barbero.”
          </p>
          <p className="lp-quote-author">
            — Carla Muñoz, dueña de Barbería Centro Style
          </p>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <p>
            PeluqPro © {new Date().getFullYear()} - Agenda online para
            peluquerías y barberías
          </p>
          <p className="lp-footer-small">
            Hecho para que dejes de mirar el celular y vuelvas a cortar pelo 😎
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPeluqueria;
