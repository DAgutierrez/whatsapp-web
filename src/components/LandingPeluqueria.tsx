import React, { useState } from "react";
import "./LandingPeluqueria.css";
import { supabase } from "../lib/supabase"; // misma ruta que en tu LoginForm

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
    // limpiar nombre: sin acentos, sin espacios, solo letras
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
        break; // si falla la validación, salimos y devolvemos algo
      }

      // si no hay registros con ese code -> está libre
      if (!data || data.length === 0) {
        return code;
      }
    }

    // fallback: devolvemos un code aunque no hayamos podido validar del todo
    return generateBusinessCode(name);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1) limpiar email
      let email = form.email
        .normalize("NFKC")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/["'<>]/g, "");

      console.log("EMAIL RAW:", form.email);
      console.log("EMAIL LIMPIO:", email);

      if (!email) {
        alert("Ingresa un correo válido.");
        setLoading(false);
        return;
      }

      // 2) Crear el usuario en Supabase Auth
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

      // 3) Generar code único para el negocio
      const code = await getUniqueBusinessCode(form.businessName);

      // 4) Crear el negocio en la tabla businesses
      const { error: businessError } = await supabase.from("businesses").insert([
        {
          name: form.businessName,
          business_type: form.businessType,
          professionals: form.professionals,
          owner_name: form.name,
          owner_id: user.id,
          phone: form.phone,
          email, // email limpio
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

      // 5) Iniciar sesión automáticamente (IMPORTANTE para que App.tsx muestre el Dashboard)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });

      if (signInError) {
        console.error("Error al iniciar sesión después del registro:", signInError);
        alert(signInError.message || "No pudimos iniciar sesión automáticamente.");
        setLoading(false);
        return;
      }


      // Si llegamos aquí, ya hay sesión -> App.tsx debería mostrar Dashboard
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
            <h1>
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
                {/* Campo País eliminado por ahora */}

                <label className="lp-field">
                  Teléfono / WhatsApp
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+56 9 1234 5678"
                    required
                  />
                </label>
              </div>

              <label className="lp-field">
                Email (será tu usuario)
                <input
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

      {/* MÉTRICAS / TRUST */}
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

      {/* FEATURES */}
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

      {/* HOW IT WORKS */}
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

      {/* TESTIMONIAL */}
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

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <p>
            PeluqPro © {new Date().getFullYear()} - Agenda online para peluquerías y
            barberías
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
