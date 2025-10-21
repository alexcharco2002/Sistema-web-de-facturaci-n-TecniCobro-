// utils/auth.js   - Funciones utilitarias relacionadas con la autenticación y perfiles de usuario
export const getProfileIcon = (perfil) => {
  const normalizedPerfil = perfil.toLowerCase();
  const icons = {
    'administrador': '👨‍💼',
    'tesorero': '💰',
    'lector': '📖',
    'usuario': '👤'
  };

  return icons[normalizedPerfil] || '👤';
};

export const getProfileColor = (perfil) => {
  const normalizedPerfil = perfil.toLowerCase();
  const colors = {
    'administrador': 'blue',
    'tesorero': 'green',
    'lector': 'purple',
    'usuario': 'gray'
  };

  return colors[normalizedPerfil] || 'gray';
};
export const redirectByProfile = (perfil) => {
  const normalizedPerfil = perfil.toUpperCase();
  const routes = {
    'ADMINISTRADOR': '/admin/dashboard',
    'TESORERO': '/tesorero/dashboard',
    'LECTOR': '/lector/dashboard',
    'USUARIO': '/usuario/dashboard'
  };

  return routes[normalizedPerfil] || '/login';
};
