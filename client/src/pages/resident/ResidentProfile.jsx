import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const ResidentProfile = () => {
    const { user, updateProfile } = useAuth();
    const [address, setAddress] = useState(user?.address || '');
    const [message, setMessage] = useState('');

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateProfile({ address });
            setMessage('Profile updated successfully!');
        } catch (error) {
            setMessage('Failed to update profile.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow border max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-6 text-center">My Profile</h2>
            {message && <div className={`p-2 mb-4 text-center rounded ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}

            <div className="space-y-4">
                <div>
                    <label className="block text-gray-500 text-sm">Name</label>
                    <p className="font-semibold text-lg">{user?.name}</p>
                </div>
                <div>
                    <label className="block text-gray-500 text-sm">Email</label>
                    <p className="font-semibold text-lg">{user?.email}</p>
                </div>
                <div>
                    <label className="block text-gray-500 text-sm">Role</label>
                    <p className="capitalize font-semibold text-lg text-primary">{user?.role}</p>
                </div>

                <form onSubmit={handleUpdate} className="pt-4 border-t">
                    <label className="block text-gray-700 font-medium mb-2">Address</label>
                    <textarea
                        className="w-full border rounded p-2 focus:ring-primary focus:border-primary"
                        rows="3"
                        placeholder="Enter your address..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    ></textarea>
                    <button
                        type="submit"
                        className="mt-2 w-full bg-primary text-white py-2 rounded hover:bg-secondary transition"
                    >
                        Update Address
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResidentProfile;
