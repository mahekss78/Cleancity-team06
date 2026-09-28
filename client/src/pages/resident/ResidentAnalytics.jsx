import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { PieChart } from 'lucide-react';

const ResidentAnalytics = () => {
    // Mock Data for Waste Volume by Type
    const wasteData = [
        { type: 'General Waste', volume: 45.2 },
        { type: 'Recycling', volume: 28.5 },
        { type: 'Organic', volume: 15.7 },
    ];

    const totalVolume = wasteData.reduce((acc, curr) => acc + curr.volume, 0);

    // Mock Data for Monthly Collection Rate
    const collectionData = [
        { name: 'Jan', rate: 94 },
        { name: 'Feb', rate: 95 },
        { name: 'Mar', rate: 92 },
        { name: 'Apr', rate: 96 },
        { name: 'May', rate: 97 },
        { name: 'Jun', rate: 98 },
        { name: 'Jul', rate: 97 },
    ];

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
                <PieChart size={32} className="text-primary" />
                <h2 className="text-2xl font-bold text-gray-800">Community Analytics</h2>
            </div>

            {/* Monthly Collection Rate Chart */}
            <div className="bg-white p-6 rounded-lg shadow border">
                <h3 className="text-xl font-bold mb-1">Monthly Collection Rate</h3>
                <p className="text-gray-500 text-sm mb-6">Performance over the last 7 months.</p>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={collectionData} barSize={60}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar dataKey="rate" fill="#10B981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Waste Volume by Type Table */}
            <div className="bg-white p-6 rounded-lg shadow border">
                <h3 className="text-xl font-bold mb-1">Waste Volume by Type</h3>
                <p className="text-gray-500 text-sm mb-6">Total tons collected this month.</p>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="py-3 text-gray-500 font-medium text-sm">Waste Type</th>
                                <th className="py-3 text-gray-500 font-medium text-sm text-right">Volume (tons)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {wasteData.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-4 font-medium text-gray-800">{item.type}</td>
                                    <td className="py-4 font-medium text-gray-800 text-right">{item.volume.toFixed(1)}</td>
                                </tr>
                            ))}
                            <tr className="bg-green-50">
                                <td className="py-4 font-bold text-gray-900 pl-2">Total</td>
                                <td className="py-4 font-bold text-gray-900 text-right pr-2">{totalVolume.toFixed(1)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default ResidentAnalytics;
