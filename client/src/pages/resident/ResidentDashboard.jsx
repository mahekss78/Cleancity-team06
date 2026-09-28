import { useState, useEffect, useCallback, useRef } from 'react';
import MapComponent from '../../components/MapComponent';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
    Camera, MapPin, Send, AlertCircle, Loader, 
    MessageSquare, Phone, Clock, ShieldCheck, 
    Coins, Zap, CheckCircle2, X, Truck, Activity, AlertTriangle
} from 'lucide-react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const ResidentDashboard = () => {
    const { user } = useAuth();
    const [bins, setBins] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [description, setDescription] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reportStatus, setReportStatus] = useState('');
    const [loadingAI, setLoadingAI] = useState(false);
    const [showModal, setShowModal] = useState(false);
    
    // Uber-like Logic State
    const [socket, setSocket] = useState(null);
    const [activeAssignment, setActiveAssignment] = useState(null);
    const [history, setHistory] = useState([]); // Vault for closed issues
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    // AI Analysis States
    const [aiAnalysisState, setAiAnalysisState] = useState('idle'); // 'idle', 'analyzing', 'done'
    const [aiResult, setAiResult] = useState(null);
    const [showAiPopup, setShowAiPopup] = useState(false);
    const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);

    // Rating State
    const [complaintToRate, setComplaintToRate] = useState(null);
    const [rating, setRating] = useState(5);
    const [feedback, setFeedback] = useState('');

    const mapRef = useRef();
    // ─── INTERPOLATION ENGINE (Swiggy/Uber smooth marker movement) ───
    // Holds the DISPLAY position (smoothly animated)
    const [smoothDriverPos, setSmoothDriverPos] = useState(null);
    // Holds the raw target from GPS ping
    const interpFromRef = useRef(null);
    const interpToRef = useRef(null);
    const interpStartRef = useRef(null);
    const interpFrameRef = useRef(null);
    const INTERP_DURATION = 5000; // Match driver's 5s emit interval

    const fetchBins = useCallback(async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('http://localhost:5000/api/bins', config);
            setBins(data);
        } catch (error) {
            console.error(error);
        }
    }, []);

    const fetchMyActiveComplaints = useCallback(async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('http://localhost:5000/api/complaints/my', config);
            
            // Separate active vs historical
            const active = data.find(c => c.status === 'assigned' || c.status === 'on-the-way' || c.status === 'arrived');
            const past = data.filter(c => c._id !== active?._id);
            
            if (active) setActiveAssignment(active);
            setHistory(past);
        } catch (error) {
            console.error(error);
        }
    }, []);

    const deleteHistoricalReport = async (id) => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`http://localhost:5000/api/complaints/${id}`, config);
            setHistory(prev => prev.filter(c => c._id !== id));
        } catch (error) {
            console.error('Failed to delete report', error);
        }
    };

    useEffect(() => {
        fetchBins();
        fetchMyActiveComplaints();

        const newSocket = io('http://localhost:5000', { forceNew: true });
        setSocket(newSocket);

        const joinRooms = () => {
            if (user?._id) newSocket.emit('join_personal_room', user._id);
        };

        newSocket.on('connect', joinRooms);
        if (newSocket.connected) {
            joinRooms();
        }

        // 1. Listen for Acceptance
        newSocket.on('driver_assigned', (data) => {
            setActiveAssignment(prev => ({ ...prev, ...data, status: 'on-the-way' }));
            setReportStatus('Logistics unit intercepted! Tracking live.');
        });

        // 2. Listen for Real-Time Location Heartbeats (with linear interpolation)
        newSocket.on('driver_location_update', (data) => {
            // Update the raw state for DB/route awareness
            setActiveAssignment(prev => {
                if (!prev) return prev;
                return { ...prev, driverLocation: { lat: data.lat, lng: data.lng } };
            });

            // Cancel any in-progress animation
            if (interpFrameRef.current) cancelAnimationFrame(interpFrameRef.current);

            // Set interpolation from/to targets
            // 'from' = where the marker is RIGHT NOW (last smooth position)
            interpFromRef.current = interpToRef.current || { lat: data.lat, lng: data.lng };
            interpToRef.current = { lat: data.lat, lng: data.lng };
            interpStartRef.current = performance.now();

            // Animate smoothly using requestAnimationFrame
            const animate = (now) => {
                const elapsed = now - interpStartRef.current;
                const t = Math.min(elapsed / INTERP_DURATION, 1); // 0 to 1
                // Linear interpolation: pos = from + (to - from) * t
                const lat = interpFromRef.current.lat + (interpToRef.current.lat - interpFromRef.current.lat) * t;
                const lng = interpFromRef.current.lng + (interpToRef.current.lng - interpFromRef.current.lng) * t;
                setSmoothDriverPos({ lat, lng });
                if (t < 1) {
                    interpFrameRef.current = requestAnimationFrame(animate);
                }
            };
            interpFrameRef.current = requestAnimationFrame(animate);
        });

        // 2.5 Listen for driver arrival
        newSocket.on('driver_arrived', (data) => {
            setActiveAssignment(prev => {
                if (!prev) return prev;
                return { ...prev, status: 'arrived' };
            });
            setReportStatus('Logistics unit has arrived at your location.');
        });

        // 3. Listen for Decline (Rejection)
        newSocket.on('report_declined', (data) => {
            setReportStatus(data.message);
            setActiveAssignment(null);
            alert("Administrative Update: " + data.message);
        });

        newSocket.on('collection_completed', (data) => {
            setComplaintToRate(data.complaintId);
            setActiveAssignment(null);
            setReportStatus(data.message);
            fetchBins(); // Refresh bins
            fetchMyActiveComplaints(); // Refresh history
        });

        newSocket.on('new_message', (msg) => {
            setMessages(prev => {
                if (prev.some(m => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user, fetchBins, fetchMyActiveComplaints]);

    useEffect(() => {
        if (activeAssignment && socket) {
            const complaintId = activeAssignment._id || activeAssignment.complaintId;
            socket.emit('join_complaint_room', complaintId);
        }
    }, [activeAssignment, socket]);

    const submitRating = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.patch(`http://localhost:5000/api/complaints/${complaintToRate}/rate`, {
                rating, feedback
            }, config);
            setComplaintToRate(null);
            setRating(5);
            setFeedback('');
            alert('Feedback submitted successfully!');
            fetchMyActiveComplaints();
        } catch (error) {
            console.error('Failed to submit rating', error);
            alert('Failed to submit rating!');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = user?.token;
            if (!token) throw new Error("Authentication failure. Secure session lost. Please log in again.");
            const config = { headers: { Authorization: `Bearer ${token}` } };

            await axios.post('http://localhost:5000/api/complaints', {
                description,
                city: user?.city || 'Thane',
                location: selectedLocation || { lat: 19.2183, lng: 72.9781 },
                locationName: selectedLocation
                    ? `Lat: ${selectedLocation.lat.toFixed(4)}, Lng: ${selectedLocation.lng.toFixed(4)}`
                    : 'Manually Pinned Spot',
                imageUrl: imagePreview
            }, config);

            setReportStatus('Signal transmitted. Waiting for Admin Broadcast...');
            setDescription('');
            setImagePreview(null);
            setSelectedLocation(null);
            fetchMyActiveComplaints(); // REFRESH ARCIVE IMMEDIATELY
        } catch (error) {
            setReportStatus('Transmission error.');
            console.error(error);
        } finally {
            setLoading(false);
            setAiAnalysisState('idle');
            setAiResult(null);
            setShowBoundingBoxes(false);
        }
    };

    const sendMessage = () => {
        if (!newMessage || !activeAssignment) return;
        socket.emit('chat_message', {
            complaintId: activeAssignment._id || activeAssignment.complaintId,
            content: newMessage,
            senderId: user._id
        });
        setNewMessage('');
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
            setAiAnalysisState('idle');
            setAiResult(null);
            setShowBoundingBoxes(false);
        };
        reader.readAsDataURL(file);
    };

    const handleRunAnalysis = () => {
        setAiAnalysisState('analyzing');
        // Simulate an AI pipeline delay
        setTimeout(() => {
            setAiResult({
                status: 'GARBAGE',
                types: ['Plastic', 'General Waste', 'Metal Context'],
                objects: [
                    { label: 'Trash Bag', box: { top: '30%', left: '40%', width: '35%', height: '45%' }, conf: 0.92 },
                    { label: 'Bin', box: { top: '20%', left: '15%', width: '25%', height: '70%' }, conf: 0.88 }
                ]
            });
            setAiAnalysisState('done');
            setShowAiPopup(true);
        }, 1500);
    };

    const mapCenter = user?.location?.coordinates 
        ? [user.location.coordinates[1], user.location.coordinates[0]] 
        : [21.1458, 79.0882];

    // Prepare trucks for MapComponent — use smoothDriverPos for animation, fall back to raw
    const trackingTrucks = (smoothDriverPos || activeAssignment?.driverLocation) ? [{
        id: activeAssignment?.assignedDriver?._id || activeAssignment?.complaintId || 'local-id',
        plate: activeAssignment?.plateNumber || activeAssignment?.assignedDriver?.plateNumber || 'UNIT-A',
        driver: activeAssignment?.driverName || activeAssignment?.assignedDriver?.name || 'Truck',
        lat: smoothDriverPos?.lat ?? activeAssignment?.driverLocation?.lat,
        lng: smoothDriverPos?.lng ?? activeAssignment?.driverLocation?.lng
    }] : [];

    // Prepare route polyline
    const routeData = activeAssignment?.routePath?.map(p => ({ lat: p[0], lng: p[1] })) || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full relative p-4 lg:p-8">
            {/* 1. MAIN TRACKING HUB (MAP) */}
            <div className="lg:col-span-2 h-[500px] lg:h-auto bg-white rounded-[3rem] shadow-2xl p-2 border border-blue-50/50 overflow-hidden relative group">
                <MapComponent
                    center={mapCenter}
                    bins={bins}
                    onMapClick={setSelectedLocation}
                    selectedLocation={selectedLocation}
                    trucks={trackingTrucks}
                    route={routeData}
                />
                
                {/* Floating Credits Badge */}
                <div className="absolute top-10 left-10 z-[1000] flex gap-4">
                    <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-3xl border border-white shadow-xl flex items-center gap-3">
                        <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 shadow-sm">
                            <Coins size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Eco Credits</p>
                            <p className="text-lg font-black text-[#064E3B] tracking-tighter leading-none">{user?.ecoCredits || 100}</p>
                        </div>
                    </div>
                    {/* User Profile Static Verification PIN */}
                    <div className="bg-[#064E3B] px-6 py-4 rounded-3xl border border-emerald-900 shadow-xl flex items-center gap-3 group transition-colors">
                        <div onClick={async () => {
                            try {
                                const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
                                const config = { headers: { Authorization: `Bearer ${token}` } };
                                const { data } = await axios.post('http://localhost:5000/api/users/reset-pin', {}, config);
                                const currentLocal = JSON.parse(localStorage.getItem('userInfo'));
                                currentLocal.pinCode = data.pinCode;
                                localStorage.setItem('userInfo', JSON.stringify(currentLocal));
                                window.location.reload();
                            } catch(err) { alert('Failed to reset PIN') }
                        }} className="p-3 bg-white/10 rounded-2xl text-emerald-300 shadow-inner hover:scale-110 hover:bg-white/20 transition-all cursor-pointer" title="Generate New PIN">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Your Signature PIN</p>
                            <p className="text-xl font-black text-white tracking-[0.3em] leading-none">{user?.pinCode || '----'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. DYNAMIC ACTION PANEL */}
            <div className="space-y-6 flex flex-col">
                
                {/* A. Status Card (Uber-like Tracking) */}
                <AnimatePresence>
                    {activeAssignment && (
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#064E3B] p-10 rounded-[3.5rem] text-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden ring-4 ring-white/10 group">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-10 flex items-center gap-3 text-emerald-400">
                                    <Activity size={14} className="animate-pulse" /> Intercept Protocol
                                </p>
                                <div className="flex items-center gap-8 mb-10">
                                    <div className="h-24 w-24 bg-white/10 rounded-[3rem] flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        <Truck size={48} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{activeAssignment?.driverName || activeAssignment?.assignedDriver?.name || 'Interceptor'}</h3>
                                        <p className="text-[11px] items-center flex gap-3 font-bold opacity-50 mt-3 uppercase tracking-[0.2em]">
                                            <ShieldCheck size={14} className="text-emerald-500" /> Unit: {activeAssignment?.plateNumber || activeAssignment?.assignedDriver?.plateNumber || 'CC-ACTIVE'}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-10">
                                    <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 shadow-inner">
                                        <p className="text-[9px] font-black uppercase opacity-30 mb-2 tracking-widest">Live Status</p>
                                        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400 italic">
                                            {activeAssignment?.status === 'arrived' ? 'ARRIVED' : 'En Route'}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 text-right shadow-inner">
                                        <p className="text-lg font-black uppercase flex items-center justify-end gap-2 text-amber-300 italic">
                                            {activeAssignment?.status === 'arrived' ? 'ACTION' : `~${activeAssignment?.eta || '4'} MIN`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 mb-8">
                                    <a href={`tel:${activeAssignment?.phone || activeAssignment?.assignedDriver?.phone || '0000'}`} className="flex-1 py-6 bg-white/10 rounded-[1.5rem] text-[10px] font-black uppercase flex items-center justify-center gap-4 hover:bg-white/20 transition-all border border-white/5 shadow-2xl">
                                        <Phone size={18} /> Signal
                                    </a>
                                    <button onClick={() => setShowChat(true)} className="flex-1 py-6 bg-white text-[#064E3B] rounded-[1.5rem] text-[10px] font-black uppercase flex items-center justify-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                        <MessageSquare size={18} /> Comms
                                    </button>
                                </div>
                                
                                {/* SECURE OTP DISPLAY */}
                                <div className="bg-emerald-900/50 border border-emerald-500/30 p-6 rounded-[2rem] text-center shadow-inner mt-6">
                                    <p className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-2 flex items-center justify-center gap-2">
                                        <ShieldCheck size={14} /> One-Time Trip OTP
                                    </p>
                                    <p className="text-4xl font-black text-white tracking-[0.5em] ml-4 drop-shadow-md">
                                        {activeAssignment?.otp || user?.pinCode}
                                    </p>
                                    <p className="text-[8px] font-bold uppercase text-emerald-400 mt-2">
                                        Provide this secure OTP to authorize collection.
                                    </p>
                                </div>
                            </div>
                            {/* Visual Pulse Background */}
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                <ShieldCheck size={180} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* B. Submission Form */}
                <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-gray-100 flex-1 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-2xl font-black text-[#064E3B] uppercase italic tracking-tighter leading-none">Initialize Reporting</h2>
                        <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><Camera size={20} /></div>
                    </div>

                    {reportStatus && (
                        <div className={`p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-8 text-center border ${reportStatus.includes('error') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            {reportStatus}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Target Coordinates</label>
                            <div className="flex items-center gap-4 p-5 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                <MapPin size={18} className="text-emerald-500" />
                                {selectedLocation ? `LAT: ${selectedLocation.lat.toFixed(4)} | LNG: ${selectedLocation.lng.toFixed(4)}` : "Deploy Pin on Map"}
                            </div>
                        </div>

                        <div className="relative group">
                            <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            <div className="h-56 w-full border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 bg-slate-50 group-hover:bg-white group-hover:border-emerald-500 transition-all overflow-hidden relative">
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} className="w-full h-full object-cover" alt="Telemetry" />
                                        {showBoundingBoxes && aiResult?.objects.map((obj, i) => (
                                            <div 
                                                key={i} 
                                                className="absolute border-2 border-emerald-400 bg-emerald-400/20 z-20 flex items-start justify-start"
                                                style={{...obj.box}}
                                            >
                                                <span className="bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-br-lg">{obj.label} {Math.round(obj.conf * 100)}%</span>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400"><Camera size={32} /></div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Visual Evidence Payload</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* AI ANALYSIS SECTION */}
                        {imagePreview && (
                            <div className="space-y-4">
                                {aiAnalysisState === 'idle' && (
                                    <button 
                                        type="button" 
                                        onClick={handleRunAnalysis}
                                        className="w-full py-4 rounded-2xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
                                    >
                                        Run Diagnostics (Clean / Garbage)
                                    </button>
                                )}
                                {aiAnalysisState === 'analyzing' && (
                                    <div className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                        <Activity size={16} className="animate-spin" /> Deep Scanning Image...
                                    </div>
                                )}
                                {aiAnalysisState === 'done' && aiResult && (
                                    <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest leading-loose">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-400">Environment Status:</span>
                                            <span className={aiResult.status === 'GARBAGE' ? 'text-red-500' : 'text-emerald-500'}>{aiResult.status}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">Classifications:</span>
                                            <span className="text-indigo-500 text-right">{aiResult.types.join(' • ')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <textarea
                            className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-xs font-bold text-[#064E3B] placeholder:text-slate-300 focus:bg-white transition-all outline-none min-h-[140px] resize-none"
                            placeholder="Telemetric description of contamination..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        ></textarea>

                        <button
                            type="submit"
                            disabled={loading || !selectedLocation}
                            className="w-full bg-black text-white py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-black transition-all flex items-center justify-center gap-4 italic"
                        >
                            {loading ? <Loader className="animate-spin" /> : <>Transmit Signal <Send size={20} /></>}
                        </button>
                    </form>
                </div>
            </div>

            {/* 3. CHAT SIDEBAR (ANIME-LIKE PANEL) */}
            <AnimatePresence>
                {showChat && (
                    <motion.div initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }} className="fixed top-0 right-0 h-screen w-full md:w-[450px] bg-white z-[8000] shadow-2xl flex flex-col">
                        <div className="p-10 border-b flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-2xl font-black text-[#064E3B] uppercase tracking-tighter italic italic tracking-tighter">Comms Link</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Encrypted Operator Feed</p>
                            </div>
                            <button onClick={() => setShowChat(false)} className="p-4 bg-white rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 p-10 overflow-y-auto space-y-6">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.sender === user._id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-5 rounded-[2rem] text-xs font-bold leading-relaxed shadow-sm ${m.sender === user._id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-[#064E3B] rounded-tl-none'}`}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {messages.length === 0 && (
                                <div className="text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-10">No messages yet.</div>
                            )}
                        </div>
                        <div className="p-10 border-t">
                            <div className="flex gap-4">
                                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Enter signal text..." className="flex-1 bg-slate-50 border-none rounded-[1.5rem] px-6 py-5 text-xs font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500 transition-all" />
                                <button onClick={sendMessage} className="p-5 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl shadow-indigo-100">
                                    <Send size={24} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. HISTORICAL ARCHIVE */}
            <div className="lg:col-span-3 mt-8">
                <h3 className="text-xl font-black text-[#064E3B] uppercase tracking-tighter italic mb-6">Historical Data Archive</h3>
                {history.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 rounded-[2rem] text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-white/50">No historical records found.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.map((record) => (
                            <div key={record._id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl opacity-90 hover:opacity-100 transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex gap-2 items-center">
                                        <span className={`px-3 py-1 rounded w-max text-[9px] font-black uppercase tracking-widest ${record.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : record.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{record.status}</span>
                                        {record.driverRating && <span className="text-amber-400 text-sm tracking-widest drop-shadow-sm">{'★'.repeat(record.driverRating)}</span>}
                                    </div>
                                    <button onClick={() => deleteHistoricalReport(record._id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={16} /></button>
                                </div>
                                
                                {record.imageUrl && (
                                    <div className="w-full h-32 bg-slate-100 rounded-2xl mb-4 overflow-hidden border border-gray-50 shadow-inner">
                                        <img src={record.imageUrl} alt="Historical Evidence" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                                    </div>
                                ) || (
                                    <div className="w-full h-32 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center border border-dashed border-slate-200">
                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">No Visual Evidence</span>
                                    </div>
                                )}

                                <p className="text-xs font-bold text-slate-600 mb-2 truncate">{record.description}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">{new Date(record.createdAt).toLocaleDateString()}</p>
                                
                                {record.pdfReportUrl && (
                                    <a href={`http://localhost:5000${record.pdfReportUrl}`} target="_blank" rel="noreferrer" className="block w-full text-center py-3 bg-slate-50 text-[#064E3B] text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100">
                                        Download Legal PDF
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Confirmation Popup */}
            <AnimatePresence>
                {showAiPopup && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[9000] p-6">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-sm w-full text-center">
                            <div className="mb-6 inline-flex p-4 bg-indigo-50 text-indigo-500 rounded-[2rem]">
                                <AlertTriangle size={48} />
                            </div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#064E3B] mb-2 leading-none">Analysis Complete</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 leading-relaxed">
                                The diagnostic engine has finished analyzing the payload. Do you want to examine the boundary boxes and detected objects on the image?
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowAiPopup(false)} 
                                    className="flex-1 py-5 rounded-2xl bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Dismiss
                                </button>
                                <button 
                                    onClick={() => { setShowBoundingBoxes(true); setShowAiPopup(false); }} 
                                    className="flex-1 py-5 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-500 transition-all"
                                >
                                    Load Data
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Rating Modal Popup */}
            <AnimatePresence>
                {complaintToRate && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[9000] p-6">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-sm w-full text-center">
                            <div className="mb-6 inline-flex p-4 bg-emerald-50 text-emerald-500 rounded-[2rem]">
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#064E3B] mb-2 leading-none">Job Completed</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 leading-relaxed">
                                Please rate the driver's service. Your feedback helps maintain our trust and quality standards.
                            </p>
                            
                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`text-4xl transition-all ${rating >= star ? 'text-amber-400 scale-110 drop-shadow-md' : 'text-slate-200 hover:text-amber-200'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>

                            <textarea
                                className="w-full bg-slate-50 border-none rounded-[1.5rem] p-4 text-xs font-bold text-slate-600 mb-6 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500 resize-none min-h-[100px]"
                                placeholder="Any additional feedback? (Optional)"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            ></textarea>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setComplaintToRate(null)} 
                                    className="flex-1 py-5 rounded-2xl bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Dismiss
                                </button>
                                <button 
                                    onClick={submitRating} 
                                    className="flex-1 py-5 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-500 transition-all"
                                >
                                    Submit
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default ResidentDashboard;