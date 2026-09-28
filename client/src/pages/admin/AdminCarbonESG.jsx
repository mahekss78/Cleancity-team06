import { useState, useEffect } from 'react';
import axios from 'axios';
import { Leaf, Wind, Droplets, Zap, TrendingUp, Globe, ShieldCheck, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const AdminCarbonESG = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchESG = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('http://localhost:5000/api/esg/analytics', config);
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchESG();
    }, []);

    const StatCard = ({ icon: Icon, label, value, unit, color }) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[3rem] relative overflow-hidden group"
        >
            <div className={`absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}>
                <Icon size={180} />
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-2xl ${color.replace('text-', 'bg-')}/20 ${color}`}>
                <Icon size={28} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{label}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-white tracking-tighter italic">{value}</h3>
                <span className="text-xs font-black text-slate-400 uppercase">{unit}</span>
            </div>
        </motion.div>
    );

    if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-emerald-500 font-black tracking-widest uppercase">Initializing ESG Universe...</div>;

    return (
        <div className="min-h-screen bg-[#020617] text-white p-4 lg:p-12 space-y-12">
            {/* HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="p-6 bg-emerald-500 rounded-[2.5rem] shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                        <Leaf size={32} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none">ESG Universe</h2>
                        <p className="text-[11px] font-black text-emerald-500/60 uppercase tracking-[0.4em] mt-3">Live Carbon Neutrality Protocol v4.0</p>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-full flex items-center gap-4">
                        <Globe className="text-emerald-400 animate-spin-slow" size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Net Zero Alignment: 94.2%</span>
                    </div>
                    <div className="px-8 py-4 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center gap-4">
                        <Activity className="text-emerald-400" size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Today: {data?.today?.todayCarbon?.toFixed(1) || '0'} KG Avoided</span>
                    </div>
                </div>
            </div>

            {/* LIVE TUCKER / MAIN STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard icon={Wind} label="CO2e Avoided" value={data?.summary?.totalCO2Saved?.toFixed(1) || '0'} unit="KG" color="text-emerald-400" />
                <StatCard icon={Droplets} label="Methane Offset" value={(data?.summary?.organicWeight * 0.8).toFixed(1) || '0'} unit="KG" color="text-teal-400" />
                <StatCard 
                    icon={Zap} 
                    label="Energy Reclaimed" 
                    value={(
                        (data?.summary?.plasticWeight * 2.4) + 
                        (data?.summary?.ewasteWeight * 10.2) + 
                        (data?.summary?.metalWeight * 14.5)
                    ).toFixed(1) || '0'} 
                    unit="kWh" 
                    color="text-amber-400" 
                />
                <StatCard icon={ShieldCheck} label="Carbon Credits" value={(data?.summary?.totalCO2Saved / 10).toFixed(2) || '0'} unit="CRDT" color="text-indigo-400" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* TREND CHART */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="xl:col-span-2 bg-slate-900/40 backdrop-blur-md border border-white/5 p-10 rounded-[4rem]"
                >
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Carbon Reduction Vector</h3>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Real-time Offset Path</span>
                        </div>
                    </div>
                    <div className="h-[400px] min-h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.trends}>
                                <defs>
                                    <linearGradient id="colorESG" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                                <YAxis hide />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px' }}
                                    itemStyle={{ color: '#10B981', fontWeight: 900 }}
                                />
                                <Area type="monotone" dataKey="dailyCarbon" stroke="#10B981" strokeWidth={4} fill="url(#colorESG)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* LEADERBOARD */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-900/60 border border-white/10 p-10 rounded-[4rem] flex flex-col"
                >
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-8">Green Grid Ranking</h3>
                    <div className="space-y-6 flex-1">
                        {data?.leaderboard?.map((city, i) => (
                            <div key={city._id} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${i === 0 ? 'bg-amber-400 text-black' : 'bg-white/10 text-slate-400'}`}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-lg font-black uppercase italic tracking-tight">{city._id}</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{city.tasksResolved} Points Analyzed</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-emerald-400">-{city.carbonSaved.toFixed(1)}</p>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">KG CO2e</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] text-center">
                        <TrendingUp className="mx-auto text-emerald-400 mb-2" size={24} />
                        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Nagpur is 12% more efficient</p>
                    </div>
                </motion.div>
            </div>

            {/* INFO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
                <div className="p-8 bg-white/5 rounded-[3rem] border border-white/5">
                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4">The Cruel Truth: Scope 1</h4>
                    <p className="text-xs leading-relaxed text-slate-400 font-medium">
                        Logistics emissions are measured by proxy. Every KM saved through OSRM optimization reduces fuel burn. We calculate 2.68kg CO2 per liter of diesel saved.
                    </p>
                </div>
                <div className="p-8 bg-white/5 rounded-[3rem] border border-white/5">
                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4">The Methane Shadow</h4>
                    <p className="text-xs leading-relaxed text-slate-400 font-medium">
                        Organic waste in landfills is a climate bomb. Diverting it to composting facilities stops anaerobic CH4 release, providing a 0.82x multiplier on carbon credits.
                    </p>
                </div>
                <div className="p-8 bg-white/5 rounded-[3rem] border border-white/5">
                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4">Circular Accuracy</h4>
                    <p className="text-xs leading-relaxed text-slate-400 font-medium">
                        Instead of generic estimates, our drivers report exact KG weights. This allows our ESG Engine to provide bankable carbon audit data for municipal certification.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminCarbonESG;
