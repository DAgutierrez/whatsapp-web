import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import LandingPeluqueria from "./components/LandingPeluqueria";
import { User } from "@supabase/supabase-js";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 👇 Leemos si el usuario ya vio el landing en este dispositivo
  const [hasSeenLanding, setHasSeenLanding] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("hasSeenLanding") === "true";
  });

  useEffect(() => {
    // Verificar si hay una sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios en la autenticación (login / logout / signup)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 👇 Cada vez que haya user (login o signup), marcamos que ya no muestre más el landing
  useEffect(() => {
    if (user) {
      setHasSeenLanding(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("hasSeenLanding", "true");
      }
    }
  }, [user]);

  const handleLogin = () => {
    // No hace falta hacer nada aquí,
    // el listener onAuthStateChange se encarga de actualizar "user"
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // NO tocamos hasSeenLanding: queda en true
    // así que después del logout se muestra el LoginForm, no el Landing
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {user ? (
        // ✅ Usuario logeado → va al Dashboard (tu booking está aquí dentro)
        <Dashboard user={user} onLogout={handleLogout} />
      ) : hasSeenLanding ? (
        // ✅ Ya vio el landing antes → mostrar login normal
        <LoginForm onLogin={handleLogin} />
      ) : (
        // ✅ Primera vez en el sitio (no hay sesión y no ha visto landing)
        <LandingPeluqueria />
      )}
    </div>
  );
}

export default App;
