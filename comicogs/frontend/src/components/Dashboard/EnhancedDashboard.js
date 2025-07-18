import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, DollarSign, BookOpen, Search, TrendingUp, Star, LogOut } from 'lucide-react';

// Mock data - replace with API calls
const mockStats = {
    totalComics: 123,
    estimatedValue: 15234.50,
    topPublisher: 'Marvel',
    bestCondition: 'NM (9.4)',
};

const mockRecentActivity = [
    { id: 1, title: 'Added Amazing Spider-Man #300', time: '2h ago' },
    { id: 2, title: 'Updated value for X-Men #1', time: '1d ago' },
    { id: 3, title: 'Completed "House of X" series', time: '3d ago' },
];

const StatCard = ({ icon, title, value }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="p-6 rounded-lg shadow-sm flex items-center space-x-4 bg-white border border-gray-200 transition-transform duration-200"
    >
        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-gray-900 font-bold text-2xl">{value}</p>
        </div>
    </motion.div>
);

const NavLink = ({ to, icon, children }) => (
    <Link to={to} className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200">
        {icon}
        <span className="font-medium">{children}</span>
    </Link>
);

const EnhancedDashboard = ({ user, onLogout }) => {
    const [stats, setStats] = useState(mockStats);
    const [recentActivity, setRecentActivity] = useState(mockRecentActivity);

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Sidebar Navigation */}
                <aside className="lg:col-span-2 bg-white p-6 lg:min-h-screen border-r border-gray-200">
                    <h1 className="text-2xl font-bold text-blue-700 mb-10">Comicogs</h1>
                    <nav className="space-y-2">
                        <NavLink to="/" icon={<BarChart size={20} />}>Dashboard</NavLink>
                        <NavLink to="/collection" icon={<BookOpen size={20} />}>Collection</NavLink>
                        <NavLink to="/ai-tools" icon={<Search size={20} />}>ComicComp</NavLink>
                        <NavLink to="/marketplace" icon={<TrendingUp size={20} />}>Marketplace</NavLink>
                        <NavLink to="/wantlist" icon={<Star size={20} />}>Want List</NavLink>
                    </nav>
                    <div className="absolute bottom-6 left-6 w-[calc(100%-48px)]">
                        <button onClick={onLogout} className="flex items-center justify-center w-full space-x-3 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors duration-200">
                            <LogOut size={20} />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-10 p-8">
                    <header className="mb-8 pb-4 border-b border-gray-200">
                        <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user?.username || 'Collector'}!</h2>
                        <p className="text-gray-600 mt-1">Here's a snapshot of your collection.</p>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                        <StatCard icon={<BookOpen size={24} />} title="Total Comics" value={stats.totalComics} />
                        <StatCard icon={<DollarSign size={24} />} title="Estimated Value" value={`$${stats.estimatedValue.toLocaleString()}`} />
                        <StatCard icon={<Star size={24} />} title="Top Publisher" value={stats.topPublisher} />
                        <StatCard icon={<TrendingUp size={24} />} title="Best Condition" value={stats.bestCondition} />
                    </div>

                    {/* Main sections */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Recent Activity */}
                        <div className="xl:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-xl text-gray-800 mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {recentActivity.map(activity => (
                                    <motion.div key={activity.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: activity.id * 0.05 }} className="flex items-center justify-between pb-2 border-b border-gray-100 last:border-b-0">
                                        <p className="text-gray-700">{activity.title}</p>
                                        <p className="text-gray-500 text-sm">{activity.time}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-xl text-gray-800 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link to="/collection" className="block w-full text-center bg-blue-600 text-white font-semibold py-3 rounded-md hover:bg-blue-700 transition-colors duration-200">Manage Collection</Link>
                                <Link to="/ai-tools" className="block w-full text-center bg-gray-200 text-gray-800 font-semibold py-3 rounded-md hover:bg-gray-300 transition-colors duration-200">Analyze Market</Link>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EnhancedDashboard;