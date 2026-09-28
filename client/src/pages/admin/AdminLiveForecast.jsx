import { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLiveForecast = () => {
    const [liveForecast, setLiveForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchForecast = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const forecastRes = await axios.get(`http://localhost:5000/api/predict/live-forecast`, config);
            setLiveForecast(forecastRes.data);
        } catch (err) {
            console.error("Fetch failed:", err);
            setError("Live sync failed to fetch data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForecast();
    }, []);

    return (
        <div className="space-y-8 p-4 lg:p-10 max-w-[1600px] mx-auto min-h-screen">
            {/* 1. HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                <div className="flex items-center gap-6">
                    <div className="p-6 bg-[#064E3B] text-emerald-400 rounded-[2.5rem] shadow-2xl shadow-emerald-200">
                        <Activity size={32} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-[#064E3B] uppercase tracking-tighter italic leading-none">Live Forecasting</h2>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Powered by Meta Prophet</p>
                    </div>
                </div>
            </div>

            {/* 2. LIVE 7-DAY PROPHET FORECAST GRAPH */}
            {loading ? (
                <div className="text-center p-20 text-emerald-600 font-bold tracking-widest uppercase">Initializing Multivariate Prophet Engine...</div>
            ) : error ? (
                <div className="text-center p-20 text-red-500 font-bold tracking-widest uppercase">{error}</div>
            ) : (
                <AnimatePresence mode="wait">
                    {liveForecast && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                            className="bg-[#064E3B] p-12 rounded-[4rem] shadow-2xl border border-emerald-900 mt-8 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
                                <Sparkles size={180} />
                            </div>
                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">7-Day Spatial-Temporal Forecast</h3>
                                    <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mt-1">Multi-Variate Analysis (Seasonality + Weather + Festivals)</p>
                                </div>
                                <div className="text-right">
                                    <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase text-white tracking-widest animate-pulse ${liveForecast.impact_status === 'HIGH' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                                        {liveForecast.impact_status === 'HIGH' ? 'High Impact Alert' : 'Stable Sync Active'}
                                    </div>
                                </div>
                            </div>

                            {/* REASONING ALERT BOX */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                className={`mb-10 p-8 rounded-[2rem] border relative z-10 ${liveForecast.impact_status === 'HIGH' ? 'bg-red-500/20 border-red-500/30' : 'bg-white/5 border-white/10'}`}
                            >
                                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-2">AI Insights & Reasoning</p>
                                <p className="text-xl font-black text-white italic tracking-tight italic">"{liveForecast.reasoning}"</p>
                            </motion.div>

                            <div className="h-[400px] w-full relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={liveForecast.forecast}>
                                        <defs>
                                            <linearGradient id="colorProphet" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#047857" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#6EE7B7' }} />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#064E3B', borderRadius: '16px', border: '1px solid #047857', color: 'white' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#10B981' }}
                                            labelStyle={{ fontSize: '10px', color: '#6EE7B7', textTransform: 'uppercase' }}
                                        />
                                        <Area type="monotone" dataKey="predicted_kg" stroke="#10B981" strokeWidth={5} fillOpacity={1} fill="url(#colorProphet)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-8 flex gap-4 relative z-10 flex-wrap">
                                {liveForecast.forecast.map((day, i) => (
                                    <div key={i} className="flex-1 min-w-[120px] bg-black/20 p-6 rounded-3xl border border-white/10 text-center">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                        <p className="text-2xl font-black text-white italic">{day.predicted_kg}kg</p>
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-2">Interval: {day.lower_bound}-{day.upper_bound}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* 3. MODEL ARCHITECTURE INFO SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100"
                >
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                        <Activity size={24} />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter mb-4">Prophet Time-Series</h4>
                    <p className="text-[11px] leading-relaxed text-slate-400 font-medium uppercase tracking-wider">
                        Decomposes waste data into Trend, Weekly Seasonality, and Holiday effects. It learns that weekends generate more load and adapts to Indian festivals automatically using the Lunar calendar.
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                    className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100"
                >
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                        <Sparkles size={24} />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter mb-4">Spatial-Temporal Factors</h4>
                    <p className="text-[11px] leading-relaxed text-slate-400 font-medium uppercase tracking-wider">
                        Integrates external regressors like real-time weather. If rain is detected, the AI applies a mass-multiplier to account for water absorption in organic waste, increasing predicted tonnage by up to 35%.
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                    className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100"
                >
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                        <Activity size={24} />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter mb-4">The Data Flywheel</h4>
                    <p className="text-[11px] leading-relaxed text-slate-400 font-medium uppercase tracking-wider">
                        Every driver mission resolution feeds back into the model. Real weights reported via the mobile app refine the AI's accuracy every 24 hours, creating a self-learning logistics ecosystem.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminLiveForecast;
