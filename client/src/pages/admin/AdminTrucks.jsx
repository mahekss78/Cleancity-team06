import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Truck, Users, Activity, AlertCircle, Plus, X, Save, Phone, Fingerprint } from 'lucide-react';

const AdminTrucks = () => {
    const { user } = useAuth();
    const [trucks, setTrucks] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        plateNumber: '',
        capacity: 1000,
        driver: ''
    });
    const [msg, setMsg] = useState({ type: '', content: '' });

    const fetchTrucksAndDrivers = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [trucksRes, usersRes] = await Promise.all([
                axios.get('http://localhost:5000/api/trucks', config),
                axios.get('http://localhost:5000/api/users', config)
            ]);

            setTrucks(trucksRes.data);
            setDrivers(usersRes.data.filter(u => u.role === 'driver'));
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrucksAndDrivers();
    }, []);

    const handleCreateTruck = async (e) => {
        e.preventDefault();
        setMsg({ type: '', content: '' });
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('http://localhost:5000/api/trucks', formData, config);
            setMsg({ type: 'success', content: 'Truck created successfully!' });
            setShowModal(false);
            setFormData({ plateNumber: '', capacity: 1000, driver: '' });
            fetchTrucksAndDrivers();
        } catch (error) {
            setMsg({ type: 'error', content: error.response?.data?.message || 'Failed to create truck' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this truck?')) return;
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`http://localhost:5000/api/trucks/${id}`, config);
            setMsg({ type: 'success', content: 'Truck removed successfully' });
            fetchTrucksAndDrivers();
        } catch (error) {
            setMsg({ type: 'error', content: 'Failed to delete truck' });
        }
    };

    return (
        <div className="space-y-6 relative max-w-[1600px] mx-auto p-4 lg:p-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                    { label: "Fleet Readiness", val: trucks.length, icon: Truck, color: "blue" },
                    { label: "Registered Drivers", val: drivers.length, icon: Users, color: "indigo" },
                    { label: "Active Operations", val: "88%", icon: Activity, color: "green" },
                    { label: "System Alerts", val: 0, icon: AlertCircle, color: "orange" }
                 ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-xl border dark:border-gray-700 hover:scale-[1.02] transition-all cursor-default relative overflow-hidden group">
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-4xl font-black italic tracking-tighter dark:text-white uppercase">{stat.val}</h3>
                            </div>
                            <div className={`p-4 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-2xl text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:rotate-12 transition-transform`}>
                                <stat.icon size={28} />
                            </div>
                        </div>
                    </div>
                 ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* 1. Driver/Plate Directory (New Focus) */}
                <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-8 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase italic tracking-tighter">Verified Logistics Personnel</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active city-wide personnel tracking</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Driver Identity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Plate Number</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Signal</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Efficiency</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-12 text-center animate-pulse uppercase text-[10px] font-black text-gray-300">Syncing Grid...</td></tr>
                                ) : drivers.length === 0 ? (
                                    <tr><td colSpan="4" className="p-12 text-center text-[10px] font-black text-gray-300 uppercase">No registered drivers found</td></tr>
                                ) : (
                                    drivers.map(driver => (
                                        <tr key={driver._id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black italic shadow-lg shadow-indigo-200">
                                                        {driver.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-800 dark:text-white text-sm uppercase tracking-tight leading-none mb-1">{driver.name}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">CID: {driver._id.substring(0,8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                                                    <Fingerprint size={12} className="text-indigo-600" />
                                                    <span className="text-[10px] font-black text-indigo-700 uppercase italic">{driver.plateNumber || "UNASSIGNED"}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                    <Phone size={14} className="text-primary" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{driver.phone || "N/A"}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="w-full max-w-[100px] h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. Fleet Assets (Existing Truck Logic Optimized) */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col">
                    <div className="p-8 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-black dark:text-white uppercase italic tracking-tighter">Physical Fleet</h3>
                        <button onClick={() => setShowModal(true)} className="p-3 bg-primary text-white rounded-2xl shadow-lg hover:rotate-90 transition-all"><Plus size={20} /></button>
                    </div>
                    <div className="p-8 space-y-4 overflow-y-auto max-h-[600px]">
                        {trucks.map(truck => (
                            <div key={truck._id} className="p-6 bg-slate-50 dark:bg-gray-700/30 rounded-3xl border border-gray-100 dark:border-gray-700 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDelete(truck._id)} className="text-red-400 hover:text-red-600"><X size={18} /></button>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-white dark:bg-gray-600 rounded-2xl shadow-sm">
                                        <Truck size={24} className="text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">UNIT: {truck.plateNumber}</p>
                                        <div className="flex items-center gap-4">
                                             <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${truck.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{truck.status}</span>
                                             <span className="text-[10px] font-bold text-slate-500 uppercase">{truck.capacity} KG LOAD</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal & Toast (Preserved Logic) */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-6">
                    <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] w-full max-w-md shadow-2xl border dark:border-gray-700">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter dark:text-white">Register Asset</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 bg-gray-50 rounded-xl"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateTruck} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Plate Identification</label>
                                <input type="text" required className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl p-4 text-xs font-bold" placeholder="UNIT-XXX" value={formData.plateNumber} onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-primary text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3">
                                <Save size={18} /> Initialize Unit
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTrucks;
