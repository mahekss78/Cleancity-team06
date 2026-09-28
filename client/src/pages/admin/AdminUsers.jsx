import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Users, Search, User, Briefcase, Calendar, MapPin, Mail, Shield } from 'lucide-react';

const AdminUsers = () => {
    const { user } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('residents'); // 'residents' or 'drivers'
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get('http://localhost:5000/api/users', config);
                setAllUsers(data);
            } catch (error) {
                console.error("Error fetching users", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const drivers = allUsers.filter(u => u.role === 'driver');
    const residents = allUsers.filter(u => u.role === 'resident');

    const getFilteredList = () => {
        const list = activeTab === 'residents' ? residents : drivers;
        return list.filter(u =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const displayList = getFilteredList();

    return (
        <div className="space-y-6">

            {/* Header stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Total Users</p>
                        <h3 className="text-3xl font-bold dark:text-white">{allUsers.length}</h3>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                        <Users size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Residents</p>
                        <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">{residents.length}</h3>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                        <User size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Drivers</p>
                        <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400">{drivers.length}</h3>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                        <Briefcase size={24} />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                        <h3 className="text-xl font-bold dark:text-white">User Directory</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary outline-none w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('residents')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'residents'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            <User size={16} /> Residents ({residents.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('drivers')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'drivers'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            <Briefcase size={16} /> Drivers ({drivers.length})
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                            <tr>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">User Details</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">Contact</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">Joined</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">{activeTab === 'residents' ? 'Address / Location' : 'Role Info'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading directory...</td></tr>
                            ) : displayList.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No users found.</td></tr>
                            ) : (
                                displayList.map(item => (
                                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-200 font-bold">
                                                    {item.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${item.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                            item.role === 'driver' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                'bg-green-50 text-green-700 border-green-200'
                                                        }`}>{item.role}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <Mail size={16} /> {item.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <Calendar size={16} /> {new Date(item.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                {activeTab === 'residents' ? (
                                                    item.address ? (
                                                        <><MapPin size={16} /> {item.address}</>
                                                    ) : <span className="text-gray-400 italic">No address set</span>
                                                ) : (
                                                    <><Shield size={16} /> Verified Driver</>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
