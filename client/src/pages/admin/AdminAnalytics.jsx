import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';
import { PieChart, TrendingUp, Lightbulb, Activity, CheckCircle, AlertCircle } from 'lucide-react';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#94A3B8'];

const AdminAnalytics = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchComplaints = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('http://localhost:5000/api/complaints', config);
            setComplaints(data);
        } catch (error) {
            console.error("Analytics fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    // 1. PROCESS WEEKLY CLEANUP INDEX (Last 7 Days)
    const weeklyIndex = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const stats = days.map(day => ({ name: day, resolved: 0, total: 0, index: 0 }));
        
        const now = new Date();
        const last7Days = complaints.filter(c => {
            const date = new Date(c.createdAt);
            const diff = (now - date) / (1000 * 60 * 60 * 24);
            return diff <= 7;
        });

        last7Days.forEach(c => {
            const dayName = days[new Date(c.createdAt).getDay()];
            const dayStat = stats.find(s => s.name === dayName);
            if (dayStat) {
                dayStat.total++;
                if (c.status === 'resolved') dayStat.resolved++;
            }
        });

        // Calculate index (Percentage of resolution)
        return stats.map(s => ({
            ...s,
            index: s.total > 0 ? Math.round((s.resolved / s.total) * 100) : 0
        }));
    }, [complaints]);

    // 2. PROCESS WASTE TYPE DISTRIBUTION
    const wasteDistribution = useMemo(() => {
        const counts = {};
        complaints.filter(c => c.status === 'resolved' && c.wasteSummary).forEach(c => {
            const cat = c.wasteSummary.category || 'Unknown';
            counts[cat] = (counts[cat] || 0) + 1;
        });

        return Object.entries(counts).map(([type, count]) => ({
            name: type,
            value: count,
            percentage: Math.round((count / (complaints.filter(c=>c.status==='resolved').length || 1)) * 100) || 0
        })).sort((a, b) => b.value - a.value);
    }, [complaints]);

    // 3. GENERATE DYNAMIC STRATEGY SUGGESTIONS
    const strategy = useMemo(() => {
        if (wasteDistribution.length === 0) return { title: "Insufficient Data", advice: "Awaiting more resolved incidents to generate sector strategy." };
        
        const top = wasteDistribution[0].name;
        if (top.includes('Plastic')) return { 
            title: "Recycling Surge Detected", 
            advice: "Increase blue-bin deployment in Nagpur East and schedule a recycling awareness drive.",
            icon: <CheckCircle className="text-blue-500" />
        };
        if (top.includes('Organic')) return { 
            title: "Bio-Waste Accumulation", 
            advice: "Daily collection required for wet waste to prevent odor escalation in residential zones.",
            icon: <Activity className="text-emerald-500" />
        };
        if (top.includes('E-Waste')) return { 
            title: "Toxin Alert", 
            advice: "Dispatch specialized hazardous waste units. Resident guidance on electronic disposal needed.",
            icon: <AlertCircle className="text-amber-500" />
        };
        return { 
            title: "Stable Optimization", 
            advice: "Continue current dispatch frequency. Sector load is balanced.",
            icon: <TrendingUp className="text-slate-500" />
        };
    }, [wasteDistribution]);

    if (loading) return <div className="p-20 text-center font-black uppercase tracking-widest text-slate-300">Loading Intelligence...</div>;

    return (
        <div className="space-y-8 p-4 lg:p-8 max-w-[1600px] mx-auto">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-[#064E3B] text-white rounded-[2rem] shadow-xl shadow-emerald-100 italic">
                        <PieChart size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-[#064E3B] uppercase tracking-tighter italic leading-none">Intelligence Engine</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Data-driven sector optimization & analytics</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white px-8 py-4 rounded-[2rem] border border-gray-100 shadow-sm text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Signals</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter italic leading-none">{complaints.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Weekly Cleanup Index Bar Chart */}
                <div className="xl:col-span-2 bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-50 overflow-hidden">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="text-xl font-black text-[#064E3B] uppercase italic tracking-tighter">Weekly Cleanup Index</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Resolution efficiency percentage by day</p>
                        </div>
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Live Metric</div>
                    </div>
                    
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyIndex} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#64748B'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#64748B'}} tickFormatter={(value) => `${value}%`} />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9', radius: 10 }}
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}
                                />
                                <Bar dataKey="index" radius={[10, 10, 0, 0]}>
                                    {weeklyIndex.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.index > 75 ? '#10B981' : entry.index > 40 ? '#6366F1' : '#F43F5E'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI STRATEGY PANEL */}
                <div className="bg-[#064E3B] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="relative z-10 flex-1">
                        <div className="p-4 bg-white/10 rounded-3xl inline-block mb-6 border border-white/20">
                            <Lightbulb size={32} className="text-amber-400" />
                        </div>
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Strategy Room</h3>
                        <p className="text-[10px] font-medium opacity-50 uppercase tracking-widest mb-10 leading-loose">Automated administrative recommendations based on collection trends.</p>
                        
                        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-4 shadow-inner">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    {strategy.icon}
                                </div>
                                <h4 className="text-sm font-black uppercase tracking-tight">{strategy.title}</h4>
                            </div>
                            <p className="text-[11px] font-medium leading-relaxed opacity-80 uppercase tracking-wide italic">" {strategy.advice} "</p>
                        </div>
                    </div>
                    {/* Decorative Background Element */}
                    <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. PIE CHART DISTRIBUTION */}
                <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-gray-50 flex flex-col">
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-[#064E3B] uppercase italic tracking-tighter">Proportional Load</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Waste category sharing ratio</p>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={wasteDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {wasteDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}
                                />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-6 justify-center">
                        {wasteDistribution.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-[9px] font-black uppercase text-slate-500">{item.name} ({item.percentage}%)</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. NUMERIC BREAKDOWN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {wasteDistribution.map((item, index) => (
                        <div key={index} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] + '20', border: `1px solid ${COLORS[index % COLORS.length]}40` }}></div>
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            </div>
                            <p className="text-lg font-black text-slate-800 uppercase tracking-tighter">{item.name}</p>
                            <div className="flex items-end justify-between">
                                <p className="text-3xl font-black italic tracking-tighter text-[#064E3B] leading-none">{item.value}<span className="text-[10px] uppercase ml-1 opacity-40">Resolved</span></p>
                                <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{item.percentage}%</p>
                            </div>
                        </div>
                    ))}
                    {wasteDistribution.length === 0 && (
                        <div className="col-span-full py-10 text-center text-[10px] font-black uppercase tracking-widest text-slate-300 italic border border-dashed rounded-3xl">Waiting for detailed cleanup reports...</div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default AdminAnalytics;
