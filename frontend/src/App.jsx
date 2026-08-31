import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import OperatorDashboard from './pages/OperatorDashboard';
import FindParking from './pages/FindParking';
import ParkingDetails from './pages/ParkingDetails';
import Profile from './pages/Profile';
import AdminSaaSPlans from './pages/AdminSaaSPlans';
import MainLayout from './layouts/MainLayout';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;

  return children;
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <Navigate to="/admin" />;
  }
  if (user?.role === 'operator') {
    return <Navigate to="/staff" />;
  }
  return <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* Protected Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={
          <ProtectedRoute>
            <RootRedirect />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/parking" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <FindParking />
          </ProtectedRoute>
        } />
        
        <Route path="/parking/:id" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <ParkingDetails />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        } />

        <Route path="/admin/saas-plans" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSaaSPlans />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/parking" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <OperatorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/staff" element={
          <ProtectedRoute allowedRoles={['operator']}>
            <OperatorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/unauthorized" element={
          <div className="p-8 text-center text-red-600 font-bold">Unauthorized Access</div>
        } />
        
        <Route path="*" element={
          <Navigate to="/" />
        } />
      </Route>
    </Routes>
  );
}

export default App;
