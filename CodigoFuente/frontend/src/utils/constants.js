export const USER_PROFILES = {
  ADMIN: 'administrador',
  CAJERO: 'CAJERO',
  LECTOR: 'lector',
  USUARIO: 'usuario'
};

export const PROFILE_NAMES = {
  [USER_PROFILES.ADMIN]: 'administrador',
  [USER_PROFILES.CAJERO]: 'CAJERO',
  [USER_PROFILES.LECTOR]: 'Lector',
  [USER_PROFILES.USUARIO]: 'Usuario'
};

export const API_ENDPOINTS = {
  LOGIN: '/auth/login.php',
  LOGOUT: '/auth/logout.php',
  PROFILE: '/user/profile.php'
};