import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ShieldCheck, AlertTriangle, ArrowRight, Leaf, Sparkles, MapPin, LocateFixed, Keyboard } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CITY_COORDINATES = {
  'Thane': [19.2183, 72.9781],
  'Nagpur': [21.1458, 79.0882],
  'Mumbai': [19.0760, 72.8777],
  'Pune': [18.5204, 73.8567],
  'Nashik': [19.9975, 73.7898]
};

// Map View Controller to center map when city changes
const ChangeView = ({ center }) => {
  const map = useMap();
  map.setView(center, 12);
  return null;
};

// Map Click Handler for pinpointing
const LocationPicker = ({ onLocationPick }) => {
  useMapEvents({
    click(e) {
      onLocationPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

// Premium Glass Input with Internal Depth
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

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('resident');
  const [phone, setPhone] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [city, setCity] = useState('Thane');
  const [location, setLocation] = useState(CITY_COORDINATES['Thane']);
  const [manualCoords, setManualCoords] = useState({ lat: CITY_COORDINATES['Thane'][0].toString(), lng: CITY_COORDINATES['Thane'][1].toString() });
  const [showManual, setShowManual] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    setCity(selectedCity);
    const coords = CITY_COORDINATES[selectedCity];
    setLocation(coords);
    setManualCoords({ lat: coords[0].toString(), lng: coords[1].toString() });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.latitude, position.coords.longitude];
        setLocation(coords);
        setManualCoords({ lat: coords[0].toString(), lng: coords[1].toString() });
      },
      () => setError("Unable to retrieve your location")
    );
  };

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualCoords(prev => ({ ...prev, [name]: value }));
    const lat = parseFloat(name === 'lat' ? value : manualCoords.lat);
    const lng = parseFloat(name === 'lng' ? value : manualCoords.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setLocation([lat, lng]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Structured location as an object for the backend
      const locationData = { lat: location[0], lng: location[1] };
      await register(name, email, password, role, city, locationData, phone, plateNumber);
      
      if (role === 'admin') navigate('/admin');
      else if (role === 'driver') navigate('/driver');
      else navigate('/resident');
    } catch (err) {
      setError(err?.message || 'Terminal connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative font-sans antialiased overflow-hidden bg-[#F0FFF4]">
      
      {/* 1. ANIMATED BACKGROUND MESH */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] bg-[#A7F3D0] blur-[120px] rounded-full opacity-60" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], x: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-[#00F59B]/20 blur-[100px] rounded-full" 
        />
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
      </div>

      {/* 2. THE FLOATING REGISTER CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[800px] bg-gradient-to-br from-white/90 to-white/40 backdrop-blur-3xl p-8 rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: BASIC INFO */}
          <div className="space-y-6">
            <div className="flex flex-col items-center mb-6 text-center lg:text-left lg:items-start">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-[#00F59B] blur-2xl opacity-20 animate-pulse" />
                <div className="relative p-4 bg-white rounded-2xl shadow-lg border border-[#00F59B]/20">
                  <Leaf size={28} className="text-[#059669]" fill="#00F59B" fillOpacity={0.2} />
                </div>
              </div>
              <h2 className="text-2xl font-black text-[#064E3B] tracking-tighter uppercase italic leading-none">
                Clean<span className="text-[#059669]">City</span> Terminal
              </h2>
              <p className="mt-2 text-[8px] text-[#065F46]/50 font-black uppercase tracking-[0.4em]">
                Secure Registration Node
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-2 text-red-700 text-xs font-bold">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <GlassInput type="text" placeholder="Full Name" required icon={User} value={name} onChange={(e) => setName(e.target.value)} />
              <GlassInput type="email" placeholder="Email Address" required icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} />
              <GlassInput type="password" placeholder="Password" required icon={Lock} value={password} onChange={(e) => setPassword(e.target.value)} />
              <GlassInput type="tel" placeholder="Phone Number (e.g. +91...)" required icon={LocateFixed} value={phone} onChange={(e) => setPhone(e.target.value)} />
              
              <AnimatePresence>
                {role === 'driver' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <GlassInput type="text" placeholder="License Plate Number" required icon={Sparkles} value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#065F46]/40 pointer-events-none z-10">
                    <ShieldCheck size={18} strokeWidth={2} />
                  </div>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white/40 border border-white/40 rounded-[1.5rem] text-[#064E3B] text-xs font-bold appearance-none focus:bg-white/90 outline-none">
                    <option value="resident">Resident</option>
                    <option value="admin">Admin</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#065F46]/40 pointer-events-none z-10">
                    <MapPin size={18} strokeWidth={2} />
                  </div>
                  <select value={city} onChange={handleCityChange} className="w-full pl-12 pr-4 py-4 bg-white/40 border border-white/40 rounded-[1.5rem] text-[#064E3B] text-xs font-bold appearance-none focus:bg-white/90 outline-none">
                    {Object.keys(CITY_COORDINATES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-4 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] text-white bg-gradient-to-r from-[#065F46] to-[#059669] shadow-lg disabled:opacity-50">
                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Complete Enrollment <ArrowRight size={16} /></>}
              </motion.button>
              
              <div className="text-center pt-2">
                <Link to="/login" className="text-[10px] text-[#064E3B] font-bold underline decoration-[#00F59B] decoration-2 underline-offset-4 uppercase tracking-widest">Already Verified? Log In</Link>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: LOCATION PICKER */}
          <div className="flex flex-col h-full bg-white/20 rounded-[2.5rem] p-4 border border-white/40 overflow-hidden min-h-[400px]">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-xs font-black text-[#064E3B] uppercase tracking-widest flex items-center gap-2">
                <LocateFixed size={14} className="text-[#059669]" /> Pick Your Location
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setShowManual(!showManual)} className={`p-2 rounded-lg transition-colors ${showManual ? 'bg-[#00F59B] text-white' : 'bg-white/60 text-[#064E3B]'}`} title="Type Manually"><Keyboard size={14} /></button>
                <button onClick={useCurrentLocation} className="p-2 bg-white/60 text-[#064E3B] rounded-lg hover:bg-[#00F59B] hover:text-white transition-colors" title="Use My Location"><LocateFixed size={14} /></button>
              </div>
            </div>

            <div className="flex-1 relative rounded-[2rem] overflow-hidden border border-white/60 shadow-inner group">
              <MapContainer center={location} zoom={12} style={{ height: '100%', width: '100%' }} className="z-0">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ChangeView center={location} />
                <LocationPicker onLocationPick={(coords) => {
                  setLocation(coords);
                  setManualCoords({ lat: coords[0].toFixed(6), lng: coords[1].toFixed(6) });
                }} />
                <Marker position={location} />
              </MapContainer>
              
              <AnimatePresence>
                {showManual && (
                  <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="absolute right-4 top-4 bottom-4 w-32 bg-white/90 backdrop-blur-md p-4 rounded-[1.5rem] shadow-xl z-[1000] flex flex-col gap-4 border border-white">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-[#065F46] uppercase">Latitude</label>
                      <input name="lat" type="text" value={manualCoords.lat} onChange={handleManualChange} className="w-full p-2 bg-white border rounded-lg text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-[#065F46] uppercase">Longitude</label>
                      <input name="lng" type="text" value={manualCoords.lng} onChange={handleManualChange} className="w-full p-2 bg-white border rounded-lg text-xs" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <p className="mt-3 text-[9px] text-center font-bold text-[#065F46]/60 leading-tight p-2">
              Pinpoint your base location. This will be used to calibrate your city-specific logistics dashboard.
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Register;