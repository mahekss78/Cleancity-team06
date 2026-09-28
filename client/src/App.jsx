import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import { useAuth } from './context/AuthContext';

// Resident Pages
import ResidentDashboard from './pages/resident/ResidentDashboard';
import ResidentHistory from './pages/resident/ResidentHistory';
import ResidentProfile from './pages/resident/ResidentProfile';
import ResidentAnalytics from './pages/resident/ResidentAnalytics';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTrucks from './pages/admin/AdminTrucks';
import AdminUsers from './pages/admin/AdminUsers';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminBins from './pages/admin/AdminBins';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminRecords from './pages/admin/AdminRecords';
import AdminPredictiveIntel from './pages/admin/AdminPredictiveIntel';
import AdminLiveForecast from './pages/admin/AdminLiveForecast';
import AdminCarbonESG from './pages/admin/AdminCarbonESG';
import AdminSBMSuite from './pages/admin/AdminSBMSuite';

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverHistory from './pages/driver/DriverHistory';
import DriverProfile from './pages/driver/DriverProfile';

import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Root Redirect based on role */}
        <Route path="/" element={<HomeRedirect />} />

        <Route element={<Layout />}>
          {/* Resident Routes */}
          <Route path="/resident" element={<PrivateRoute role="resident"><ResidentDashboard /></PrivateRoute>} />
          <Route path="/resident/history" element={<PrivateRoute role="resident"><ResidentHistory /></PrivateRoute>} />
          <Route path="/resident/profile" element={<PrivateRoute role="resident"><ResidentProfile /></PrivateRoute>} />
          <Route path="/resident/analytics" element={<PrivateRoute role="resident"><ResidentAnalytics /></PrivateRoute>} />
          <Route path="/resident/settings" element={<PrivateRoute role="resident"><Settings /></PrivateRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/trucks" element={<PrivateRoute role="admin"><AdminTrucks /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute role="admin"><AdminUsers /></PrivateRoute>} />
          <Route path="/admin/complaints" element={<PrivateRoute role="admin"><AdminComplaints /></PrivateRoute>} />
          <Route path="/admin/records" element={<PrivateRoute role="admin"><AdminRecords /></PrivateRoute>} />
          <Route path="/admin/bins" element={<PrivateRoute role="admin"><AdminBins /></PrivateRoute>} />
          <Route path="/admin/analytics" element={<PrivateRoute role="admin"><AdminAnalytics /></PrivateRoute>} />
          <Route path="/admin/predictive" element={<PrivateRoute role="admin"><AdminPredictiveIntel /></PrivateRoute>} />
          <Route path="/admin/live-forecast" element={<PrivateRoute role="admin"><AdminLiveForecast /></PrivateRoute>} />
          <Route path="/admin/carbon-esg" element={<PrivateRoute role="admin"><AdminCarbonESG /></PrivateRoute>} />
          <Route path="/admin/sbm-analytics" element={<PrivateRoute role="admin"><AdminSBMSuite /></PrivateRoute>} />
          <Route path="/admin/settings" element={<PrivateRoute role="admin"><Settings /></PrivateRoute>} />

          {/* Driver Routes */}
          <Route path="/driver" element={<PrivateRoute role="driver"><DriverDashboard /></PrivateRoute>} />
          <Route path="/driver/history" element={<PrivateRoute role="driver"><DriverHistory /></PrivateRoute>} />
          <Route path="/driver/profile" element={<PrivateRoute role="driver"><DriverProfile /></PrivateRoute>} />
          <Route path="/driver/settings" element={<PrivateRoute role="driver"><Settings /></PrivateRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={`/${user.role}`} />;
}

export default App;
