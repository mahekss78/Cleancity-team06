import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LogOut, LayoutDashboard, Truck, FileText, Trash2, 
  AlertTriangle, Users, PieChart, Settings, Menu, X, Bell, Sparkles,
  Map as MapIcon, Gift, Activity, ChevronRight, Leaf, Award 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink = ({ to, label, icon: Icon, end = false, onClick }) => {
    const isActive = end ? location.pathname === to : location.pathname.startsWith(to);

    return (
      <Link to={to} onClick={onClick} className="relative group w-full block mb-1">
        <motion.div
          whileHover={{ x: 4, backgroundColor: isActive ? "" : "rgba(0, 168, 107, 0.05)" }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-300
          ${isActive 
            ? 'bg-[#00A86B] text-white shadow-lg shadow-[#00A86B]/20' 
            : 'text-slate-500 hover:text-[#00A86B]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-sm font-bold tracking-tight">{label}</span>
          </div>
          {isActive && <ChevronRight size={14} className="opacity-70" />}
        </motion.div>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-[#F0FDF4] font-sans antialiased text-slate-900 overflow-hidden">
      
      {/* BACKGROUND DECORATION */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-[#00A86B]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#00A86B]/10 blur-[100px] rounded-full" />
      </div>

      {/* 1. SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white/70 backdrop-blur-xl border-r border-[#00A86B]/10 flex-col p-6 relative z-20 transition-all duration-300">
        
        {/* REFINED RESPONSIVE BRANDING */}
        <div className="flex flex-col items-center text-center mb-10 pt-4 w-full">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.05 }}
            className="relative mb-4 shrink-0"
          >
            <div className="absolute inset-0 bg-[#00A86B] blur-2xl opacity-20" />
            <div className="relative p-3 md:p-4 bg-white rounded-[1.25rem] md:rounded-[1.5rem] shadow-xl border border-[#00A86B]/10 flex items-center justify-center">
              <Leaf 
                className="text-[#00A86B] w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" 
                fill="#00A86B" 
                fillOpacity={0.1} 
              />
            </div>
          </motion.div>
          
          <div className="w-full px-2 overflow-hidden">
            <h2 className="font-black text-lg md:text-xl tracking-tighter italic leading-none text-slate-800 uppercase whitespace-nowrap">
              CLEAN<span className="text-[#00A86B]">CITY</span>
            </h2>
            
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {user?.role === 'resident' && (
            <>
              <NavLink to="/resident" end label="Dashboard" icon={LayoutDashboard} />
              <NavLink to="/resident/history" label="Activity" icon={MapIcon} />
              <NavLink to="/resident/profile" label="Profile" icon={Activity} />
              <NavLink to="/resident/analytics" label="Analytics" icon={Gift} />
              <NavLink to="/resident/settings" label="Settings" icon={Settings} />
            </>
          )}
          {/* Admin and Driver roles follow same NavLink pattern */}
          {user?.role === 'admin' && (
            <>
              <NavLink to="/admin" end label="Control Hub" icon={LayoutDashboard} />
              <NavLink to="/admin/bins" label="IoT Bins" icon={Trash2} />
              <NavLink to="/admin/trucks" label="Logistics" icon={Truck} />
              <NavLink to="/admin/complaints" label="Incidents" icon={AlertTriangle} />
              <NavLink to="/admin/records" label="Legal Vault" icon={FileText} />
              <NavLink to="/admin/analytics" label="Neuralytics" icon={PieChart} />
              <NavLink to="/admin/predictive" label="Predictive Intel" icon={Sparkles} />
              <NavLink to="/admin/live-forecast" label="Live Forecasting" icon={Activity} />
              <NavLink to="/admin/carbon-esg" label="Carbon/ESG" icon={Leaf} />
              <NavLink to="/admin/sbm-analytics" label="SBM Analytics" icon={Award} />
              <NavLink to="/admin/settings" label="Systems" icon={Settings} />
            </>
          )}
          {user?.role === 'driver' && (
            <>
              <NavLink to="/driver" end label="Navigation" icon={Truck} />
              <NavLink to="/driver/history" label="Work Logs" icon={FileText} />
              <NavLink to="/driver/settings" label="Settings" icon={Settings} />
            </>
          )}
        </nav>

        {/* User Footer */}
        <div className="pt-6 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-[#00A86B] flex items-center justify-center text-white font-black text-sm shadow-md shadow-[#00A86B]/20">
                {user?.name?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-slate-800">{user?.name}</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
                  <p className="text-[10px] font-black text-[#00A86B] uppercase tracking-tighter">{user?.role}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all duration-300 font-bold text-[10px] tracking-widest uppercase border border-slate-200"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        
        {/* Header */}
        <header className="h-20 px-6 md:px-8 lg:px-12 flex justify-between items-center">
          <div className="flex items-center gap-3 lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-[#00A86B] active:scale-95 transition-transform"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <Leaf size={22} className="text-[#00A86B] shrink-0" />
              <h2 className="font-black text-lg italic tracking-tighter uppercase whitespace-nowrap">
                CLEAN<span className="text-[#00A86B]">CITY</span>
              </h2>
            </div>
          </div>

          <div className="hidden lg:block">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <span className="text-slate-400 font-medium">System Portal /</span>
              <span className="text-slate-900 font-black uppercase tracking-tight text-lg">
                {location.pathname.split('/').pop() || 'Dashboard'}
              </span>
            </motion.div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2.5 bg-white border border-[#00A86B]/20 px-4 py-2 rounded-2xl shadow-sm">
              <Sparkles size={14} className="text-[#00A86B]" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Environment Live</span>
            </div>
            
            <button className="relative p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:border-[#00A86B]/30 hover:text-[#00A86B] transition-all shadow-sm">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        {/* Content Portal */}
        <main className="flex-1 px-4 lg:px-10 pb-6 overflow-hidden flex flex-col">
          <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 bg-white rounded-[2.5rem] lg:rounded-[3rem] text-slate-900 overflow-hidden relative shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-slate-200/50 flex flex-col"
          >
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-8 relative z-10">
              <Outlet />
            </div>
          </motion.div>
        </main>
      </div>

      {/* 3. MOBILE SIDEBAR OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[75%] max-w-[280px] bg-white z-[110] p-8 flex flex-col lg:hidden shadow-2xl"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-2 shrink-0">
                  <Leaf size={24} className="text-[#00A86B]" />
                  <h2 className="font-black text-xl italic tracking-tighter uppercase whitespace-nowrap">
                    CLEAN<span className="text-[#00A86B]">CITY</span>
                  </h2>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-2 rounded-xl bg-slate-100 text-slate-500"
                >
                  <X size={20}/>
                </button>
              </div>

              <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                {user?.role === 'resident' && (
                  <>
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/resident" end label="Dashboard" icon={LayoutDashboard} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/resident/history" label="Activity" icon={Activity} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/resident/Analytics" label="Analytics" icon={Gift} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/resident/profile" label="Profile" icon={MapIcon} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/resident/settings" label="Settings" icon={Settings} />             
                  </>
                )}
                {user?.role === 'admin' && (
                  <>
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/admin" end label="Control Hub" icon={LayoutDashboard} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/admin/bins" label="IoT Bins" icon={Trash2} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/admin/trucks" label="Logistics" icon={Truck} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/admin/complaints" label="Incidents" icon={AlertTriangle} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/admin/records" label="Legal Vault" icon={FileText} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/admin/analytics" label="Neuralytics" icon={PieChart} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/admin/predictive" label="Predictive Intel" icon={Sparkles} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/admin/live-forecast" label="Live Forecasting" icon={Activity} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/admin/carbon-esg" label="Carbon/ESG" icon={Leaf} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/admin/sbm-analytics" label="SBM Analytics" icon={Award} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/admin/settings" label="Systems" icon={Settings} />
                  </>
                )}
                {user?.role === 'driver' && (
                  <>
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/driver" end label="Navigation" icon={Truck} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/driver/history" label="Work Logs" icon={FileText} />
                    <NavLink onClick={() => setIsMobileMenuOpen(false)} to="/driver/settings" label="Settings" icon={Settings} />
                  </>
                )}
                
                <div className="pt-8 mt-8 border-t border-slate-100">
                  <button onClick={handleLogout} className="flex items-center justify-center gap-3 px-5 py-3.5 w-full rounded-2xl bg-red-50 text-red-600 font-bold text-xs uppercase tracking-widest border border-red-100 transition-colors hover:bg-red-100">
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;