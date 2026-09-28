import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
    MessageSquare, CheckCircle, Clock, Trash2, Search, Filter, 
    AlertCircle, MapPin, User, Image as ImageIcon, Send, X, ShieldAlert 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminComplaints = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
    const [searchTerm, setSearchTerm] = useState('');
    const [msg, setMsg] = useState({ type: '', content: '' });

    // Rejection Modal State
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('Duplicate Report');

    // Finalize Modal State
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [adminRemarks, setAdminRemarks] = useState('');

    const fetchComplaints = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('http://localhost:5000/api/complaints', config);
            setComplaints(data);
        } catch (error) {
            console.error("Error fetching complaints", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const handleDecline = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`http://localhost:5000/api/complaints/${selectedComplaint._id}/decline`, { reason: rejectionReason }, config);
            setMsg({ type: 'success', content: 'Report declined and resident notified.' });
            setShowRejectionModal(false);
            fetchComplaints();
        } catch (error) {
            setMsg({ type: 'error', content: 'Action failed.' });
        }
    };

    const handleFinalize = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.patch(`http://localhost:5000/api/complaints/${selectedComplaint._id}/finalize`, { adminRemarks }, config);
            setMsg({ type: 'success', content: 'Case closed and credits authorized.' });
            setShowFinalizeModal(false);
            setAdminRemarks('');
            fetchComplaints();
        } catch (error) {
            setMsg({ type: 'error', content: 'Action failed.' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this record permanently?')) return;
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`http://localhost:5000/api/complaints/${id}`, config);
            setMsg({ type: 'success', content: 'Record removed.' });
            fetchComplaints();
        } catch (error) {
            setMsg({ type: 'error', content: 'Delete failed.' });
        }
    };

    const filteredComplaints = complaints.filter(c => {
        const isActive = ['pending', 'assigned', 'on-the-way', 'arrived'].includes(c.status);
        const matchesTab = activeTab === 'active' ? isActive : !isActive;
        const matchesSearch = c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.locationName?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;

    return (
        <div className="space-y-8 p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Toast Message */}
            <AnimatePresence>
                {msg.content && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={`fixed top-8 right-8 px-8 py-4 rounded-[2rem] shadow-2xl text-white z-[6000] font-black uppercase tracking-widest text-[10px] ${msg.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                        {msg.content}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-black text-[#064E3B] uppercase tracking-tighter italic leading-none">
                    Incident Control: <span className="text-emerald-600">{user?.city}</span>
                </h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input type="text" placeholder="Search Incidents..." className="pl-12 pr-6 py-4 bg-white border-none rounded-2xl shadow-inner text-xs font-bold w-64 focus:ring-2 focus:ring-emerald-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* 1. BROADCAST QUEUE (PENDING) */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-[#064E3B] uppercase italic tracking-tighter">
                                    {activeTab === 'active' ? 'Active Operations' : 'Historical Archive'}
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                    {activeTab === 'active' ? 'Live routing and triage' : 'Resolved datasets and legal reporting'}
                                </p>
                            </div>
                            <div className="flex gap-2 bg-slate-100 p-2 rounded-2xl">
                                <button onClick={() => setActiveTab('active')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-white shadow px-8' : 'text-slate-400 hover:text-slate-600'}`}>Active</button>
                                <button onClick={() => setActiveTab('history')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white shadow px-8' : 'text-slate-400 hover:text-slate-600'}`}>History</button>
                            </div>
                        </div>

                        <div className="divide-y">
                            {filteredComplaints.length === 0 ? (
                                <div className="p-20 text-center opacity-30 italic font-bold text-slate-400">Clear Horizon: No incidents detected.</div>
                            ) : (
                                filteredComplaints.map(complaint => (
                                    <div key={complaint._id} className="p-10 flex flex-col lg:flex-row gap-8 hover:bg-slate-50 transition-all group">
                                        {/* Visual Evidence */}
                                        <div className="w-full lg:w-48 h-48 bg-slate-100 rounded-[2.5rem] flex-shrink-0 overflow-hidden relative shadow-inner border border-gray-100">
                                            {complaint.imageUrl ? (
                                                <img src={complaint.imageUrl} alt="Incident" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" size={40} />
                                            )}
                                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">
                                                ID: {complaint._id.substring(18)}
                                            </div>
                                        </div>

                                        {/* Meta Information */}
                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{complaint.locationName || 'Unmarked Sector'}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <MapPin size={12} className="text-red-500" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{complaint.location?.lat.toFixed(4)}, {complaint.location?.lng.toFixed(4)}</span>
                                                    </div>
                                                </div>
                                                <span className={`px-4 py-2 text-[9px] rounded-full font-black uppercase tracking-[0.2em] border shadow-sm ${
                                                    complaint.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    complaint.status === 'on-the-way' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    complaint.status === 'arrived' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    complaint.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    'bg-slate-100 text-slate-400 border-slate-200'
                                                }`}>
                                                    {complaint.status}
                                                </span>
                                            </div>

                                            <p className="text-xs font-medium text-slate-500 leading-relaxed uppercase tracking-wide italic">" {complaint.description} "</p>

                                            <div className="flex flex-wrap gap-4 pt-4">
                                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                                                    <User size={14} className="text-slate-400" />
                                                    <span className="text-[10px] font-black text-slate-600 uppercase italic">{complaint.user?.name}</span>
                                                </div>
                                                {complaint.assignedDriver && (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                                                        <Send size={14} className="text-indigo-600" />
                                                        <span className="text-[10px] font-black text-indigo-700 uppercase italic">Unit: {complaint.assignedDriver.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Node */}
                                        <div className="flex lg:flex-col gap-3 justify-center min-w-[140px]">
                                            {complaint.status === 'pending' && (
                                                <button onClick={() => { setSelectedComplaint(complaint); setShowRejectionModal(true); }} className="w-full py-4 bg-white border border-red-100 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                                                    <X size={14} /> Decline
                                                </button>
                                            )}
                                            {complaint.status === 'resolved' && !complaint.isAuthorized && (
                                                <button onClick={() => { setSelectedComplaint(complaint); setShowFinalizeModal(true); }} className="w-full py-4 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/20">
                                                    <CheckCircle size={14} /> Finalize Case
                                                </button>
                                            )}
                                            {complaint.pdfReportUrl && activeTab === 'history' && (
                                                <a href={`http://localhost:5000${complaint.pdfReportUrl}`} target="_blank" rel="noreferrer" className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-xl">
                                                    View Legal PDF
                                                </a>
                                            )}
                                            <button onClick={() => handleDelete(complaint._id)} className="p-4 bg-slate-50 text-slate-300 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. LIVE PULSE ANALYTICS */}
                <div className="space-y-8">
                     <div className="bg-[#064E3B] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="p-4 bg-white/10 rounded-[2rem] inline-block mb-6 border border-white/20">
                                <AlertCircle size={32} className="text-amber-400 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-4 leading-none">Sector Triage</h3>
                            <p className="text-[10px] font-medium opacity-60 mb-8 leading-loose uppercase tracking-[0.2em]">Monitoring resolved collections and pending bio-threats in the Nagpur sector.</p>
                            
                            <div className="space-y-4">
                                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Efficiency Rate</span>
                                    <span className="text-xl font-black italic tracking-tighter">{(resolved/total*100).toFixed(0)}%</span>
                                </div>
                                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Active Units</span>
                                    <span className="text-xl font-black italic tracking-tighter">{complaints.filter(c => c.status === 'on-the-way').length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* REJECTION MODAL */}
            <AnimatePresence>
                {showRejectionModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[7000] p-6">
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-12 rounded-[4rem] shadow-2xl w-full max-w-md border border-white">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#064E3B] mb-6 leading-none">Decline Incident</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">Rejection Reason (Internal)</label>
                                    <select 
                                        className="w-full bg-slate-50 rounded-2xl p-5 text-xs font-black border-none appearance-none cursor-pointer" 
                                        value={rejectionReason} 
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                    >
                                        <option>Duplicate Report</option>
                                        <option>Spam/Fake Content</option>
                                        <option>Out of Service Area</option>
                                        <option>Hazardous - Requires Specialists</option>
                                        <option>Already Addressed</option>
                                    </select>
                                </div>
                                <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-center gap-4">
                                    <ShieldAlert size={28} className="text-amber-600 flex-shrink-0" />
                                    <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest leading-loose">The resident will only see that the admin declined the request. This reason is for internal auditing only.</p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setShowRejectionModal(false)} className="flex-1 py-5 rounded-2xl bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">Cancel</button>
                                    <button onClick={handleDecline} className="flex-1 py-5 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-2xl">Confirm Decline</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* FINALIZE MODAL */}
            <AnimatePresence>
                {showFinalizeModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[7000] p-6">
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#064E3B] text-white p-12 rounded-[4rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-md border border-white/10 relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2 leading-none">Close Case</h3>
                                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-8 opacity-80">Final verification & credit disbursement</p>
                                <div className="space-y-6">
                                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 shadow-inner">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Field Classification</span>
                                            <span className="text-[10px] font-black uppercase text-emerald-400">{selectedComplaint?.wasteSummary?.category || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Volume Load</span>
                                            <span className="text-[10px] font-black uppercase text-amber-400">{selectedComplaint?.wasteSummary?.volume || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] ml-2 block mb-3">Admin Remarks (Required)</label>
                                        <textarea 
                                            className="w-full bg-white/10 rounded-3xl p-6 text-xs font-medium border border-white/10 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none h-32" 
                                            placeholder="Enter final closing remarks validating the driver's operation to authorize credits..."
                                            value={adminRemarks} 
                                            onChange={(e) => setAdminRemarks(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setShowFinalizeModal(false)} className="flex-1 py-5 rounded-[1.5rem] bg-white/10 text-white/50 text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Cancel</button>
                                        <button 
                                            disabled={adminRemarks.length < 5} 
                                            onClick={handleFinalize} 
                                            className="flex-1 py-5 rounded-[1.5rem] bg-white text-[#064E3B] text-[10px] font-black uppercase tracking-widest shadow-2xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            Authorize
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
                                <CheckCircle size={150} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminComplaints;
