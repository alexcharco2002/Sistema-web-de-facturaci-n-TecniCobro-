// src/utils/auth.js
// Funciones utilitarias relacionadas con la autenticación y perfiles de usuario

// Devuelve el icono asociado a cada perfil de usuario
export const getProfileIcon = (perfil) => {
  const normalizedPerfil = perfil?.toUpperCase() || '';
  const icons = { 
    'ADMINISTRADOR': '👨‍💼',
    'TESORERO': '💰',
    'LECTOR': '📖',
    'CLIENTE': '👤',
    'USUARIO': '👤'
  };

  return icons[normalizedPerfil] || '👤';
};

// Devuelve el color asociado a cada perfil de usuario
export const getProfileColor = (perfil) => {
  const normalizedPerfil = perfil?.toUpperCase() || '';
  const colors = {
    'ADMINISTRADOR': 'blue',
    'TESORERO': 'green',
    'LECTOR': 'purple',
    'CLIENTE': 'gray',
    'USUARIO': 'gray'
  };

  return colors[normalizedPerfil] || 'gray';
};

// Redirige a la ruta correspondiente según el perfil del usuario
export const redirectByProfile = (perfil) => {
  if (!perfil || typeof perfil !== 'string') {
    console.error('❌ Perfil inválido:', perfil);
    return '/login';
  }

  const normalizedPerfil = perfil.toUpperCase();
  const routes = {
    'ADMINISTRADOR': '/admin/dashboard',
    'TESORERO': '/tesorero/dashboard',
    'LECTOR': '/lector/dashboard',
    'CLIENTE': '/cliente/dashboard',
    'USUARIO': '/cliente/dashboard'
  };

  const route = routes[normalizedPerfil];
  
  if (!route) {
    console.error('❌ Rol no encontrado en rutas:', normalizedPerfil);
    return '/login';
  }

  console.log('✅ Redirigiendo a:', route);
  return route;
};

// Obtener el nombre amigable del rol
export const getRoleName = (perfil) => {
  const normalizedPerfil = perfil?.toUpperCase() || '';
  const names = {
    'ADMINISTRADOR': 'Administrador',
    'TESORERO': 'Tesorero',
    'LECTOR': 'Lector de Medidores',
    'CLIENTE': 'Cliente',
    'USUARIO': 'Cliente'
  };

  return names[normalizedPerfil] || 'Usuario';
};

// Verificar si un rol tiene permisos de administrador
export const isAdmin = (perfil) => {
  return perfil?.toUpperCase() === 'ADMINISTRADOR';
};

// Verificar si un rol tiene permisos de gestión financiera
export const hasFinancialAccess = (perfil) => {
  const rol = perfil?.toUpperCase();
  return rol === 'ADMINISTRADOR' || rol === 'TESORERO';
};

// Verificar si un rol puede ver todas las lecturas
export const canViewAllReadings = (perfil) => {
  const rol = perfil?.toUpperCase();
  return rol === 'ADMINISTRADOR' || rol === 'LECTOR';
};