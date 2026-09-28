import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar as CalendarIcon, CheckCircle, Clock, MapPin, Truck, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const DriverHistory = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const fetchHistory = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('http://localhost:5000/api/complaints', config);
            
            const myJobs = data.filter(c => c.assignedDriver?._id === user?._id || c.assignedDriver === user?._id);
            setComplaints(myJobs);
        } catch (error) {
            console.error("Error fetching tasks", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 15000);
        return () => clearInterval(interval);
    }, [user?._id]);

    // Calendar Helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);
    const daysArray = [...Array(days).keys()].map(i => i + 1);
    const emptySlots = Array(firstDay).fill(null);

    const isSelected = (day) => {
        return selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentMonth.getMonth() &&
            selectedDate.getFullYear() === currentMonth.getFullYear();
    };

    const isToday = (day) => {
        const today = new Date();
        return today.getDate() === day &&
            today.getMonth() === currentMonth.getMonth() &&
            today.getFullYear() === currentMonth.getFullYear();
    };

    const changeMonth = (offset) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    };

    const getTasksForDate = (date) => {
        return complaints.filter(c => {
            const taskDate = new Date(c.createdAt);
            return taskDate.getDate() === date.getDate() &&
                   taskDate.getMonth() === date.getMonth() &&
                   taskDate.getFullYear() === date.getFullYear();
        });
    };

    const dailyTasks = getTasksForDate(selectedDate);
    const pendingTasks = dailyTasks.filter(c => c.status !== 'resolved' && c.status !== 'rejected');
    const completedTasks = dailyTasks.filter(c => c.status === 'resolved');

    // Aggregate weekly analytics
    const getWeeklyStats = () => {
        const stats = { Mon: {c:0, p:0}, Tue: {c:0, p:0}, Wed: {c:0, p:0}, Thu: {c:0, p:0}, Fri: {c:0, p:0}, Sat: {c:0, p:0}, Sun: {c:0, p:0} };
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        complaints.forEach(task => {
            const tDate = new Date(task.createdAt);
            if (tDate > oneWeekAgo) {
                const dayName = tDate.toLocaleDateString('en-US', { weekday: 'short' });
                if (stats[dayName]) {
                    if (task.status === 'resolved') stats[dayName].c++;
                    else if (task.status !== 'rejected') stats[dayName].p++;
                }
            }
        });
        return Object.keys(stats).map(day => ({ name: day, collected: stats[day].c, pending: stats[day].p }));
    };
    const weeklyStats = getWeeklyStats();
    const averageRating = user?.ratingSum && user?.totalRatings ? (user.ratingSum / user.totalRatings).toFixed(1) : "5.0";

    return (
        <div className="space-y-6">

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 flex items-center justify-between transition-all hover:scale-[1.02]">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Collections Done</p>
                        <h3 className="text-3xl font-bold text-primary">{completedTasks.length} / {dailyTasks.length}</h3>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                        <CheckCircle size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 flex items-center justify-between transition-all hover:scale-[1.02]">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pending Output</p>
                        <h3 className="text-3xl font-bold text-orange-500">{pendingTasks.length}</h3>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400">
                        <Truck size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 flex items-center justify-between transition-all hover:scale-[1.02]">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Service Rating</p>
                        <h3 className="text-3xl font-bold text-blue-500">
                            ★ {averageRating}
                        </h3>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                        <Clock size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col: Calendar & List */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Daily Tasks List */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                            <Truck size={20} className="text-primary" />
                            Task List: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h3>

                        {dailyTasks.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                No collections scheduled for this date.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {dailyTasks.map(task => (
                                    <div key={task._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded border dark:border-gray-600 transition hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${task.status === 'resolved' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <div>
                                                <h4 className="font-semibold text-gray-800 dark:text-gray-200">{task.locationName || 'Vector Sector'}</h4>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <MapPin size={12} /> {task.location?.lat.toFixed(4)}, {task.location?.lng.toFixed(4)}
                                                </div>
                                                {task.driverRating && (
                                                    <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                                                        {'★'.repeat(task.driverRating)} <span className="text-gray-400 ml-1">("{task.driverFeedback || 'Good Job'}")</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {task.status === 'resolved' ? (
                                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">Collected</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-full uppercase">{task.status}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Analytics Graph */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 transition-all">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Weekly Performance</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    />
                                    <Bar dataKey="collected" name="Collected" fill="#10B981" stackId="a" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="pending" name="Missed/Pending" fill="#EF4444" stackId="a" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* Right Col: Calendar */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 h-fit transition-all">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                            <CalendarIcon size={20} className="text-primary" />
                            Calendar
                        </h3>
                        <div className="flex gap-2 dark:text-gray-300">
                            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"><ChevronLeft size={20} /></button>
                            <span className="font-medium text-sm">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 mb-2">
                        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {emptySlots.map((_, i) => <div key={`empty-${i}`}></div>)}
                        {daysArray.map(day => (
                            <button
                                key={day}
                                onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                                className={`
                                    h-10 w-full rounded-lg flex flex-col items-center justify-center text-sm font-medium transition
                                    ${isSelected(day) ? 'bg-primary text-white shadow-md' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}
                                    ${isToday(day) && !isSelected(day) ? 'border border-primary text-primary' : ''}
                                `}
                            >
                                {day}
                                {/* Dot for activity */}
                                <span className={`block w-1 h-1 rounded-full mt-1 ${Math.random() > 0.3 ? 'bg-green-400' : 'bg-transparent'} ${isSelected(day) ? 'bg-white' : ''}`}></span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t dark:border-gray-700">
                        <h4 className="text-sm font-bold mb-3 dark:text-white">Legend</h4>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div> <span>Collection Completed</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div> <span>Pending / Issue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-white dark:bg-gray-800 border border-primary"></div> <span>Today</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DriverHistory;
