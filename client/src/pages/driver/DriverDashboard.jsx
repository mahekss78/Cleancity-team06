import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import MapComponent from '../../components/MapComponent';
import { useAuth } from '../../context/AuthContext';
import {
    CheckCircle, MapPin, Truck, AlertTriangle,
    Navigation, Bell, X, Send,
    ClipboardCheck, Activity, Info, Phone, MessageSquare
} from 'lucide-react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

// --- GEOSPATIAL HELPERS ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
};


const DriverDashboard = () => {
    const { user } = useAuth();

    // 1. CORE STATE
    const [bins, setBins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [optimizing, setOptimizing] = useState(false);
    const [route, setRoute] = useState([]);
    const [currentPos, setCurrentPos] = useState({ lat: 21.1458, lng: 79.0882 });

    // 2. LOGISTICS & NAVIGATION STATE
    const [socket, setSocket] = useState(null);
    const [incomingJob, setIncomingJob] = useState(null);
    const [activeAssignment, setActiveAssignment] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [navigationSteps, setNavigationSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isFollowing, setIsFollowing] = useState(true);
    const [lastRecalcTime, setLastRecalcTime] = useState(0);
    const [currentZoom, setCurrentZoom] = useState(13);

    // 3. UI & COMMS STATE
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showQuiz, setShowQuiz] = useState(false);

    const ignoredJobsRef = useRef([]);
    const locationTimer = useRef(null);
    const lastEmitRef = useRef(0); // Throttle gate for socket GPS pings

    // 4. DERIVED STATE
    const pendingTasks = bins.filter(b => b.status === 'pending' || b.status === 'assigned');

    // 5. HELPER FUNCTIONS (Hoisted manually by declaration order)
    const calculateSimpleDist = (lat1, lon1, lat2, lon2) => {
        return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
    };

    const checkDeviation = (lat, lng, path) => {
        const minDistance = Math.min(...path.map(p => calculateSimpleDist(lat, lng, p[0], p[1])));
        return minDistance > 0.0012;
    };
    const [driverImagePreview, setDriverImagePreview] = useState(null);
    const [quizData, setQuizData] = useState({
        accurateDescription: true,
        volume: '5-20kg',
        category: 'Plastic',
        hazards: 'None',
        submittedOtp: ''
    });
    const [isSnapping, setIsSnapping] = useState(false);

    const fetchTasks = useCallback(async () => {
        try {
            const token = user?.token || JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [binsRes, complaintsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/bins', config),
                axios.get('http://localhost:5000/api/complaints', config)
            ]);

            setBins([...binsRes.data, ...complaintsRes.data]);

            const myJob = complaintsRes.data.find(c => 
                (c.status === 'on-the-way' || c.status === 'arrived') && 
                (c.assignedDriver?._id === user?._id || c.assignedDriver === user?._id)
            );
            if (myJob) setActiveAssignment(myJob);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // REAL-TIME GEOLOCATION TRACKING (CO-PILOT + LIVE TELEMETRY)
    useEffect(() => {
        if (activeAssignment && navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    // DO NOT overwrite snapped position if arriving or already arrived
                    if (activeAssignment.status === 'arrived' || isSnapping) return;

                    const { latitude, longitude, heading } = pos.coords;
                    setCurrentPos({ lat: latitude, lng: longitude });

                    // ─── LIVE TELEMETRY EMIT (Uber/Swiggy pattern) ───────────────
                    // Throttle: emit once every 5 seconds via WebSocket relay
                    // This bypasses slow HTTP and goes directly peer-to-peer via socket
                    const now = Date.now();
                    if (socket && activeAssignment._id && (now - lastEmitRef.current > 5000)) {
                        socket.emit('driver_location_ping', {
                            complaintId: activeAssignment._id,
                            lat: latitude,
                            lng: longitude,
                            heading: heading || 0
                        });
                        lastEmitRef.current = now;
                    }

                    // AUTO-RECALCULATION LOGIC: Detect deviation from road polyline
                    if (activeAssignment.routePath && activeAssignment.routePath.length > 1) {
                        const deviationNow = Date.now();
                        if (deviationNow - lastRecalcTime > 15000) { // Throttling: Check every 15s
                            const isOffPath = checkDeviation(latitude, longitude, activeAssignment.routePath);
                            if (isOffPath) {
                                console.log("Co-Pilot: Deviation detected. Recalculating...");
                                recalculateRoute(latitude, longitude);
                                setLastRecalcTime(deviationNow);
                            }
                        }
                    }

                    // STEP ADVANCEMENT: Progress through turn-by-turn instructions
                    if (navigationSteps.length > 0 && currentStepIndex < navigationSteps.length) {
                        const nextStep = navigationSteps[currentStepIndex];
                        const distToStep = calculateSimpleDist(latitude, longitude, nextStep.location[0], nextStep.location[1]);
                        if (distToStep < 0.02) { // Within ~20 meters
                            setCurrentStepIndex(prev => prev + 1);
                        }
                    }
                },
                (err) => console.log("GPS Lock Lost:", err.message),
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [activeAssignment?.status, activeAssignment?._id, navigationSteps, currentStepIndex, lastRecalcTime, socket]);



    const recalculateRoute = async (lat, lng) => {
        try {
            const token = user?.token || JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data: routeData } = await axios.post('http://localhost:8000/get-route', {
                start: { lat, lng },
                end: activeAssignment.location
            });

            if (routeData) {
                setNavigationSteps(routeData.steps || []);
                setCurrentStepIndex(0);
                setActiveAssignment(prev => ({
                    ...prev,
                    routePath: routeData.path,
                    eta: Math.ceil(routeData.duration / 60)
                }));
            }
        } catch (e) { console.error("Recalculation error:", e); }
    };

    // Periodic DB heartbeat (every 30s) — for persistence/history only, not for live UI
    useEffect(() => {
        if (!activeAssignment || !socket) return;
        const interval = setInterval(async () => {
            try {
                const token = user?.token || JSON.parse(localStorage.getItem('userInfo'))?.token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.patch('http://localhost:5000/api/complaints/sync-location', {
                    complaintId: activeAssignment._id,
                    lat: currentPos.lat,
                    lng: currentPos.lng
                }, config);
            } catch (e) { console.error(e); }
        }, 30000); // Every 30 seconds to DB (not 5s)
        return () => clearInterval(interval);
    }, [currentPos, activeAssignment, socket, user]);


    useEffect(() => {
        fetchTasks();

        const newSocket = io('http://localhost:5000', { forceNew: true });
        setSocket(newSocket);

        const joinRooms = () => {
            if (user?.city) newSocket.emit('join_city_room', user.city);
            if (user?._id) newSocket.emit('join_personal_room', user._id);
        };

        newSocket.on('connect', joinRooms);
        if (newSocket.connected) {
            joinRooms();
        }

        newSocket.on('job_broadcast_alert', (data) => {
            if (!ignoredJobsRef.current.includes(data.complaintId)) {
                setIncomingJob(data);
            }
        });

        newSocket.on('job_claimed', (data) => {
            if (incomingJob?.complaintId === data.complaintId) {
                setIncomingJob(null);
            }
        });

        newSocket.on('new_message', (msg) => {
            setMessages(prev => {
                if (prev.some(m => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        });

        newSocket.on('report_declined', (data) => {
            if (activeAssignment?._id === data.complaintId) {
                setActiveAssignment(null);
                alert("Incident Cancelled by Admin: " + data.message);
            }
        });

        newSocket.on('driver_rated', (data) => {
            // Native Gamification Pop-Up
            if (data.rating === 'Job Completed') {
                alert(`🎯 Mission Authorized! Base Incentive Granted.\nBonus Added: +${data.creditBonus} Eco Credits!`);
            } else {
                alert(`🏆 You received a ${data.rating}★ rating from the Resident!\nBonus Added: +${data.creditBonus} Eco Credits!`);
            }
            
            // Sync with local memory passively
            const currentLocal = JSON.parse(localStorage.getItem('userInfo'));
            if (currentLocal) {
                currentLocal.ecoCredits = data.newTotalCredits;
                currentLocal.earnings = data.newTotalEarnings;
                localStorage.setItem('userInfo', JSON.stringify(currentLocal));
            }
            // Trigger visual refresh of state
            window.location.reload(); 
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user, fetchTasks]);

    // Update currentPos when user data loads
    useEffect(() => {
        if (user?.location?.coordinates) {
            setCurrentPos({
                lat: user.location.coordinates[1],
                lng: user.location.coordinates[0]
            });
        }
    }, [user]);

    // Join explicit channel for chat
    useEffect(() => {
        if (activeAssignment && socket) {
            socket.emit('join_complaint_room', activeAssignment._id);
        }
    }, [activeAssignment, socket]);

    const handleAccept = async () => {
        if (!incomingJob) return;
        try {
            const token = user?.token || JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.patch(`http://localhost:5000/api/complaints/${incomingJob.complaintId}/accept`, {}, config);
            setIncomingJob(null);
            setActiveAssignment(data);

            // Initialize Navigation Steps
            if (data.routePath) {
                await recalculateRoute(currentPos.lat, currentPos.lng);
            }

            fetchTasks();
        } catch (error) {
            alert(error.response?.data?.message || "Job already claimed.");
            console.error(error);
            alert("Failed to accept job or already claimed.");
        }
    };

    const handleManualAccept = async (complaintId) => {
        try {
            const token = user?.token || JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.patch(`http://localhost:5000/api/complaints/${complaintId}/accept`, {}, config);
            setActiveAssignment(data);
            if (data.routePath) {
                await recalculateRoute(currentPos.lat, currentPos.lng);
            }
            fetchTasks();
        } catch (error) {
            alert(error.response?.data?.message || "Job already claimed by another Logistics Unit.");
            fetchTasks(); // refresh if claimed
        }
    };

    const handleDeclineJob = () => {
        if (incomingJob) {
            ignoredJobsRef.current.push(incomingJob.complaintId);
            setIncomingJob(null);
        }
    };

    const handleArrive = async () => {
        if (!activeAssignment) return;

        // 1. SNAP IMMEDIATELY & LOCK GPS
        setIsSnapping(true);
        if (activeAssignment.location) {
            setCurrentPos({
                lat: activeAssignment.location.lat,
                lng: activeAssignment.location.lng
            });
            setIsFollowing(true);
        }

        try {
            const token = user?.token || JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.patch(`http://localhost:5000/api/complaints/${activeAssignment._id}/arrive`, {}, config);

            // 2. SYNC STATE & UNLOCK
            setActiveAssignment({ ...data.complaint, status: 'arrived' });
            fetchTasks();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to mark arrival.");
        } finally {
            setIsSnapping(false);
        }
    };

    const submitFieldReport = async () => {
        if (quizData.submittedOtp.length !== 4) {
            alert('A 4-digit Resident OTP is required to unlock the resolution sequence.');
            return;
        }
        if (!driverImagePreview) {
            alert('Photographic evidence of the cleaned location is required.');
            return;
        }

        try {
            const token = user?.token || JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.patch(`http://localhost:5000/api/complaints/${activeAssignment._id}/resolve`, {
                wasteSummary: quizData,
                driverImageUrl: driverImagePreview
            }, config);
            setActiveAssignment(null);
            setShowQuiz(false);
            setQuizData({
                accurateDescription: true,
                volume: '5-20kg',
                exactWeight: '',
                category: 'Plastic',
                hazards: 'None',
                submittedOtp: ''
            });
            setDriverImagePreview(null);
            await fetchTasks();
            
            // Use a non-blocking temporary notification instead of a system alert
            // so React can instantly repaint without freezing the tab
            setTimeout(() => {
                alert('Mission Completed! Legal Report securely archived.');
            }, 100);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit report verification.');
        }
    };

    const handleDriverImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setDriverImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const sendMessage = () => {
        if (!newMessage || !activeAssignment) return;
        socket.emit('chat_message', {
            complaintId: activeAssignment._id,
            content: newMessage,
            senderId: user._id
        });
        setNewMessage('');
    };

    const mapCenter = user?.location ? [user.location.coordinates[1], user.location.coordinates[0]] : [21.1458, 79.0882];

    return (
        <div className="space-y-6 relative h-screen max-w-[1600px] mx-auto p-4 lg:p-8 flex flex-col">
            {/* 1. TOP STATUS BAR */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-gray-100 h-fit">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-100">
                        <Truck size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[#064E3B] uppercase italic tracking-tighter leading-none">Logistics Unit: {user?.city}</h2>
                        <div className="flex gap-2 mt-2">
                            <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full border border-emerald-100 italic">Plate: {user?.plateNumber || 'UNIT-ALPHA'}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-400 px-4 py-1.5 rounded-full border border-indigo-100 italic">Connected</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-amber-50 px-8 py-4 rounded-[2rem] border border-amber-100 text-right shadow-sm group hover:scale-[1.02] transition-transform">
                        <p className="text-[9px] font-black uppercase text-amber-500/60 tracking-widest leading-none mb-1">Driver Credits</p>
                        <p className="text-2xl font-black text-amber-600 tracking-tighter italic leading-none flex items-center justify-end gap-2">{user?.ecoCredits || 0} <div className="text-amber-500 animate-pulse">★</div></p>
                    </div>
                    <div className="bg-slate-50 px-8 py-4 rounded-[2rem] border border-gray-100 text-right">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Grid Earnings</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter italic leading-none flex items-center justify-end gap-2">₹ {user?.earnings || 0} <Activity size={16} className="text-emerald-500" /></p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 overflow-hidden">
                {/* 2. LIVE TRACKING MAP (Centerpiece) */}
                <div className="lg:col-span-3 bg-white rounded-[3.5rem] shadow-2xl border border-gray-100 overflow-hidden relative transition-all min-h-[500px]">
                    <MapComponent
                        center={isFollowing ? [currentPos.lat, currentPos.lng] : null}
                        zoom={currentZoom}
                        bins={bins}
                        layoutMode={!!activeAssignment}
                        route={activeAssignment?.routePath || []}
                        trucks={[{
                            id: 'me',
                            plate: user?.plateNumber || 'LOG-ALPHA',
                            driver: 'LIVE SIGNAL',
                            lat: (activeAssignment?.status === 'arrived' || isSnapping) && activeAssignment?.location?.lat ? activeAssignment.location.lat : currentPos.lat,
                            lng: (activeAssignment?.status === 'arrived' || isSnapping) && activeAssignment?.location?.lng ? activeAssignment.location.lng : currentPos.lng
                        }]}
                    />

                    {/* CO-PILOT NAVIGATION RIBBON */}
                    <AnimatePresence>
                        {activeAssignment && activeAssignment.status === 'on-the-way' && navigationSteps[currentStepIndex] && (
                            <motion.div
                                initial={{ y: -100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -100, opacity: 0 }}
                                className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-lg"
                            >
                                <div className="bg-[#064E3B]/90 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-6 shadow-2xl flex items-center gap-6">
                                    <div className="h-16 w-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-900/40">
                                        <Navigation className="text-white" size={32} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-1">Co-Pilot Command</p>
                                        <h3 className="text-xl font-black text-white italic tracking-tighter leading-tight">
                                            {navigationSteps[currentStepIndex].instruction}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Activity size={12} className="text-emerald-500" />
                                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                                In {Math.round(navigationSteps[currentStepIndex].distance)} meters
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* MAP CONTROLS */}
                    <div className="absolute bottom-10 right-10 z-[1000] flex flex-col gap-3">
                        <button
                            onClick={() => setIsFollowing(!isFollowing)}
                            className={`p-5 rounded-3xl shadow-2xl transition-all border ${isFollowing ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-slate-600 border-slate-100'}`}
                        >
                            <Navigation size={24} className={isFollowing ? 'animate-pulse' : ''} />
                        </button>
                    </div>

                    {/* Full Screen Dismiss Button Removed - Integrated into Sidebar */}

                    {/* Chat Floating Overlay */}
                    {activeAssignment && showChat && (
                        <div className="absolute bottom-8 right-8 z-[6000] w-[400px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col h-[500px] overflow-hidden">
                            <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#064E3B]">Resident Comms link</h3>
                                <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[10px] font-bold">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.sender === user._id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-3 rounded-2xl ${m.sender === user._id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-[#064E3B]'}`}>{m.content}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t flex gap-2">
                                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-[10px] font-black outline-none" placeholder="Reply..." />
                                <button onClick={sendMessage} className="p-3 bg-indigo-600 text-white rounded-xl"><Send size={16} /></button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. COMS & TASKS SIDEBAR */}
                <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeAssignment ? (
                            <motion.div
                                key="active-mission"
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 50, opacity: 0 }}
                                className="bg-[#064E3B] text-white p-6 rounded-[2.5rem] shadow-2xl border border-emerald-500/20 flex flex-col gap-6 relative overflow-hidden"
                            >
                                <div className="absolute -top-10 -right-10 opacity-10 rotate-12">
                                    <Navigation size={120} />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                                            <Navigation className="animate-pulse text-emerald-400" size={32} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
                                                Active Intercept: {activeAssignment.user?.name || 'Unknown User'}
                                            </p>
                                            <h4 className="text-xl font-black uppercase italic tracking-tighter leading-tight">{activeAssignment.locationName || 'Vector Sector'}</h4>
                                        </div>
                                    </div>

                                    <div className="space-y-4 bg-black/20 p-5 rounded-[2rem] border border-white/5 mb-6">
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-60">
                                            <span>Coordinates</span>
                                            <span className="text-red-400">{activeAssignment.location.lat.toFixed(4)}, {activeAssignment.location.lng.toFixed(4)}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-white/5 pt-4">
                                            <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Est. Intercept</p>
                                            <p className="text-sm font-black italic tracking-tighter text-amber-300 uppercase">
                                                {activeAssignment.status === 'on-the-way' ? `${activeAssignment.eta || '4'} MIN` : 'Arrived'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {activeAssignment.status === 'on-the-way' ? (
                                            <button onClick={handleArrive} className="w-full bg-white text-[#064E3B] py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl">Confirm Arrival</button>
                                        ) : (
                                            <button onClick={() => setShowQuiz(true)} className="w-full bg-emerald-500 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl">Dump Collected!</button>
                                        )}

                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            <button onClick={() => setShowChat(true)} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/5 flex flex-col items-center gap-2">
                                                <MessageSquare size={18} />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Comms</span>
                                            </button>
                                            <button onClick={() => { if (window.confirm('Abort Mission? Admin will be notified.')) setActiveAssignment(null) }} className="p-4 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500/20 transition-all border border-red-500/10 flex flex-col items-center gap-2">
                                                <X size={18} />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Abort</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="mission-queue"
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -50, opacity: 0 }}
                                className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col flex-1 overflow-hidden"
                            >
                                <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#064E3B]">Grid Map</h3>
                                    <span className="text-[10px] font-black text-indigo-400">{pendingTasks.length} NODES</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {pendingTasks.filter(b => b.status === 'pending').map((task, i) => (
                                        <div key={task._id} className="p-4 bg-slate-50/50 rounded-2xl border border-gray-50 flex items-center gap-4 hover:border-emerald-200 transition-colors">
                                            <div className="text-[9px] font-black text-slate-300">#{i + 1}</div>
                                            <div className="truncate flex-1">
                                                <p className="text-[10px] font-black text-emerald-700 truncate uppercase">{task.locationName || 'Street Spot'}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase italic truncate">{task.description}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleManualAccept(task._id)} 
                                                className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                            >
                                                Claim
                                            </button>
                                        </div>
                                    ))}
                                    {pendingTasks.length === 0 && (
                                        <div className="text-center py-20">
                                            <CheckCircle className="mx-auto text-emerald-100 mb-4" size={48} />
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Grid Clean</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* BROADCAST & QUIZ OVERLAYS (Preserved & Styled) */}
            <AnimatePresence>
                {incomingJob && !activeAssignment && (
                    <div className="fixed inset-0 z-[9000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg">
                            <div className="bg-[#064E3B] text-white p-8 rounded-[3.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.8)] border-2 border-emerald-500/30 flex flex-col gap-6 relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 opacity-10 rotate-12">
                                    <AlertTriangle size={150} />
                                </div>
                                <div className="flex items-start gap-5 relative z-10">
                                    <div className="p-5 bg-emerald-500 rounded-3xl flex-shrink-0 shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse">
                                        <Bell size={32} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-2 text-emerald-300">Incoming Mission Ping</h3>
                                        <div className="space-y-2 mt-4 text-[11px] font-bold text-white/80 uppercase tracking-widest bg-white/5 p-4 rounded-2xl border border-white/10">
                                            <p className="flex justify-between items-center border-b border-white/5 pb-2">
                                                <span>Target Vector:</span>
                                                <span className="text-emerald-400">{incomingJob.locationName}</span>
                                            </p>
                                            <p className="flex justify-between items-center pt-2">
                                                <span>Est. Distance:</span>
                                                <span className="text-amber-300">~{calculateDistance(currentPos.lat, currentPos.lng, incomingJob.location.lat, incomingJob.location.lng) || 'Calculating...'} KM</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-2 relative z-10">
                                    <button onClick={handleDeclineJob} className="flex-1 py-5 rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest border border-white/10">Decline Mission</button>
                                    <button onClick={handleAccept} className="flex-[2] py-5 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-400 transition-all text-[12px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] border border-emerald-400">Accept Request</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* FIELD REPORT (QUIZ) */}
            <AnimatePresence>
                {showQuiz && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[9500] flex items-center justify-center p-6 bg-[#F0FDF4] overflow-y-auto">
                        <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] max-w-xl w-full border border-emerald-100 my-8">
                            <h3 className="text-2xl font-black text-[#064E3B] uppercase italic tracking-tighter mb-6 leading-none">Mandatory Resolution Quiz</h3>

                            <div className="space-y-6">
                                {/* Q1: Accurate Description */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">1. Was the resident's description accurate?</label>
                                    <div className="flex gap-3">
                                        {['Yes', 'No'].map(opt => (
                                            <button key={opt} onClick={() => setQuizData({ ...quizData, accurateDescription: opt === 'Yes' })} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all border ${quizData.accurateDescription === (opt === 'Yes') ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{opt}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Q2: Volume */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">2a. Load Category</label>
                                        <select value={quizData.volume} onChange={(e) => setQuizData({ ...quizData, volume: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase border-none outline-none focus:ring-2 focus:ring-emerald-500">
                                            <option value="< 5kg">&lt; 5kg (Light Load)</option>
                                            <option value="5-20kg">5-20kg (Standard Load)</option>
                                            <option value="> 20kg">&gt; 20kg (Heavy Load)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">2b. Exact Weight (KG)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={quizData.exactWeight || ''} 
                                                onChange={(e) => setQuizData({ ...quizData, exactWeight: e.target.value })}
                                                placeholder="e.g. 12.5"
                                                className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase border-none outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">KG</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Q3: Classification */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">3. Primary Material Classification</label>
                                    <select value={quizData.category} onChange={(e) => setQuizData({ ...quizData, category: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase border-none outline-none focus:ring-2 focus:ring-emerald-500">
                                        <option value="Plastic/Recyclable">Plastic/Recyclable</option>
                                        <option value="Organic">Organic</option>
                                        <option value="E-Waste">E-Waste</option>
                                        <option value="Construction Debris">Construction Debris</option>
                                        <option value="General Mixed">General Mixed</option>
                                    </select>
                                </div>

                                {/* Q4: Hazards */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">4. Condition & Hazards</label>
                                    <select value={quizData.hazards} onChange={(e) => setQuizData({ ...quizData, hazards: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase border-none outline-none focus:ring-2 focus:ring-emerald-500">
                                        <option value="None">None (Safe)</option>
                                        <option value="Medical">Medical Waste</option>
                                        <option value="Chemical">Chemical/Biological</option>
                                        <option value="Battery/Electronic">Battery/High Voltage</option>
                                    </select>
                                </div>

                                {/* Q5: Photo Evidence */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">5. "After" Photo (Cleaned Site)</label>
                                    <div className="relative group cursor-pointer">
                                        <input type="file" onChange={handleDriverImageChange} className="absolute inset-0 opacity-0 z-10 cursor-pointer" accept="image/*" />
                                        <div className={`h-24 w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${driverImagePreview ? 'border-emerald-500 bg-white' : 'border-slate-200 bg-slate-50 group-hover:bg-slate-100'}`}>
                                            {driverImagePreview ? <img src={driverImagePreview} className="w-full h-full object-cover" alt="After" /> : <div className="text-[9px] font-black uppercase tracking-widest flex flex-col items-center gap-2"><CheckCircle size={20} className="text-emerald-500" /> Capture Evidence</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Q6: OTP Verification */}
                                <div className="p-6 bg-[#064E3B] rounded-[2rem] border border-white/10 shadow-inner mt-4">
                                    <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-3 flex items-center justify-between">
                                        6. Resident Verification Code <Activity size={14} className="animate-pulse" />
                                    </label>
                                    <input
                                        type="text"
                                        maxLength="4"
                                        placeholder="••••"
                                        className="w-full bg-white/10 text-center text-3xl tracking-[1em] font-black text-white p-4 rounded-2xl border border-white/10 outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-white/20"
                                        value={quizData.submittedOtp}
                                        onChange={(e) => setQuizData({ ...quizData, submittedOtp: e.target.value.replace(/\D/g, '') })}
                                    />
                                    <p className="text-[8px] font-bold text-white/50 uppercase mt-3 text-center">Resident must provide this 4-digit code to conclude intercept.</p>
                                </div>

                                <div className="flex gap-4 pt-4 mt-6">
                                    <button disabled={loadingAI} onClick={() => setShowQuiz(false)} className="flex-1 py-5 rounded-[1.5rem] bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200">Abort</button>
                                    <button disabled={loadingAI} onClick={async () => {
                                        setLoadingAI(true);
                                        await submitFieldReport();
                                        setLoadingAI(false);
                                    }} className="flex-[2] py-5 rounded-[1.5rem] bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/30 hover:bg-emerald-500 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                                        {loadingAI ? <Loader className="animate-spin" size={16} /> : 'Generate Signature & Resolve'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DriverDashboard;
