import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Users, Truck, Trash2, AlertTriangle, Send, CheckCircle, Activity, Zap } from 'lucide-react';
import MapComponent from '../../components/MapComponent';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-lg shadow border flex items-center justify-between transition-all hover:shadow-md">
        <div className="flex flex-col">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
            <p className="text-3xl font-black mt-1 text-slate-800 italic tracking-tighter">{value}</p>
        </div>
        <div className={`p-4 rounded-3xl ${color} shadow-xl`}>
            {Icon && <Icon size={20} className="text-white" />}
        </div>
    </div>
);

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalBins: 0,
        overflowingBins: 0,
        activeTrucks: 0,
        pendingComplaints: 0
    });
    const [bins, setBins] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [logisticsUnits, setLogisticsUnits] = useState({});
    const [activeRoutes, setActiveRoutes] = useState([]);
    const [festivals, setFestivals] = useState([]);
    const [hotspots, setHotspots] = useState([]);
    const [predictionMode, setPredictionMode] = useState(false);

    // Analytics Mock
    const chartData = [
        { name: 'Mon', collected: 40 }, { name: 'Tue', collected: 30 },
        { name: 'Wed', collected: 20 }, { name: 'Thu', collected: 27 },
        { name: 'Fri', collected: 18 }, { name: 'Sat', collected: 23 },
        { name: 'Sun', collected: 34 },
    ];

    // Wrap the fetch logic inside a useCallback to be used in useEffect and socket events
    const fetchData = useCallback(async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [compRes, binRes, truckRes, festRes, hotspotRes] = await Promise.all([
                axios.get('http://localhost:5000/api/complaints', config),
                axios.get('http://localhost:5000/api/bins', config),
                axios.get('http://localhost:5000/api/trucks', config),
                axios.get(`http://localhost:5000/api/predict/events?city=${user?.city}`, config),
                axios.get(`http://localhost:5000/api/predict/hotspots?city=${user?.city}`, config)
            ]);

            setComplaints(compRes.data);
            setBins(binRes.data);
            setFestivals(festRes.data);
            setHotspots(hotspotRes.data);

            // AUTO-TRIGGER PREDICTION MODE IF FESTIVAL IS NEAR (48H)
            const today = new Date();
            const isNearFestival = festRes.data.some(f => {
                const fDate = new Date(f.date);
                const diffTime = fDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 2;
            });
            if (isNearFestival) setPredictionMode(true);

            setStats({
                totalBins: binRes.data.length,
                overflowingBins: binRes.data.filter(b => b.status === 'overflowing').length,
                activeTrucks: truckRes.data.filter(t => t.status === 'active').length,
                pendingComplaints: compRes.data.filter(c => c.status === 'pending').length
            });

            // Initialize current routes for already assigned jobs
            const routes = compRes.data
                .filter(c => (c.status === 'on-the-way' || c.status === 'arrived') && c.routePath?.length > 0)
                .map(c => c.routePath.map(p => ({ lat: p[0], lng: p[1] })));
            setActiveRoutes(routes);

        } catch (error) {
            console.error("Fetch error:", error);
        }
    }, [user?.city]);

    useEffect(() => {
        if (user?.city) {
            fetchData();

            const socket = io('http://localhost:5000');
            socket.emit('join_city_room', user.city);

            // REAL-TIME LOGISTICS SYNC
            socket.on('driver_assigned', (data) => {
                fetchData();
                if (data.routePath) {
                    setActiveRoutes(prev => [...prev, data.routePath.map(p => ({ lat: p[0], lng: p[1] }))]);
                }
            });

            socket.on('driver_location_update', (data) => {
                setLogisticsUnits(prev => ({
                    ...prev,
                    [data.complaintId]: { lat: data.lat, lng: data.lng }
                }));
            });

            socket.on('collection_completed', () => fetchData());

            return () => socket.close();
        }
    }, [user, fetchData]);

    const handleBroadcast = async (id) => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`http://localhost:5000/api/complaints/${id}/ping`, {}, config);
        } catch (error) {
            console.error("Broadcast failed");
        }
    };

    const mapCenter = user?.location?.coordinates
        ? [user.location.coordinates[1], user.location.coordinates[0]]
        : [21.1458, 79.0882];

    const truckMarkers = Object.entries(logisticsUnits).map(([id, pos]) => ({
        id,
        lat: pos.lat,
        lng: pos.lng,
        plate: "ACTIVE",
        driver: "Logistics Unit"
    }));

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-4 lg:p-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-black text-[#064E3B] uppercase tracking-tighter italic">
                    Administrative <span className="text-[#059669]">Dispatch Node</span>
                </h2>
                <div className="flex gap-4">
                    <div className="px-6 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                        <Zap size={14} className="text-amber-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{user?.city} Live Feed</span>
                    </div>

                    <button
                        onClick={() => setPredictionMode(!predictionMode)}
                        className={`px-6 py-2 rounded-2xl border flex items-center gap-3 transition-all ${predictionMode ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-100' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
                    >
                        <Activity size={14} className={predictionMode ? 'animate-bounce' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{predictionMode ? 'Prediction Active' : 'Enable Analytics'}</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Network Nodes" value={stats.totalBins} icon={Trash2} color="bg-blue-500 shadow-blue-100" />
                <StatCard title="Critical Breaches" value={stats.overflowingBins} icon={AlertTriangle} color="bg-red-500 shadow-red-100" />
                <StatCard title="Active Fleet" value={stats.activeTrucks} icon={Truck} color="bg-indigo-500 shadow-indigo-100" />
                <StatCard title="Priority Tasks" value={stats.pendingComplaints} icon={Users} color="bg-amber-500 shadow-amber-100" />
            </div>

            {/* CORE LOGISTICS MAP */}
            <div className="bg-white rounded-[3rem] shadow-2xl border border-blue-50/50 h-[650px] relative overflow-hidden z-0 p-2 ring-1 ring-slate-100">
                <MapComponent
                    center={mapCenter}
                    bins={bins}
                    trucks={truckMarkers}
                    route={activeRoutes.flat()}
                    hotspots={hotspots}
                    predictionMode={predictionMode}
                    festivals={festivals}
                />

                {/* Map Overlay HUD */}
                <div className="absolute bottom-8 left-8 z-[1000] bg-white/90 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-2xl max-w-xs">
                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity size={14} className="text-emerald-500" /> Sector Legend
                    </h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> <span className="text-[9px] font-bold uppercase text-slate-400">Stable Node</span></div>
                        <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-red-500"></span> <span className="text-[9px] font-bold uppercase text-slate-400">Overflow Alert</span></div>
                        <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-indigo-600"></span> <span className="text-[9px] font-bold uppercase text-slate-400">Live Logistics Unit</span></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Dispatch Queue */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-[#064E3B] uppercase italic tracking-tighter">Mission Dispatch Hub</h3>
                        <span className="px-4 py-2 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">Awaiting Command</span>
                    </div>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 no-scrollbar">
                        {complaints.filter(c => c.status === 'pending').map(comp => (
                            <div key={comp._id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-xl transition-all group border-l-8 border-l-amber-400">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-inner text-red-500 border border-slate-100">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{comp.locationName || 'Sector Alpha'}</p>
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest max-w-sm truncate mt-1 italic">"{comp.description}"</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleBroadcast(comp._id)}
                                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-100 hover:bg-black transition-all flex items-center gap-3"
                                >
                                    <Send size={16} /> Broadcast
                                </motion.button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Logistics Radar / Summary */}
                <div className="bg-[#064E3B] p-10 rounded-[3rem] text-white shadow-2xl flex flex-col relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="p-4 bg-white/10 rounded-3xl inline-block mb-6 border border-white/20 shadow-inner">
                            <Activity size={32} className="text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Network Radar</h3>
                        <p className="text-[10px] font-medium opacity-50 uppercase tracking-widest mb-10 leading-loose">Monitoring regional waste-nodes and logistics interceptors in real-time.</p>

                        <div className="space-y-4">
                            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Success Rate</span>
                                <span className="text-2xl font-black italic text-emerald-400">92%</span>
                            </div>
                            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Avg React Time</span>
                                <span className="text-2xl font-black italic text-amber-400">4.2m</span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;