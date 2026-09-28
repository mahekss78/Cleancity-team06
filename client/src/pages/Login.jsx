import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, AlertTriangle, ArrowRight, Leaf, Sparkles } from 'lucide-react';

// Premium Glass Input with Internal Depth (Defined outside to prevent focus loss)
const GlassInput = ({ icon: Icon, ...props }) => (
  <div className="relative group w-full">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#065F46]/40 group-focus-within:text-[#00F59B] transition-all duration-300 z-10">
      <Icon size={18} strokeWidth={2} />
    </div>
    <input
      {...props}
      className="w-full pl-12 pr-4 py-4 bg-white/40 backdrop-blur-xl border border-white/40 rounded-[1.5rem] text-[#064E3B] placeholder:text-[#065F46]/30 text-sm font-semibold transition-all duration-500 outline-none focus:ring-4 focus:ring-[#00F59B]/10 focus:bg-white/90 focus:border-[#00F59B]/40 shadow-sm"
    />
  </div>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await login(email, password);
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'driver') navigate('/driver');
      else navigate('/resident');
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative font-sans antialiased overflow-hidden bg-[#F0FFF4]">
      
      {/* 1. ANIMATED BACKGROUND MESH (Same as Register) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-[#A7F3D0] blur-[120px] rounded-full opacity-60" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], x: [0, -50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-[#00F59B]/20 blur-[100px] rounded-full" 
        />
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
      </div>

      {/* 2. THE FLOATING LOGIN CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[460px] bg-gradient-to-br from-white/90 to-white/40 backdrop-blur-3xl p-10 md:p-12 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(6,78,59,0.12),inset_0_0_0_1px_rgba(255,255,255,0.5)] border border-white/20"
      >
        {/* HEADER SECTION */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[#00F59B] blur-2xl opacity-20 animate-pulse" />
            <div className="relative p-5 bg-white rounded-[2rem] shadow-xl border border-[#00F59B]/20">
              <Leaf size={32} className="text-[#059669]" fill="#00F59B" fillOpacity={0.2} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-[#064E3B] tracking-tighter uppercase italic leading-none">
            Welcome <span className="text-[#059669]">Back</span>
          </h2>
          <p className="mt-3 text-[10px] text-[#065F46]/50 font-black uppercase tracking-[0.5em] flex items-center gap-2">
            <Sparkles size={12} /> Secure Portal Access <Sparkles size={12} />
          </p>
        </div>

        {/* ERROR FEEDBACK */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, height: 0 }}
              animate={{ scale: 1, opacity: 1, height: 'auto' }}
              exit={{ scale: 0.9, opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-3 text-red-700 text-xs font-bold"
            >
              <AlertTriangle size={18} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORM GRID */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <GlassInput
              type="email"
              placeholder="Network Username / Email"
              required
              autoComplete="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <GlassInput
              type="password"
              placeholder="Access Credentials"
              required
              autoComplete="current-password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: "#065F46" }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-4 py-5 rounded-[1.8rem] text-[12px] font-black uppercase tracking-[0.3em] text-white bg-gradient-to-r from-[#065F46] to-[#059669] shadow-[0_15px_30px_-5px_rgba(6,95,70,0.3)] disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Initialize Access
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        {/* NAVIGATION FOOTER */}
        <div className="mt-12 text-center">
          <Link to="/register" className="group inline-flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest transition-colors group-hover:text-[#059669]">New to CleanCity?</span>
            <span className="mt-1 text-sm font-black text-[#064E3B] underline decoration-[#00F59B] decoration-4 underline-offset-4 transition-all group-hover:decoration-[#059669]">Create Access Terminal</span>
          </Link>
        </div>
      </motion.div>

      {/* VERSION WATERMARK */}
      <div className="absolute bottom-10 left-10 text-[#065F46]/5 font-black text-8xl select-none pointer-events-none tracking-tighter">
        
      </div>
    </div>
  );
};

export default Login;