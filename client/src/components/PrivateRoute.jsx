import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, role }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="p-20 text-center font-black uppercase text-slate-300 animate-pulse tracking-widest text-xs">Syncing Terminal...</div>;

    if (!user) {
        return <Navigate to="/login" />;
    }

    // Role-based Access Logic
    if (role) {
        // High-level Admin bypass (Admin can view anything)
        if (user.role === 'admin') return children;

        // Strict role matching for other users
        if (user.role !== role) {
            const dashboard = `/${user.role}`;
            return <Navigate to={dashboard} />;
        }
    }

    return children;
};

export default PrivateRoute;
