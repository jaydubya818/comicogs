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

const StatCard = ({ icon, title, value, color }) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        className={`p-6 rounded-2xl shadow-lg flex items-center space-x-4 bg-gradient-to-br ${color}`}>
        <div className="p-3 bg-white bg-opacity-20 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-white text-opacity-80 text-sm">{title}</p>
            <p className="text-white font-bold text-2xl">{value}</p>
        </div>
    </motion.div>
);

const NavLink = ({ to, icon, children }) => (
    <Link to={to} className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
        {icon}
        <span className="font-medium">{children}</span>
    </Link>
);

const EnhancedDashboard = ({ user, onLogout }) => {
    const [stats, setStats] = useState(mockStats);
    const [recentActivity, setRecentActivity] = useState(mockRecentActivity);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Sidebar Navigation */}
                <aside className="lg:col-span-2 bg-white p-6 lg:min-h-screen">
                    <h1 className="text-2xl font-bold text-blue-600 mb-10">Comicogs</h1>
                    <nav className="space-y-2">
                        <NavLink to="/" icon={<BarChart />}>Dashboard</NavLink>
                        <NavLink to="/collection" icon={<BookOpen />}>Collection</NavLink>
                        <NavLink to="/ai-tools" icon={<Search />}>ComicComp</NavLink>
                        <NavLink to="/marketplace" icon={<TrendingUp />}>Marketplace</NavLink>
                        <NavLink to="/wantlist" icon={<Star />}>Want List</NavLink>
                    </nav>
                    <div className="absolute bottom-6 left-6">
                        <button onClick={onLogout} className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                            <LogOut />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-10 p-8">
                    <header className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user?.username || 'Collector'}!</h2>
                        <p className="text-gray-500 mt-1">Here's a snapshot of your collection.</p>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                        <StatCard icon={<BookOpen size={24} className="text-white" />} title="Total Comics" value={stats.totalComics} color="from-blue-500 to-blue-400" />
                        <StatCard icon={<DollarSign size={24} className="text-white" />} title="Estimated Value" value={`$${stats.estimatedValue.toLocaleString()}`} color="from-green-500 to-green-400" />
                        <StatCard icon={<Star size={24} className="text-white" />} title="Top Publisher" value={stats.topPublisher} color="from-purple-500 to-purple-400" />
                        <StatCard icon={<TrendingUp size={24} className="text-white" />} title="Best Condition" value={stats.bestCondition} color="from-indigo-500 to-indigo-400" />
                    </div>

                    {/* Main sections */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Recent Activity */}
                        <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
                            <h3 className="font-bold text-xl mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {recentActivity.map(activity => (
                                    <motion.div key={activity.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: activity.id * 0.1 }} className="flex items-center justify-between pb-2 border-b border-gray-100">
                                        <p className="text-gray-700">{activity.title}</p>
                                        <p className="text-gray-400 text-sm">{activity.time}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <h3 className="font-bold text-xl mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link to="/collection" className="block w-full text-center bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-sm">Manage Collection</Link>
                                <Link to="/ai-tools" className="block w-full text-center bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors">Analyze Market</Link>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EnhancedDashboard;
