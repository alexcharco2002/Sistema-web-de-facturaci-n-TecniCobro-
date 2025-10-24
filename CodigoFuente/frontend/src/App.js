// App.js
// Archivo principal de la aplicación que configura las rutas utilizando React Router
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login.js'; // Página de inicio de sesión
import Forgotpassword from './pages/forgotPassword.js'; // Página de recuperación de contraseña
import ResetPassword from './pages/ResetPassword.js';


// Importar los paneles de cada rol
import AdminDashboard from './pages/admin/Dashboard'; // Panel de administración
import LectorDashboard from './pages/lector/Dashboard'; // Panel del lector
import ClienteDashboard from './pages/cliente/Dashboard'; // Panel del cliente
import CajeroDashboard from './pages/cajero/Dashboard.js'; // Panel del cajero


const App = () => {
  return (
    <Router>
      <Routes>
        {/* Redirige la ruta raíz "/" hacia "/login" */}
        <Route path="/" element={<Navigate to="/login" />} />
       
        {/* Página de inicio de sesión */}
        <Route path="/login" element={<Login />} />

        { /*-- Ruta para la recuperación de contraseña */}
        <Route path="/forgot-password" element={<Forgotpassword />} />
        
        {/* Ruta para restablecer la contraseña con token */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Ruta para el perfil del administrador */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

         {/* Ruta para el panel del lector */}
        <Route path="/lector/dashboard" element={<LectorDashboard />} />
        
        {/* Ruta para el panel del cajero */}
        <Route path="/cajero/dashboard" element={<CajeroDashboard />} />

        {/* Ruta para el panel del cliente */}
        <Route path="/cliente/dashboard" element={<ClienteDashboard/>} />
        
       
      </Routes>
    </Router>
  );
};

export default App;
