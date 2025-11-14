import React, { useState, useEffect  } from 'react';
import { supabase } from '../lib/supabase';
import ListaChat from './ListaChats';
// @ts-ignore - componente legado en JSX sin tipado
import AdminBookings from "./AdminBookings";
import LandingPeluqueria from './LandingPeluqueria';
//import { io } from "socket.io-client";
import { 
  Home, 
  User, 
  Settings, 
  FileText, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  Calendar,
  MessageSquare,
  Folder,
  Star,
  Archive,
  HelpCircle,
  Shield,
  Palette,
  Database,
  Users
} from 'lucide-react';
import ClientManager from './ClientManager';

// const socket = io(import.meta.env.VITE_BACKEND_URL || "https://backendbot-fof9.onrender.com");

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // useEffect(() => {
  //   if (user?.email) {
  //     // 🔹 Este evento notifica al backend quién es el admin conectado
  //     socket.emit("joinAdmin", user.email);
  //   }
  // }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const menuSections = [
    {
      title: 'Principal',
      items: [
        { id: 'home', label: 'Dashboard', icon: Home, badge: null },
        // { id: 'analytics', label: 'Análisis', icon: BarChart3, badge: 'Pro' },
        // { id: 'calendar', label: 'Calendario', icon: Calendar, badge: null },
        // { id: 'chats', label: 'Chats', icon: MessageSquare, badge: '5' },
      ]
    },
    {
      title: 'Gestión',
      items: [
        // { id: 'documents', label: 'Documentos', icon: FileText, badge: '12' },
        { id: 'Bookings', label: 'Bookings', icon: FileText, badge: '12' },
        { id: 'clients', label: 'Clientes', icon: Users, badge: null },
        // { id: 'projects', label: 'Proyectos', icon: Folder, badge: null },
        // { id: 'messages', label: 'Mensajes', icon: MessageSquare, badge: '3' },
        //{ id: 'favorites', label: 'Favoritos', icon: Star, badge: null },
        { id: 'logout', label: 'Cerrar Sesión', icon: LogOut, badge: null, action: handleLogout }
      ]
    },
    {
      title: 'Configuración',
      items: [
        { id: 'profile', label: 'Mi Perfil', icon: User, badge: null },
        // { id: 'settings', label: 'Configuración', icon: Settings, badge: null },
        // { id: 'security', label: 'Seguridad', icon: Shield, badge: null },
        // { id: 'appearance', label: 'Apariencia', icon: Palette, badge: null },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido de vuelta</h1>
              <p className="text-gray-600">Aquí tienes un resumen de tu actividad reciente</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Estadísticas</h3>
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-indigo-600 mb-2">1,234</p>
                <p className="text-sm text-gray-600">Total de elementos</p>
                <div className="mt-3 flex items-center text-sm text-green-600">
                  <span className="mr-1">↗</span>
                  <span>+12% este mes</span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Documentos</h3>
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600 mb-2">56</p>
                <p className="text-sm text-gray-600">Archivos guardados</p>
                <div className="mt-3 flex items-center text-sm text-green-600">
                  <span className="mr-1">↗</span>
                  <span>+5 nuevos</span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Actividad</h3>
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-orange-600 mb-2">12</p>
                <p className="text-sm text-gray-600">Notificaciones nuevas</p>
                <div className="mt-3 flex items-center text-sm text-orange-600">
                  <span className="mr-1">•</span>
                  <span>3 sin leer</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Documento actualizado</p>
                      <p className="text-sm text-gray-600">Hace 2 horas</p>
                    </div>
                    <div className="text-xs text-gray-400">
                      14:30
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Análisis</h1>
              <p className="text-gray-600">Métricas y estadísticas detalladas</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Gráficos y métricas próximamente</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendario</h1>
              <p className="text-gray-600">Gestiona tus eventos y citas</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Vista de calendario próximamente</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'chats':
        return (
          <div className="h-[calc(100vh-8rem)]">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chats</h1>
              <p className="text-gray-600">Gestiona tus conversaciones con clientes</p>
            </div>
            
            <div>
              <ListaChat currentAdmin={user.email}/>
            </div>
          </div>
        );
      case 'documents':
        return (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Documentos</h1>
              <p className="text-gray-600">Gestiona todos tus archivos</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Gestor de documentos próximamente</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Bookings':
        return (
          <div>
            <AdminBookings />
          </div>
        );
      case 'clients':
        return (
          <div>
            <ClientManager />
          </div>
        );  


      case 'profile':
        return (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
              <p className="text-gray-600">Gestiona tu información personal</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user?.email}</h2>
                  <p className="text-gray-600">Usuario activo</p>
                  <div className="flex items-center mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-600">En línea</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de registro</label>
                  <input
                    type="text"
                    value={new Date(user?.created_at).toLocaleDateString() || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        const allItems = menuSections.flatMap(section => section.items);
        const currentItem = allItems.find(item => item.id === activeSection);
        return (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {currentItem?.label}
              </h1>
              <p className="text-gray-600">Contenido próximamente</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  {currentItem && <currentItem.icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />}
                  <p className="text-gray-500">Esta sección está en desarrollo</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-white">Mi App</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <nav className="px-4 py-6 space-y-8">
            {menuSections.map((section) => (
              <div key={section.title}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSidebarOpen(false);
                          if (item.action) {
                            item.action();
                          } else {
                            setActiveSection(item.id);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all duration-200 group ${
                          activeSection === item.id
                            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm border border-indigo-100'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-5 h-5 transition-colors ${
                            activeSection === item.id ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                          }`} />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.badge === 'Pro' 
                              ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
        
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 px-3 py-2 mb-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500">Usuario activo</p>
            </div>
          </div>
          
          <button className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-200 group">
            <HelpCircle className="w-5 h-5 group-hover:text-gray-700" />
            <span className="font-medium">Ayuda</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-72' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {(() => {
                    const allItems = menuSections.flatMap(section => section.items);
                    const currentItem = allItems.find(item => item.id === activeSection);
                    return currentItem?.label || 'Dashboard';
                  })()}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                />
              </div>
              
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>
              
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center ring-2 ring-indigo-100">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {renderContent()}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
