// App.tsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "./lib/supabase";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import LandingPeluqueria from "./components/LandingPeluqueria";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 👉 Esto ya no hace nada especial, pero lo dejamos por si quieres enganchar algo luego
  const handleLogin = () => {
    // La sesión real la controla supabase.auth.onAuthStateChange
    // y el router redirige según "user"
  };

  // ✅ Escuchar la sesión de Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // 🔒 Ruta protegida
  const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({
    children,
  }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          {/* Landing / registro */}
          <Route
            path="/"
            element={
              user ? (
                <Navigate to="/app/services" replace />
              ) : (
                <LandingPeluqueria />
              )
            }
          />
          {/* Login */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/app/services" replace />
              ) : (
                <LoginForm onLogin={handleLogin} />
              )
            }
          />

          {/* App protegida */}
          <Route
            path="/app/:section?"
            element={
              <ProtectedRoute>
                <Dashboard user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* Cualquier otra cosa → raíz */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
