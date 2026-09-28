import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
    Trash2, AlertTriangle, CheckCircle, MapPin, 
    ClipboardList, Lightbulb, ChevronRight, Zap, Info, FileSpreadsheet, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateCollectionCSV } from '../../services/reportService';

const AdminBins = () => {
    const { user } = useAuth();
    const [bins, setBins] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showBinModal, setShowBinModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [adminRemarks, setAdminRemarks] = useState('');
    const [newBin, setNewBin] = useState({ lat: '', lng: '', address: '', type: 'General Waste' });

    const fetchData = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const [binsRes, complaintsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/bins', config),
                axios.get('http://localhost:5000/api/complaints', config)
            ]);
            
            setBins(binsRes.data);
            setComplaints(complaintsRes.data);
        } catch (error) {
            console.error("Error fetching admin data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFinalize = async () => {
        if (!selectedReport) return;
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const { data } = await axios.patch(`http://localhost:5000/api/complaints/${selectedReport._id}/finalize`, {
                adminRemarks
            }, config);

            // Trigger CSV Generation
            generateCollectionCSV([data.complaint]);
            
            setShowReportModal(false);
            setSelectedReport(null);
            setAdminRemarks('');
            fetchData();
            alert("Report Finalized and Exported successfully.");
        } catch (error) {
            alert("Finalization failed.");
        }
    };

    const handleAddBin = async (e) => {
        e.preventDefault();
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.post('http://localhost:5000/api/bins', newBin, config);
            setBins([...bins, data]);
            setShowBinModal(false);
        } catch (error) { console.error(error); }
    };

    const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
    const finalizedComplaints = complaints.filter(c => !!c.finalizedAt);
    const pendingFinalization = complaints.filter(c => c.status === 'resolved' && !c.finalizedAt);

    return (
        <div className="space-y-8 p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50/30">
            
            {/* A. INTELLIGENCE STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                   { label: "Hardware Nodes", val: bins.length, icon: Trash2, color: "emerald", detail: "Active Grid Units" },
                   { label: "Pending Review", val: pendingFinalization.length, icon: ClipboardList, color: "amber", detail: "Awaiting Action" },
                   { label: "Critical Priority", val: bins.filter(b => b.status === 'overflowing').length, icon: AlertTriangle, color: "red", detail: "Immediate Action" },
                   { label: "Finalized Records", val: finalizedComplaints.length, icon: CheckCircle, color: "indigo", detail: "Authorized Logs" }
                ].map((stat, i) => (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} key={i} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">{stat.label}</p>
                            <h3 className="text-4xl font-black italic tracking-tighter text-slate-800 mb-2">{stat.val}</h3>
                            <p className="text-[9px] font-bold text-slate-300 uppercase underline decoration-indigo-500 decoration-2 underline-offset-4">{stat.detail}</p>
                        </div>
                        <stat.icon size={80} className={`absolute -right-4 -bottom-4 text-${stat.color}-500 opacity-5 rotate-12 group-hover:rotate-0 transition-transform`} />
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* 1. DISPATCH INTELLIGENCE FEED */}
                <div className="xl:col-span-2 space-y-8">
                    
                    {/* Resolved Activity List */}
                    <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="p-10 border-b flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-[#064E3B] uppercase italic tracking-tighter">Collection Review Node</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Review driver field reports and authorize payouts</p>
                            </div>
                            <button 
                                onClick={() => generateCollectionCSV(finalizedComplaints)}
                                className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-indigo-100"
                            >
                                <FileSpreadsheet size={16} /> Bulk Export History
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {pendingFinalization.length === 0 ? (
                                <div className="p-20 text-center opacity-40">
                                    <ShieldCheck size={48} className="mx-auto mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">No pending reviews in city grid.</p>
                                </div>
                            ) : (
                                pendingFinalization.map(report => (
                                    <div key={report._id} className="p-8 bg-white border border-gray-100 rounded-[2rem] hover:shadow-2xl transition-all group flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-indigo-600 border border-slate-100">
                                                <ClipboardList size={28} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{report.locationName || 'Street Collection'}</h4>
                                                <div className="flex gap-4 mt-2">
                                                    <span className="text-[8px] font-black uppercase px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100">Status: Resolved</span>
                                                    <span className="text-[8px] font-black uppercase px-3 py-1 bg-slate-50 text-slate-400 rounded-full border border-slate-100 italic">Material: {report.wasteSummary?.material}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => { setSelectedReport(report); setShowReportModal(true); }}
                                            className="px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all"
                                        >
                                            Process Intelligence
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Inventory Table (Compressed) */}
                    <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black text-[#064E3B] uppercase italic tracking-tighter leading-none">Global Asset Inventory</h3>
                            <button onClick={() => setShowBinModal(true)} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg hover:scale-110 transition-all"><Plus size={20} /></button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <tbody className="divide-y">
                                    {bins.map(bin => (
                                        <tr key={bin._id} className="hover:bg-slate-50 transition-all">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <MapPin size={16} className="text-emerald-500" />
                                                    <p className="font-black text-gray-800 text-[11px] uppercase tracking-tight">{bin.address}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${bin.status === 'empty' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{bin.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 2. SMART HUB ANALYTICS */}
                <div className="space-y-8">
                    <div className="bg-[#064E3B] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="p-4 bg-white/10 rounded-[2rem] inline-block mb-6 border border-white/20">
                                <Lightbulb size={32} className="text-amber-300 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-4 leading-none">Deployment Analysis</h3>
                            <p className="text-[10px] font-medium opacity-60 mb-8 leading-loose uppercase tracking-[0.2em]">Cross-referencing reported densities with existing node coverage maps.</p>
                            
                            <div className="space-y-4">
                                {complaints.slice(0,3).map((s, i) => (
                                    <div key={i} className="p-6 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-between">
                                        <div>
                                            <p className="text-[8px] font-black uppercase opacity-60 mb-1">Sector {s._id.substring(10,14)}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest">{s.locationName || 'Critical Spot'}</p>
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black tracking-widest">AI</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
                        <h4 className="text-xs font-black text-slate-800 uppercase italic tracking-tighter mb-4">Historical Archive</h4>
                        <div className="space-y-3">
                            {finalizedComplaints.slice(0, 3).map(f => (
                                <div key={f._id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <FileSpreadsheet size={16} className="text-slate-400" />
                                        <p className="text-[9px] font-black uppercase text-slate-500">ID: {f._id.substring(15)}</p>
                                    </div>
                                    {f.isAuthorized ? <ShieldCheck size={14} className="text-emerald-500" /> : <ShieldAlert size={14} className="text-amber-500" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* MODAL 1: FINALIZATION & REPORTING */}
            <AnimatePresence>
                {showReportModal && selectedReport && (
                    <div className="fixed inset-0 bg-[#064E3B]/60 backdrop-blur-2xl flex items-center justify-center z-[5000] p-6">
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-12 rounded-[4rem] shadow-2xl w-full max-w-2xl border border-white relative">
                            <button onClick={() => setShowReportModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-red-500"><X size={24} /></button>
                            
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#064E3B] mb-2 leading-none">Intelligence Authorization</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 mt-2 italic">CleanCity Logistics Validation Protocol</p>
                            
                            <div className="grid grid-cols-2 gap-10 mb-10">
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Source Entity (Resident)</h5>
                                    <div className="p-5 bg-slate-50 rounded-3xl space-y-2">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{selectedReport.user?.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{selectedReport.user?.phone}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{selectedReport.locationName || 'Manual Pinpoint'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Logistics Unit (Driver)</h5>
                                    <div className="p-5 bg-indigo-50/30 rounded-3xl space-y-2 border border-indigo-50">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{selectedReport.assignedDriver?.name || 'Unit Alpha'}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Plate: {selectedReport.assignedDriver?.plateNumber}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Load: {selectedReport.wasteSummary?.volume}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-10">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Administrative Closing Remarks</label>
                                <textarea 
                                    className="w-full bg-slate-50 rounded-[2rem] p-8 text-xs font-black focus:ring-2 focus:ring-indigo-600 outline-none border-none placeholder:text-slate-200" 
                                    placeholder="Enter authorization sequence... (Required for Authorized status)"
                                    rows="4"
                                    value={adminRemarks}
                                    onChange={(e) => setAdminRemarks(e.target.value)}
                                />
                                {!adminRemarks && (
                                    <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600 text-[9px] font-black uppercase tracking-widest">
                                        <ShieldAlert size={14} /> Warning: Empty remarks will mark report as UNAUTHORIZED.
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleFinalize}
                                className="w-full py-6 bg-black text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all italic flex items-center justify-center gap-4"
                            >
                                <ShieldCheck size={20} /> Finalize Intelligence Node
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 2: ADD BIN (Redesigned) */}
            <AnimatePresence>
                {showBinModal && (
                    <div className="fixed inset-0 bg-[#064E3B]/60 backdrop-blur-2xl flex items-center justify-center z-[5000] p-6">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-[4rem] shadow-2xl w-full max-w-md border border-white overflow-hidden relative">
                             <button onClick={() => setShowBinModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-red-500"><X size={20} /></button>
                             <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#064E3B] mb-10 leading-none">Initialize Hardware</h3>
                             <form onSubmit={handleAddBin} className="space-y-6">
                                <input type="text" className="w-full bg-slate-50 rounded-2xl p-5 text-xs font-black border-none" placeholder="Global Identifier (Address)" value={newBin.address} onChange={(e) => setNewBin({ ...newBin, address: e.target.value })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" step="0.0001" className="bg-slate-50 rounded-2xl p-5 text-xs font-black border-none" placeholder="LAT" value={newBin.lat} onChange={(e) => setNewBin({ ...newBin, lat: e.target.value })} />
                                    <input type="number" step="0.0001" className="bg-slate-50 rounded-2xl p-5 text-xs font-black border-none" placeholder="LNG" value={newBin.lng} onChange={(e) => setNewBin({ ...newBin, lng: e.target.value })} />
                                </div>
                                <select className="w-full bg-slate-50 rounded-2xl p-5 text-xs font-black border-none appearance-none" value={newBin.type} onChange={(e) => setNewBin({ ...newBin, type: e.target.value })}>
                                    <option>General Waste</option>
                                    <option>Recycling Node</option>
                                    <option>Organic Hub</option>
                                </select>
                                <button type="submit" className="w-full py-6 bg-[#059669] text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl italic">Activate Unit</button>
                             </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

const Plus = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const X = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export default AdminBins;
