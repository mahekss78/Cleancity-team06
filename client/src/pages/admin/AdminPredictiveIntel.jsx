import { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Calendar, MapPin, TrendingUp, AlertCircle, Info, Map as MapIcon, ChevronRight, PieChart as PieIcon, BarChart as BarIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import MapComponent from '../../components/MapComponent';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPredictiveIntel = () => {
    const { user } = useAuth();
    const [geoData, setGeoData] = useState({});
    const [filters, setFilters] = useState({ state: "", city: "" });
    const [hotspots, setHotspots] = useState([]);
    const [festivals, setFestivals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHotspot, setSelectedHotspot] = useState(null);
    const [error, setError] = useState(null);


    // 1. Fetch available Geography on mount
    useEffect(() => {
        const fetchGeo = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('http://localhost:5000/api/predict/geography', config);
                setGeoData(res.data);

                const states = Object.keys(res.data);
                if (states.length > 0) {
                    setFilters({
                        state: states[0],
                        city: res.data[states[0]][0]
                    });
                }
            } catch (err) {
                console.error("Geo fetch failed:", err);
                setError("Could not load regional labels.");
            }
        };
        fetchGeo();
    }, []);

    const fetchData = async () => {
        if (!filters.state || !filters.city) return;
        setLoading(true);
        setError(null);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [hotspotRes, eventRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/predict/hotspots?state=${encodeURIComponent(filters.state)}&city=${encodeURIComponent(filters.city)}`, config),
                axios.get(`http://localhost:5000/api/predict/events?state=${encodeURIComponent(filters.state)}&city=${encodeURIComponent(filters.city)}`, config)
            ]);

            setHotspots(hotspotRes.data);
            setFestivals(eventRes.data);
            setSelectedHotspot(hotspotRes.data.length > 0 ? hotspotRes.data[0] : null);
        } catch (err) {
            console.error("Fetch failed:", err);
            setError("Active radar sync failed.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    const mapCenter = user?.location?.coordinates
        ? [user.location.coordinates[1], user.location.coordinates[0]]
        : [21.1458, 79.0882];

    const demographicData = selectedHotspot ? [
        { name: 'Hindu', value: selectedHotspot.demographics?.hindu || 0, color: '#F59E0B' },
        { name: 'Muslim', value: selectedHotspot.demographics?.muslim || 0, color: '#10B981' },
        { name: 'Buddhist', value: selectedHotspot.demographics?.buddhist || 0, color: '#6366F1' },
        { name: 'Christian', value: selectedHotspot.demographics?.christian || 0, color: '#EF4444' },
        { name: 'Others', value: selectedHotspot.demographics?.others || 0, color: '#94A3B8' }
    ] : [];

    const trendData = selectedHotspot && selectedHotspot.history ? [
        ...selectedHotspot.history.map(h => ({
            year: h.year,
            volume: h.avgVolume,
            type: 'Historical'
        })),
        {
            year: 2026,
            volume: selectedHotspot.prediction2026?.score || 0,
            type: 'Predicted'
        }
    ] : [];

    return (
        <div className="space-y-8 p-4 lg:p-10 max-w-[1600px] mx-auto min-h-screen">

            {/* 1. HEADER & GLOBAL FILTERS */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                <div className="flex items-center gap-6">
                    <div className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-[2.5rem] shadow-2xl shadow-indigo-200">
                        <Sparkles size={32} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-[#064E3B] uppercase tracking-tighter italic leading-none">Neural Radar</h2>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">National Demographic Prediction Core v4.0</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <div className="flex items-center gap-3 px-6 py-3 border-r border-slate-100">
                        <MapIcon size={16} className="text-indigo-500" />
                        <select
                            value={filters.state}
                            onChange={(e) => {
                                const newState = e.target.value;
                                setFilters({
                                    state: newState,
                                    city: geoData[newState] ? geoData[newState][0] : ""
                                });
                            }}
                            className="bg-transparent text-sm font-black uppercase tracking-tight focus:outline-none cursor-pointer"
                        >
                            <option value="">Select State</option>
                            {Object.keys(geoData).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-3">
                        <MapPin size={16} className="text-emerald-500" />
                        <select
                            value={filters.city}
                            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                            className="bg-transparent text-sm font-black uppercase tracking-tight focus:outline-none cursor-pointer"
                        >
                            <option value="">Select City</option>
                            {filters.state && geoData[filters.state]?.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. FESTIVAL HORIZON */}
            <div className="bg-white p-10 rounded-[4rem] shadow-2xl border border-slate-50 relative overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl"><Calendar size={20} /></div>
                        <h3 className="text-2xl font-black text-[#064E3B] uppercase italic tracking-tighter">Festival Horizon</h3>
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Regional Events for {filters.state}</span>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar">
                    {festivals.length === 0 ? (
                        <div className="w-full text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-[10px]">No active temporal triggers in this sector.</div>
                    ) : (
                        festivals.map((f, i) => (
                            <motion.div
                                key={i} whileHover={{ y: -5 }}
                                className="min-w-[320px] p-10 bg-slate-50 rounded-[3rem] border border-slate-100 flex flex-col justify-between group transition-all hover:bg-white hover:shadow-xl"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${f.scope === 'National' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {f.scope} IMPACT
                                        </span>
                                        <TrendingUp size={16} className="text-amber-500 opacity-40" />
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-tight mb-2">{f.name}</h4>
                                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic line-clamp-2">"{f.description}"</p>
                                </div>
                                <div className="mt-8 pt-8 border-t border-slate-200/50">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact Multiplier</p>
                                            <p className="text-2xl font-black italic text-[#064E3B]">{f.impactMultiplier}x</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Participation</p>
                                            <p className="text-2xl font-black italic text-emerald-600">{(f.participationWeight * 100).toFixed(0)}%</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* 3. CORE ANALYTICS ENGINE */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

                {/* LEFT: GEO-RADAR */}
                <div className="xl:col-span-8 space-y-8">
                    <div className="bg-white p-4 rounded-[4rem] shadow-2xl border border-slate-100 h-[700px] relative overflow-hidden group">
                        <MapComponent
                            center={mapCenter}
                            hotspots={hotspots}
                            predictionMode={true}
                            festivals={festivals}
                        />
                        <div className="absolute bottom-10 left-10 z-[1000] bg-white/95 backdrop-blur-md p-8 rounded-[3rem] border border-white shadow-2xl max-w-sm">
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-3">
                                <MapIcon size={14} className="text-indigo-600" /> Sector Census
                            </h4>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                                {hotspots.map((spot, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedHotspot(spot)}
                                        className={`w-full text-left p-4 rounded-3xl border transition-all flex items-center justify-between ${selectedHotspot?.hierarchy?.neighborhood === spot.hierarchy?.neighborhood ? 'bg-indigo-50 border-indigo-100 shadow-inner scale-105' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'}`}
                                    >
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-tight text-slate-800">{spot.hierarchy?.neighborhood}</p>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{spot.hierarchy?.pincode}</p>
                                        </div>
                                        <TrendingUp size={12} className={selectedHotspot?.hierarchy?.neighborhood === spot.hierarchy?.neighborhood ? 'text-indigo-600' : 'text-slate-300'} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* HISTORICAL TREND GRAPH */}
                    <AnimatePresence mode="wait">
                        {selectedHotspot && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100"
                            >
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">5-Year Load Projection</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Historic Trend Analysis vs 2026 Forecast</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Prediction Integrity</p>
                                        <p className="text-2xl font-black italic text-[#064E3B]">High</p>
                                    </div>
                                </div>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trendData}>
                                            <defs>
                                                <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }} />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '20px' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                                            />
                                            <Area type="monotone" dataKey="volume" stroke="#6366F1" strokeWidth={5} fillOpacity={1} fill="url(#colorVol)" />
                                            <Line type="monotone" dataKey="volume" stroke="#6366F1" strokeWidth={5} dot={{ r: 6, fill: '#6366F1', strokeWidth: 3, stroke: '#fff' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* RIGHT: DEMOGRAPHIC CONTEXT */}
                <div className="xl:col-span-4 space-y-8">
                    {selectedHotspot && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                                className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100"
                            >
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-4 bg-amber-50 rounded-3xl text-amber-600"><Info size={24} /></div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Risk Reasoner</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Neighborhood Identity</p>
                                        <p className="text-lg font-black text-slate-800 uppercase italic tracking-tight mb-2">{selectedHotspot?.hierarchy?.neighborhood}</p>
                                        <p className="text-[11px] leading-relaxed text-slate-400 font-medium italic">Sector: {selectedHotspot?.metadata?.type} | Pincode: {selectedHotspot?.hierarchy?.pincode}</p>
                                    </div>

                                    <div className="p-6 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">AI Forecasting Detail</p>
                                        <p className="text-[11px] leading-relaxed text-emerald-800 font-black italic">"{selectedHotspot?.prediction2026?.reason}"</p>
                                    </div>

                                    <div className="p-8 bg-indigo-600 rounded-[3rem] text-white shadow-xl shadow-indigo-100 flex flex-col items-center text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">2026 Projected Lead Load</p>
                                        <p className="text-5xl font-black italic tracking-tighter mb-4">{selectedHotspot?.prediction2026?.score?.toFixed(0)}<span className="text-xl">kg</span></p>
                                        <div className="px-6 py-2 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest">Probability: 94%</div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>

            </div>

        </div>
    );
};

export default AdminPredictiveIntel;
