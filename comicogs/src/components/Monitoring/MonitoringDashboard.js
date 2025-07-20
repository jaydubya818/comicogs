/**
 * Task 11: Performance Monitoring & Analytics
 * MonitoringDashboard - Comprehensive system monitoring interface
 */

import React, { useState, useEffect } from 'react';
import { 
    Activity, 
    Server, 
    Database, 
    Cpu, 
    MemoryStick, 
    Users, 
    TrendingUp, 
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    BarChart3,
    Eye,
    Zap
} from 'lucide-react';
import './MonitoringDashboard.css';

const MonitoringDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/monitoring/dashboard');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setDashboardData(result.data);
            setLastUpdate(new Date());
            setError(null);
        } catch (err) {
            setError('Failed to fetch monitoring data: ' + err.message);
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="text-green-500" size={20} />;
            case 'warning':
                return <AlertTriangle className="text-yellow-500" size={20} />;
            case 'critical':
            case 'error':
                return <XCircle className="text-red-500" size={20} />;
            default:
                return <AlertTriangle className="text-gray-500" size={20} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy':
                return 'text-green-500';
            case 'warning':
                return 'text-yellow-500';
            case 'critical':
            case 'error':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    const formatUptime = (milliseconds) => {
        const seconds = Math.floor(milliseconds / 1000);
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        }
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="monitoring-dashboard">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2">Loading monitoring data...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="monitoring-dashboard">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <XCircle className="text-red-500 mr-2" size={20} />
                        <span className="text-red-700">{error}</span>
                    </div>
                    <button 
                        onClick={fetchDashboardData}
                        className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const { health, analytics, performance } = dashboardData || {};

    return (
        <div className="monitoring-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm text-gray-500">
                            <Clock size={16} className="mr-1" />
                            Last updated: {lastUpdate.toLocaleTimeString()}
                        </div>
                        <button 
                            onClick={fetchDashboardData}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="metric-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">System Status</p>
                            <p className={`text-lg font-semibold ${getStatusColor(health?.status)}`}>
                                {health?.status?.toUpperCase() || 'UNKNOWN'}
                            </p>
                        </div>
                        {getStatusIcon(health?.status)}
                    </div>
                </div>

                <div className="metric-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Uptime</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {health?.uptime ? formatUptime(health.uptime) : '0m'}
                            </p>
                        </div>
                        <Clock className="text-blue-500" size={20} />
                    </div>
                </div>

                <div className="metric-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Users</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {analytics?.realtime?.currentUsers || 0}
                            </p>
                        </div>
                        <Users className="text-green-500" size={20} />
                    </div>
                </div>

                <div className="metric-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">API Response Time</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {performance?.apiResponseTime ? `${Math.round(performance.apiResponseTime)}ms` : '0ms'}
                            </p>
                        </div>
                        <Zap className="text-yellow-500" size={20} />
                    </div>
                </div>
            </div>

            {/* Service Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="status-card">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Server className="mr-2" size={20} />
                        Service Health
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Database size={16} className="mr-2" />
                                <span>Database</span>
                            </div>
                            <div className="flex items-center">
                                {getStatusIcon(health?.database)}
                                <span className={`ml-2 text-sm ${getStatusColor(health?.database)}`}>
                                    {health?.database?.toUpperCase() || 'UNKNOWN'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <MemoryStick size={16} className="mr-2" />
                                <span>Redis Cache</span>
                            </div>
                            <div className="flex items-center">
                                {getStatusIcon(health?.redis)}
                                <span className={`ml-2 text-sm ${getStatusColor(health?.redis)}`}>
                                    {health?.redis?.toUpperCase() || 'UNKNOWN'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="status-card">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Cpu className="mr-2" size={20} />
                        System Resources
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span>Memory Usage</span>
                            <span className="text-sm font-medium">
                                {health?.memory?.percentage ? `${health.memory.percentage.toFixed(1)}%` : '0%'}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${health?.memory?.percentage || 0}%` }}
                            ></div>
                        </div>
                        {health?.memory && (
                            <div className="text-xs text-gray-500">
                                {formatBytes(health.memory.used)} / {formatBytes(health.memory.total)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Analytics Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="analytics-card">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Eye className="mr-2" size={20} />
                        Page Views (24h)
                    </h3>
                    <div className="text-3xl font-bold text-blue-600">
                        {analytics?.realtime?.pageViewsLast24h || 0}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                        {analytics?.daily?.pages?.uniqueViews || 0} unique views
                    </div>
                </div>

                <div className="analytics-card">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Activity className="mr-2" size={20} />
                        API Calls (24h)
                    </h3>
                    <div className="text-3xl font-bold text-green-600">
                        {analytics?.realtime?.apiCallsLast24h || 0}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                        {performance?.errorRate || 0}% error rate
                    </div>
                </div>

                <div className="analytics-card">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <TrendingUp className="mr-2" size={20} />
                        Feature Usage
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Recommendations</span>
                            <span className="font-medium">{analytics?.daily?.features?.recommendations || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Searches</span>
                            <span className="font-medium">{analytics?.daily?.features?.searches || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Listings</span>
                            <span className="font-medium">{analytics?.daily?.features?.listings || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="performance-section">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <BarChart3 className="mr-2" size={20} />
                    Performance Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="text-sm text-gray-600">Avg API Response</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {performance?.apiResponseTime ? `${Math.round(performance.apiResponseTime)}ms` : '0ms'}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="text-sm text-gray-600">DB Query Time</div>
                        <div className="text-2xl font-bold text-green-600">
                            {performance?.dbQueryTime ? `${Math.round(performance.dbQueryTime)}ms` : '0ms'}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="text-sm text-gray-600">Redis Latency</div>
                        <div className="text-2xl font-bold text-purple-600">
                            {performance?.redisLatency ? `${Math.round(performance.redisLatency)}ms` : '0ms'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Alerts */}
            {health?.alerts > 0 && (
                <div className="mt-8">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <AlertTriangle className="text-yellow-500 mr-2" size={20} />
                            <span className="text-yellow-700 font-medium">
                                {health.alerts} Active Alert{health.alerts !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <p className="text-yellow-600 text-sm mt-1">
                            Check the alerts section for more details
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonitoringDashboard; 