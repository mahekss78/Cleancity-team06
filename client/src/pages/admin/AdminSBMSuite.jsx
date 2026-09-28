import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Search, Download, Building2, MapPin, TrendingUp,
  Star, Crown, Trophy, Medal, ChevronDown, ArrowUpDown,
  CheckCircle, Sparkles, BarChart3, Users, Shield, Leaf,
  ChevronRight, ExternalLink, Zap, Target, Percent
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const API = 'http://localhost:5000/api/sbm';

// ─── Circular Progress Component ───
const CircularProgress = ({ value, label, color, size = 90 }) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth="6" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black italic text-slate-800">{value}%</span>
        </div>
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center leading-tight max-w-[80px]">{label}</span>
    </div>
  );
};

// ─── GFC Badge ───
const GFCBadge = ({ status }) => {
  const colors = {
    '5-Star': 'bg-amber-100 text-amber-700 border-amber-200',
    '3-Star': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    '1-Star': 'bg-blue-100 text-blue-700 border-blue-200',
    'Non-rated': 'bg-slate-100 text-slate-500 border-slate-200'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${colors[status] || colors['Non-rated']}`}>
      {status === '5-Star' && '★★★★★'}
      {status === '3-Star' && '★★★'}
      {status === '1-Star' && '★'}
      {status === 'Non-rated' && '—'} {status}
    </span>
  );
};

// ─── Medal Component ───
const RankMedal = ({ rank }) => {
  if (rank === 1) return <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-200"><Crown size={22} className="text-white" /></div>;
  if (rank === 2) return <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg shadow-slate-200"><Trophy size={22} className="text-white" /></div>;
  if (rank === 3) return <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-200"><Medal size={22} className="text-white" /></div>;
  return <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200"><span className="text-lg font-black italic text-slate-400">#{rank}</span></div>;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AdminSBMSuite = () => {
  const [activeTab, setActiveTab] = useState('reportCard');
  const [geoData, setGeoData] = useState({});
  const [loading, setLoading] = useState(false);

  // Report Card state
  const [rcState, setRcState] = useState('');
  const [rcCity, setRcCity] = useState('');
  const [reportCard, setReportCard] = useState(null);

  // State Performance state
  const [spState, setSpState] = useState('');
  const [statePerf, setStatePerf] = useState(null);
  const [sortCol, setSortCol] = useState('stateRank');
  const [sortDir, setSortDir] = useState('asc');

  // Awards state
  const [awards, setAwards] = useState([]);

  const reportRef = useRef(null);

  // Load geography on mount
  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const res = await axios.get(`${API}/geography`);
        setGeoData(res.data);
        const firstState = Object.keys(res.data)[0];
        if (firstState) {
          setRcState(firstState);
          setSpState(firstState);
          setRcCity(res.data[firstState][0] || '');
        }
      } catch (err) { console.error('Geo fetch failed:', err); }
    };
    fetchGeo();
  }, []);

  // Fetch report card
  const fetchReportCard = async () => {
    if (!rcState || !rcCity) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/city-report?state=${encodeURIComponent(rcState)}&city=${encodeURIComponent(rcCity)}`);
      setReportCard(res.data);
    } catch (err) {
      console.error('Report card fetch failed:', err);
      setReportCard(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (rcState && rcCity) fetchReportCard(); }, [rcState, rcCity]);

  // Fetch state performance
  const fetchStatePerf = async () => {
    if (!spState) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/state/${encodeURIComponent(spState)}`);
      setStatePerf(res.data);
    } catch (err) {
      console.error('State perf fetch failed:', err);
      setStatePerf(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (spState) fetchStatePerf(); }, [spState]);

  // Fetch awards
  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const res = await axios.get(`${API}/awards`);
        setAwards(res.data);
      } catch (err) { console.error('Awards fetch failed:', err); }
    };
    fetchAwards();
  }, []);

  // Sort handler for state table
  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sortedULBs = statePerf?.ulbs ? [...statePerf.ulbs].sort((a, b) => {
    const av = a[sortCol], bv = b[sortCol];
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? av - bv : bv - av;
  }) : [];

  // PDF Generator
  const generatePDF = () => {
    if (!reportCard) return;
    try {
      const doc = new jsPDF('p', 'mm', 'a4');

      // Header gradient bar
      doc.setFillColor(6, 78, 59);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setFillColor(0, 168, 107);
      doc.rect(0, 35, 210, 5, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('CleanCity Analytics 2026', 105, 18, { align: 'center' });
      doc.setFontSize(10);
      doc.text('City Report Card — CleanCity Analytics', 105, 28, { align: 'center' });

      // City info
      doc.setTextColor(6, 78, 59);
      doc.setFontSize(18);
      doc.text(`${reportCard.name}, ${reportCard.state}`, 15, 55);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Population: ${reportCard.population?.toLocaleString()} | GFC Status: ${reportCard.gfcStatus}`, 15, 63);

      // Rankings
      doc.setFontSize(12);
      doc.setTextColor(6, 78, 59);
      doc.text('Rankings', 15, 78);
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`National Rank: #${reportCard.nationalRank}`, 15, 86);
      doc.text(`State Rank: #${reportCard.stateRank}`, 75, 86);
      doc.text(`State: ${reportCard.state} (${reportCard.totalULBsInState} ULBs)`, 135, 86);

      // Metrics table
      autoTable(doc, {
        startY: 95,
        head: [['Metric', 'Score (%)', 'Rating']],
        body: [
          ['Door-to-Door Collection', `${reportCard.d2d}%`, reportCard.d2d >= 95 ? 'Excellent' : reportCard.d2d >= 85 ? 'Good' : 'Needs Work'],
          ['Source Segregation', `${reportCard.segregation}%`, reportCard.segregation >= 90 ? 'Excellent' : reportCard.segregation >= 80 ? 'Good' : 'Needs Work'],
          ['Waste Processing', `${reportCard.processing}%`, reportCard.processing >= 90 ? 'Excellent' : reportCard.processing >= 80 ? 'Good' : 'Needs Work'],
          ['Public Toilet Cleanliness', `${reportCard.publicToilet}%`, reportCard.publicToilet >= 90 ? 'Excellent' : reportCard.publicToilet >= 80 ? 'Good' : 'Needs Work'],
          ['CT/PT Capacity', `${reportCard.ctCapacity}%`, reportCard.ctCapacity >= 90 ? 'Excellent' : reportCard.ctCapacity >= 75 ? 'Good' : 'Needs Work'],
          ['Waste Reduction', `${reportCard.wasteReduction}%`, reportCard.wasteReduction >= 85 ? 'Excellent' : reportCard.wasteReduction >= 70 ? 'Good' : 'Needs Work'],
        ],
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [6, 78, 59], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        theme: 'grid'
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFillColor(6, 78, 59);
      doc.rect(0, pageHeight - 20, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Generated by CleanCity Analytics Platform', 105, pageHeight - 10, { align: 'center' });

      doc.save(`SBM_Report_${reportCard.name}_${reportCard.state}_2026.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
    }
  };

  // ─── Tab Definitions ───
  const tabs = [
    { id: 'reportCard', label: 'City Report Card', icon: Building2 },
    { id: 'statePerf', label: 'State Performance', icon: BarChart3 },
    { id: 'awards', label: '2026 Awards', icon: Award },
  ];

  return (
    <div className="space-y-8 p-4 lg:p-10 max-w-[1600px] mx-auto min-h-screen">

      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-[2rem] shadow-2xl shadow-emerald-200">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-[#064E3B] uppercase tracking-tighter italic leading-none">
              SBM Analytics Suite
            </h2>

          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white rounded-[2rem] shadow-xl border border-slate-100 p-1.5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                ? 'bg-[#064E3B] text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <AnimatePresence mode="wait">
        {/* ━━━━━━ TAB 1: CITY REPORT CARD ━━━━━━ */}
        {activeTab === 'reportCard' && (
          <motion.div
            key="reportCard"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Search Bar */}
            <div className="bg-white p-6 rounded-[3rem] shadow-xl border border-slate-100">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex-1 min-w-[200px]">
                  <MapPin size={16} className="text-emerald-500 shrink-0" />
                  <select
                    value={rcState}
                    onChange={(e) => {
                      setRcState(e.target.value);
                      setRcCity(geoData[e.target.value]?.[0] || '');
                    }}
                    className="bg-transparent w-full text-sm font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="">Select State</option>
                    {Object.keys(geoData).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <ChevronRight size={16} className="text-slate-300 hidden sm:block" />
                <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex-1 min-w-[200px]">
                  <Building2 size={16} className="text-indigo-500 shrink-0" />
                  <select
                    value={rcCity}
                    onChange={(e) => setRcCity(e.target.value)}
                    className="bg-transparent w-full text-sm font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="">Select City / ULB</option>
                    {geoData[rcState]?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchReportCard}
                  className="px-8 py-3.5 bg-[#064E3B] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-800 transition-all flex items-center gap-2"
                >
                  <Search size={14} /> Generate
                </motion.button>
              </div>
            </div>

            {/* Report Card Result */}
            {reportCard && (
              <motion.div
                ref={reportRef}
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Rankings Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-[#064E3B] to-emerald-800 p-8 rounded-[2.5rem] text-white shadow-2xl">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">National Rank</p>
                    <p className="text-5xl font-black italic tracking-tighter">#{reportCard.nationalRank}</p>
                    <p className="text-[10px] mt-3 opacity-50">out of 4,800+ ULBs nationwide</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">State Rank</p>
                    <p className="text-5xl font-black italic tracking-tighter text-[#064E3B]">#{reportCard.stateRank}</p>
                    <p className="text-[10px] mt-3 text-slate-400">of {reportCard.totalULBsInState} ULBs in {reportCard.state}</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">GFC Certification</p>
                      <div className="mt-2"><GFCBadge status={reportCard.gfcStatus} /></div>
                    </div>
                    <p className="text-[10px] mt-3 text-slate-400">Pop: {reportCard.population?.toLocaleString()}</p>
                  </div>
                </div>

                {/* 8 Metric Rings */}
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Target size={18} /></div>
                      <h3 className="text-xl font-black text-[#064E3B] uppercase italic tracking-tighter">Performance Metrics</h3>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={generatePDF}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      <Download size={12} /> Download PDF
                    </motion.button>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-6 justify-items-center">
                    <CircularProgress value={reportCard.d2d} label="D2D Collection" color="#059669" />
                    <CircularProgress value={reportCard.segregation} label="Segregation" color="#6366F1" />
                    <CircularProgress value={reportCard.processing} label="Processing" color="#F59E0B" />
                    <CircularProgress value={reportCard.publicToilet} label="Public Toilet" color="#EF4444" />
                    <CircularProgress value={reportCard.ctCapacity} label="CT/PT Capacity" color="#8B5CF6" />
                    <CircularProgress value={reportCard.wasteReduction} label="Waste Reduction" color="#06B6D4" />
                    <CircularProgress value={Math.round((reportCard.d2d + reportCard.segregation + reportCard.processing) / 3)} label="Composite Score" color="#064E3B" />
                    <CircularProgress value={reportCard.gfcStatus === '5-Star' ? 100 : reportCard.gfcStatus === '3-Star' ? 75 : reportCard.gfcStatus === '1-Star' ? 50 : 25} label="GFC Index" color="#D97706" />
                  </div>
                </div>

                {/* Bar Chart Comparison */}
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                  <h3 className="text-lg font-black text-[#064E3B] uppercase italic tracking-tighter mb-6">Metric Breakdown</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { metric: 'D2D', value: reportCard.d2d, fill: '#059669' },
                        { metric: 'Segregation', value: reportCard.segregation, fill: '#6366F1' },
                        { metric: 'Processing', value: reportCard.processing, fill: '#F59E0B' },
                        { metric: 'Toilet', value: reportCard.publicToilet, fill: '#EF4444' },
                        { metric: 'CT/PT', value: reportCard.ctCapacity, fill: '#8B5CF6' },
                        { metric: 'Reduction', value: reportCard.wasteReduction, fill: '#06B6D4' },
                      ]} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700 }} />
                        <YAxis type="category" dataKey="metric" tick={{ fontSize: 10, fontWeight: 900 }} width={80} />
                        <Tooltip
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                          formatter={(val) => [`${val}%`, 'Score']}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                          {[
                            { fill: '#059669' }, { fill: '#6366F1' }, { fill: '#F59E0B' },
                            { fill: '#EF4444' }, { fill: '#8B5CF6' }, { fill: '#06B6D4' }
                          ].map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {!reportCard && !loading && (
              <div className="bg-white p-20 rounded-[3rem] shadow-xl border border-slate-100 text-center">
                <Building2 size={48} className="text-slate-200 mx-auto mb-4" />
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Select a State and City to generate the Report Card</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ━━━━━━ TAB 2: STATE PERFORMANCE ━━━━━━ */}
        {activeTab === 'statePerf' && (
          <motion.div
            key="statePerf"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* State Selector */}
            <div className="bg-white p-6 rounded-[3rem] shadow-xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex-1">
                  <MapPin size={16} className="text-emerald-500" />
                  <select
                    value={spState}
                    onChange={(e) => setSpState(e.target.value)}
                    className="bg-transparent w-full text-sm font-bold focus:outline-none cursor-pointer"
                  >
                    {Object.keys(geoData).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {statePerf && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/10 rounded-2xl border border-white/20"><Building2 size={18} /></div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total ULBs</p>
                    </div>
                    <p className="text-4xl font-black italic tracking-tighter">{statePerf.totalULBs}</p>
                    <p className="text-[10px] mt-2 opacity-50">Urban Local Bodies in {statePerf.name}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/10 rounded-2xl border border-white/20"><Percent size={18} /></div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Avg D2D Coverage</p>
                    </div>
                    <p className="text-4xl font-black italic tracking-tighter">{statePerf.avgD2D}%</p>
                    <p className="text-[10px] mt-2 opacity-50">Door-to-Door Collection Average</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-amber-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/10 rounded-2xl border border-white/20"><CheckCircle size={18} /></div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">ODF++ Certified</p>
                    </div>
                    <p className="text-4xl font-black italic tracking-tighter">{statePerf.odfPlusCities}</p>
                    <p className="text-[10px] mt-2 opacity-50">Cities with ODF++ status</p>
                  </div>
                </div>

                {/* Sortable Table */}
                <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
                  <div className="p-8 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><BarChart3 size={18} /></div>
                      <h3 className="text-xl font-black text-[#064E3B] uppercase italic tracking-tighter">ULB Performance Table</h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {[
                            { key: 'name', label: 'ULB Name' },
                            { key: 'population', label: 'Population' },
                            { key: 'd2d', label: '% D2D' },
                            { key: 'segregation', label: '% Segregation' },
                            { key: 'processing', label: '% Processing' },
                            { key: 'gfcStatus', label: 'GFC Status' },
                            { key: 'stateRank', label: 'State Rank' },
                          ].map(col => (
                            <th
                              key={col.key}
                              onClick={() => handleSort(col.key)}
                              className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-600 transition-colors whitespace-nowrap"
                            >
                              <div className="flex items-center gap-1.5">
                                {col.label}
                                <ArrowUpDown size={10} className={sortCol === col.key ? 'text-indigo-500' : 'text-slate-300'} />
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedULBs.map((ulb, i) => (
                          <motion.tr
                            key={ulb.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors group"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px] font-black">{ulb.stateRank}</div>
                                <span className="text-sm font-bold text-slate-800">{ulb.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-sm text-slate-600 font-medium">{ulb.population?.toLocaleString()}</td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${ulb.d2d}%` }} transition={{ duration: 0.8 }} className="h-full bg-emerald-500 rounded-full" />
                                </div>
                                <span className="text-sm font-black text-slate-700">{ulb.d2d}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${ulb.segregation}%` }} transition={{ duration: 0.8 }} className="h-full bg-indigo-500 rounded-full" />
                                </div>
                                <span className="text-sm font-black text-slate-700">{ulb.segregation}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${ulb.processing}%` }} transition={{ duration: 0.8 }} className="h-full bg-amber-500 rounded-full" />
                                </div>
                                <span className="text-sm font-black text-slate-700">{ulb.processing}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-5"><GFCBadge status={ulb.gfcStatus} /></td>
                            <td className="px-6 py-5 text-center">
                              <span className="text-lg font-black italic text-[#064E3B]">#{ulb.stateRank}</span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ━━━━━━ TAB 3: 2026 AWARDS SHOWCASE ━━━━━━ */}
        {activeTab === 'awards' && (
          <motion.div
            key="awards"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Hall of Fame Header */}
            <div className="bg-gradient-to-br from-[#064E3B] via-emerald-800 to-teal-900 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10 text-center">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="inline-block mb-4"
                >
                  <Trophy size={48} className="text-amber-400" />
                </motion.div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">
                  Hall of Fame 2026
                </h2>
                <p className="text-[11px] font-medium opacity-60 uppercase tracking-widest">
                  CleanCity National Award Winners — India's Cleanest Cities
                </p>
              </div>
              <div className="absolute -top-20 -left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
            </div>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {awards.slice(0, 3).map((winner, i) => {
                const bgColors = [
                  'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200',
                  'bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200',
                  'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
                ];
                const glowColors = ['shadow-amber-100', 'shadow-slate-100', 'shadow-orange-100'];

                return (
                  <motion.div
                    key={winner.rank}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className={`p-8 rounded-[2.5rem] border-2 shadow-2xl ${bgColors[i]} ${glowColors[i]} relative overflow-hidden`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <RankMedal rank={winner.rank} />
                      <GFCBadge status={winner.gfcStatus} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-tight mb-1">{winner.city}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{winner.state}</p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">D2D</p>
                        <p className="text-lg font-black italic text-emerald-600">{winner.d2d}%</p>
                      </div>
                      <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Segregation</p>
                        <p className="text-lg font-black italic text-indigo-600">{winner.segregation}%</p>
                      </div>
                      <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Processing</p>
                        <p className="text-lg font-black italic text-amber-600">{winner.processing}%</p>
                      </div>
                      <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Toilet</p>
                        <p className="text-lg font-black italic text-red-500">{winner.publicToilet}%</p>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">"{winner.highlight}"</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Remaining Rankings (4–10) */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Star size={18} /></div>
                  <h3 className="text-xl font-black text-[#064E3B] uppercase italic tracking-tighter">National Leaders #4 — #10</h3>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {awards.slice(3).map((winner, i) => (
                  <motion.div
                    key={winner.rank}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (i * 0.05) }}
                    className="flex items-center justify-between px-8 py-6 hover:bg-emerald-50/30 transition-colors group"
                  >
                    <div className="flex items-center gap-5">
                      <RankMedal rank={winner.rank} />
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{winner.city}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{winner.state} — Pop: {winner.population?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">D2D</p>
                        <p className="text-sm font-black text-emerald-600">{winner.d2d}%</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Segregation</p>
                        <p className="text-sm font-black text-indigo-600">{winner.segregation}%</p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Processing</p>
                        <p className="text-sm font-black text-amber-600">{winner.processing}%</p>
                      </div>
                      <GFCBadge status={winner.gfcStatus} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSBMSuite;
