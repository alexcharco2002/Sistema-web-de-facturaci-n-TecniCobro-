// src/utils/auth.js
// Funciones utilitarias relacionadas con la autenticación y perfiles de usuario

// Devuelve el icono asociado a cada perfil de usuario
export const getProfileIcon = (rol) => {
  const roleName = typeof rol === 'object' ? rol.nombre_rol : rol;
  const normalizedRol = roleName?.toLowerCase() || '';
  
  const icons = { 
    'administrador': '👨‍💼',
    'cajero': '💰',
    'lector': '📖',
    'cliente': '👤',
  };

  return icons[normalizedRol] || '👤';
};

// Devuelve el color asociado a cada perfil de usuario
export const getProfileColor = (rol) => {
  const roleName = typeof rol === 'object' ? rol.nombre_rol : rol;
  const normalizedRol = roleName?.toLowerCase() || '';
  
  const colors = {
    'administrador': 'blue',
    'cajero': 'green',
    'lector': 'purple',
    'cliente': 'gray',
  };

  return colors[normalizedRol] || 'gray';
};

// Redirige a la ruta correspondiente según el perfil del usuario
export const redirectByProfile = (rol) => {
  const roleName = typeof rol === 'object' ? rol.nombre_rol : rol;
  
  if (!roleName || typeof roleName !== 'string') {
    console.error('❌ Rol inválido:', roleName);
    return '/login';
  }

  const normalizedRol = roleName.toLowerCase();
  const routes = {
    'administrador': '/admin/dashboard',
    'cajero': '/cajero/dashboard',
    'lector': '/lector/dashboard',
    'cliente': '/cliente/dashboard',
  };

  const route = routes[normalizedRol];
  
  if (!route) {
    console.error('❌ Rol no encontrado en rutas:', normalizedRol);
    return '/login';
  }

  console.log('✅ Redirigiendo a:', route);
  return route;
};

// Obtener el nombre amigable del rol
export const getRoleName = (rol) => {
  const roleName = typeof rol === 'object' ? rol.nombre_rol : rol;
  const normalizedRol = roleName?.toLowerCase() || '';
  
  const names = {
    'administrador': 'Administrador',
    'cajero': 'Cajero',
    'lector': 'Lector de Medidores',
    'cliente': 'Cliente',
  };

  return names[normalizedRol] || 'Usuario';
};

// Verificar si un rol tiene permisos de administrador
export const isAdmin = (rol) => {
  const roleName = typeof rol === 'object' ? rol.nombre_rol : rol;
  return roleName?.toLowerCase() === 'administrador';
};

// Verificar si un rol tiene permisos de gestión financiera
export const hasFinancialAccess = (rol) => {
  const roleName = typeof rol === 'object' ? rol.nombre_rol : rol;
  const normalized = roleName?.toLowerCase();
  return normalized === 'administrador' || normalized === 'cajero';
};

// Verificar si un rol puede ver todas las lecturas
export const canViewAllReadings = (rol) => {
  const roleName = typeof rol === 'object' ? rol.nombre_rol : rol;
  const normalized = roleName?.toLowerCase();
  return normalized === 'administrador' || normalized === 'lector';
};