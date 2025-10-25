import { supabase } from '../lib/supabase';

export default function LogoutButton({ onLogout }: { onLogout: () => void }) {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error cerrando sesión:', error.message);
    } else {
      onLogout(); // Esto es para notificar al componente padre que cerró sesión
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
    >
      Cerrar Sesión
    </button>
  );
}
