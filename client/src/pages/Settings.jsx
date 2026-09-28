import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Lock, Bell, Save, Globe } from 'lucide-react';

const Settings = () => {
    const { updateProfile } = useAuth();
    // Reverting global context for language, using local state as placeholder
    const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [notifications, setNotifications] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            await updateProfile({ password: formData.password });
            setMessage('Password updated successfully');
            setFormData({ password: '', confirmPassword: '' });
        } catch (err) {
            setError('Failed to update password');
        }
    };

    const handleLanguageChange = (e) => {
        const lang = e.target.value;
        setLanguage(lang);
        localStorage.setItem('language', lang);
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <SettingsIcon className="text-gray-700" />
                Account Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Security Settings */}
                <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Lock size={18} className="text-primary" />
                        Security
                    </h3>

                    {message && <div className="p-2 mb-4 bg-green-100 text-green-700 rounded text-sm">{message}</div>}
                    {error && <div className="p-2 mb-4 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                className="w-full border rounded p-2 focus:ring-primary focus:border-primary"
                                placeholder="Enter new password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                className="w-full border rounded p-2 focus:ring-primary focus:border-primary"
                                placeholder="Confirm new password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-primary text-white py-2 rounded hover:bg-secondary transition flex items-center justify-center gap-2">
                            <Save size={18} /> Update Password
                        </button>
                    </form>
                </div>

                {/* Preferences */}
                <div className="bg-white p-6 rounded-lg shadow border h-fit">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <SettingsIcon size={18} className="text-primary" />
                        Preferences
                    </h3>

                    <div className="space-y-6">
                        {/* Language */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Globe size={20} className="text-gray-500" />
                                <div>
                                    <p className="font-medium">Language</p>
                                    <p className="text-xs text-gray-400">Select your preferred language</p>
                                </div>
                            </div>
                            <select
                                value={language}
                                onChange={handleLanguageChange}
                                className="border rounded p-1 text-sm bg-white focus:ring-primary focus:border-primary"
                            >
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="fr">Français</option>
                                <option value="hi">हिंदी (Hindi)</option>
                            </select>
                        </div>

                        {/* Notifications (Mock) */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bell size={20} className="text-gray-500" />
                                <div>
                                    <p className="font-medium">Email Notifications</p>
                                    <p className="text-xs text-gray-400">Receive updates about your reports</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;
