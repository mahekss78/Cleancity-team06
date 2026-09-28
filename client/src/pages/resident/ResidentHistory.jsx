import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle, Circle, Trash2 } from 'lucide-react';

const ResidentHistory = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get('http://localhost:5000/api/complaints/my', config);
                // Sort by date descending
                setComplaints(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            } catch (err) {
                setError('Failed to load history.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchHistory();
        }
    }, [user]);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`http://localhost:5000/api/complaints/${id}`, config);
                setComplaints(complaints.filter((complaint) => complaint._id !== id));
            } catch (error) {
                console.error('Error deleting complaint:', error);
                alert('Failed to delete report');
            }
        }
    };

    if (loading) return <div className="text-center p-10">Loading history...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clock className="text-primary" />
                My Complaints History
            </h2>

            {error && <div className="p-4 bg-red-100 text-red-700 rounded mb-4">{error}</div>}

            {complaints.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-lg shadow border border-dashed border-gray-300">
                    <AlertCircle className="mx-auto text-gray-300 mb-2" size={48} />
                    <p className="text-gray-500 text-lg">No reports filed yet.</p>
                    <p className="text-gray-400 text-sm mt-1">Issues reported from the dashboard will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {complaints.map((complaint) => (
                        <div key={complaint._id} className="bg-white rounded-lg shadow border p-5 transition hover:shadow-md relative">
                            {/* Delete Button */}
                            {complaint.status === 'pending' && (
                                <button
                                    onClick={() => handleDelete(complaint._id)}
                                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition"
                                    title="Delete Report"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}

                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(complaint.status)}`}>
                                            {complaint.status}
                                        </span>
                                        <div className="flex items-center text-xs text-gray-400 gap-1">
                                            <Calendar size={12} />
                                            <span>{formatDate(complaint.createdAt)}</span>
                                            <span className="mx-1">•</span>
                                            <Clock size={12} />
                                            <span>{formatTime(complaint.createdAt)}</span>
                                        </div>
                                    </div>

                                    <h3 className="font-semibold text-lg text-gray-800 mb-1 pr-10">{complaint.description}</h3>

                                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                                        <MapPin size={14} />
                                        <span>{complaint.locationName || 'Unknown Location'}</span>
                                    </div>

                                    {complaint.adminComment && (
                                        <div className="mt-3 bg-gray-50 p-3 rounded border border-gray-100 text-sm">
                                            <span className="font-bold text-gray-700">Admin Response:</span> <span className="text-gray-600">{complaint.adminComment}</span>
                                        </div>
                                    )}
                                </div>

                                {complaint.imageUrl && (
                                    <div className="w-full md:w-32 h-32 flex-shrink-0 bg-gray-100 rounded overflow-hidden border">
                                        <img src={complaint.imageUrl} alt="Issue" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResidentHistory;
