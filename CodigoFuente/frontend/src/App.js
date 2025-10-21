// App.js
// Archivo principal de la aplicación que configura las rutas utilizando React Router
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login.js'; // Página de inicio de sesión
import AdminDashboard from './pages/admin/Dashboard'; // Panel de administración
import Profile from './pages/admin/Profile';  // Página de perfil de usuario

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Redirige la ruta raíz "/" hacia "/login" */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Página de inicio de sesión */}
        <Route path="/login" element={<Login />} />

        {/* Ruta para el perfil del administrador */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        
        {/* Página de perfil del usuario */}
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
};

export default App;
