/**
 * Task 5: Price Trend Dashboard Frontend
 * Interactive React dashboard for displaying pricing insights and market trends
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CurrentValueCard from './CurrentValueCard';
import PriceHistoryChart from './PriceHistoryChart';
import TrendIndicators from './TrendIndicators';
import PriceSuggestions from './PriceSuggestions';
import LoadingSpinner from '../common/LoadingSpinner';
import './PriceTrendDashboard.css';

const PriceTrendDashboard = ({ comicId: initialComicId, title: initialTitle }) => {
    // State management
    const [comicId, setComicId] = useState(initialComicId || '');
    const [title, setTitle] = useState(initialTitle || '');
    const [currentData, setCurrentData] = useState(null);
    const [historyData, setHistoryData] = useState(null);
    const [trendsData, setTrendsData] = useState(null);
    const [suggestionsData, setSuggestionsData] = useState(null);
    const [loading, setLoading] = useState({
        current: false,
        history: false,
        trends: false,
        suggestions: false
    });
    const [error, setError] = useState(null);
    const [selectedTimeRange, setSelectedTimeRange] = useState('6M');
    const [refreshInterval, setRefreshInterval] = useState(null);
    const wsRef = useRef(null);

    // API base URL
    const API_BASE = process.env.REACT_APP_API_URL || '';

    /**
     * Utility functions
     */
    const formatPrice = (price) => {
        if (!price && price !== 0) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(price);
    };

    const formatPercentage = (value, showSign = true) => {
        if (!value && value !== 0) return 'N/A';
        const sign = showSign && value > 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    };

    const setLoadingState = (key, value) => {
        setLoading(prev => ({ ...prev, [key]: value }));
    };

    /**
     * API calls using the new pricing endpoints from Task 4
     */
    const fetchCurrentPricing = useCallback(async (comic) => {
        if (!comic) return;
        
        setLoadingState('current', true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            if (title) queryParams.append('title', title);
            
            const url = `${API_BASE}/api/pricing/current/${encodeURIComponent(comic)}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch current pricing: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.success) {
                setCurrentData(result.data);
            } else {
                throw new Error(result.error || 'Failed to fetch current pricing');
            }
        } catch (err) {
            console.error('Error fetching current pricing:', err);
            setError(`Failed to load current pricing: ${err.message}`);
        } finally {
            setLoadingState('current', false);
        }
    }, [API_BASE, title]);

    const fetchPriceHistory = useCallback(async (comic, timeRange = '6M') => {
        if (!comic) return;
        
        setLoadingState('history', true);

        try {
            const endDate = new Date();
            const startDate = new Date();
            
            // Calculate start date based on time range
            switch (timeRange) {
                case '6M':
                    startDate.setMonth(startDate.getMonth() - 6);
                    break;
                case '1Y':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    break;
                case '3M':
                    startDate.setMonth(startDate.getMonth() - 3);
                    break;
                default:
                    startDate.setMonth(startDate.getMonth() - 6);
            }

            const queryParams = new URLSearchParams({
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                interval: timeRange === '1Y' ? 'weekly' : 'daily',
                limit: '100'
            });

            const url = `${API_BASE}/api/pricing/history/${encodeURIComponent(comic)}?${queryParams.toString()}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch price history: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.success) {
                setHistoryData(result.data);
            } else {
                throw new Error(result.error || 'Failed to fetch price history');
            }
        } catch (err) {
            console.error('Error fetching price history:', err);
            setError(`Failed to load price history: ${err.message}`);
        } finally {
            setLoadingState('history', false);
        }
    }, [API_BASE]);

    const fetchTrends = useCallback(async (comic) => {
        if (!comic) return;
        
        setLoadingState('trends', true);

        try {
            const queryParams = new URLSearchParams({
                period: selectedTimeRange === '1Y' ? '365d' : '180d',
                include_forecast: 'true'
            });

            const url = `${API_BASE}/api/pricing/trends/${encodeURIComponent(comic)}?${queryParams.toString()}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch trends: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.success) {
                setTrendsData(result.data);
            } else {
                throw new Error(result.error || 'Failed to fetch trends');
            }
        } catch (err) {
            console.error('Error fetching trends:', err);
            setError(`Failed to load trends: ${err.message}`);
        } finally {
            setLoadingState('trends', false);
        }
    }, [API_BASE, selectedTimeRange]);

    const fetchSuggestions = useCallback(async (comic) => {
        if (!comic) return;
        
        setLoadingState('suggestions', true);

        try {
            const queryParams = new URLSearchParams({
                action: 'sell',
                user_context: JSON.stringify({
                    experience_level: 'intermediate',
                    risk_tolerance: 'medium'
                })
            });

            const url = `${API_BASE}/api/pricing/suggestions/${encodeURIComponent(comic)}?${queryParams.toString()}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch suggestions: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.success) {
                setSuggestionsData(result.data);
            } else {
                throw new Error(result.error || 'Failed to fetch suggestions');
            }
        } catch (err) {
            console.error('Error fetching suggestions:', err);
            setError(`Failed to load suggestions: ${err.message}`);
        } finally {
            setLoadingState('suggestions', false);
        }
    }, [API_BASE]);

    /**
     * Load all data for a comic
     */
    const loadComicData = useCallback(async (comic) => {
        if (!comic) return;

        // Load all data in parallel for better performance
        await Promise.all([
            fetchCurrentPricing(comic),
            fetchPriceHistory(comic, selectedTimeRange),
            fetchTrends(comic),
            fetchSuggestions(comic)
        ]);
    }, [fetchCurrentPricing, fetchPriceHistory, fetchTrends, fetchSuggestions, selectedTimeRange]);

    /**
     * Handle time range changes
     */
    const handleTimeRangeChange = useCallback((newRange) => {
        setSelectedTimeRange(newRange);
        if (comicId) {
            fetchPriceHistory(comicId, newRange);
            fetchTrends(comicId);
        }
    }, [comicId, fetchPriceHistory, fetchTrends]);

    /**
     * Setup WebSocket for real-time updates (Task 5 Acceptance Criteria 7)
     */
    const setupWebSocket = useCallback(() => {
        if (!comicId) return;

        try {
            const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/pricing/ws`;
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('🔌 WebSocket connected for real-time price updates');
                // Subscribe to price updates for this comic
                wsRef.current.send(JSON.stringify({
                    type: 'subscribe',
                    comic_id: comicId
                }));
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'price_update' && data.comic_id === comicId) {
                        console.log('📈 Real-time price update received', data);
                        // Refresh current pricing data
                        fetchCurrentPricing(comicId);
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };

            wsRef.current.onerror = (error) => {
                console.warn('⚠️ WebSocket error:', error);
            };

            wsRef.current.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                // Attempt to reconnect after 5 seconds
                setTimeout(setupWebSocket, 5000);
            };
        } catch (err) {
            console.warn('WebSocket not available:', err);
        }
    }, [comicId, fetchCurrentPricing]);

    /**
     * Setup auto-refresh for data
     */
    const setupAutoRefresh = useCallback(() => {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }

        const interval = setInterval(() => {
            if (comicId) {
                console.log('🔄 Auto-refreshing pricing data...');
                fetchCurrentPricing(comicId);
            }
        }, 5 * 60 * 1000); // Refresh every 5 minutes

        setRefreshInterval(interval);
    }, [comicId, fetchCurrentPricing, refreshInterval]);

    /**
     * Effects
     */
    useEffect(() => {
        if (comicId) {
            loadComicData(comicId);
            setupWebSocket();
            setupAutoRefresh();
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [comicId, loadComicData, setupWebSocket, setupAutoRefresh]);

    /**
     * Calculate value change vs last year for display
     */
    const calculateYearOverYearChange = () => {
        if (!historyData?.price_history || !currentData?.current_value?.market_price) {
            return null;
        }

        // Find price from one year ago
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        const historicalRecord = historyData.price_history.find(record => {
            const recordDate = new Date(record.period);
            return Math.abs(recordDate - oneYearAgo) < (30 * 24 * 60 * 60 * 1000); // Within 30 days
        });

        if (!historicalRecord) return null;

        const currentPrice = currentData.current_value.market_price;
        const yearAgoPrice = historicalRecord.average_price;
        const changePercent = ((currentPrice - yearAgoPrice) / yearAgoPrice) * 100;

        return {
            current: currentPrice,
            yearAgo: yearAgoPrice,
            changePercent,
            changeAmount: currentPrice - yearAgoPrice
        };
    };

    const yearOverYearData = calculateYearOverYearChange();

    /**
     * Render methods
     */
    const renderSearchInput = () => (
        <div className="mb-6 sm:mb-8">
            <div className="search-container flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label htmlFor="comic-search" className="block text-sm font-medium text-gray-700 mb-2">
                        Comic Search
                    </label>
                    <input
                        id="comic-search"
                        type="text"
                        value={comicId}
                        onChange={(e) => setComicId(e.target.value)}
                        placeholder="Enter comic name or ID (e.g., Amazing Spider-Man 300)"
                        className="search-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus-visible:focus"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && comicId.trim()) {
                                loadComicData(comicId.trim());
                            }
                        }}
                    />
                </div>
                <div className="flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => comicId.trim() && loadComicData(comicId.trim())}
                        disabled={!comicId.trim() || Object.values(loading).some(l => l)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {Object.values(loading).some(l => l) ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <span>Analyze</span>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );

    const renderTimeRangeSelector = () => (
        <div className="time-range-selector flex items-center gap-2 mb-4 sm:mb-6">
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">Time Range:</span>
            {['3M', '6M', '1Y'].map((range) => (
                <motion.button
                    key={range}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTimeRangeChange(range)}
                    className={`time-range-button px-3 py-1 text-sm rounded-md transition-colors focus-visible:focus ${
                        selectedTimeRange === range
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    {range}
                </motion.button>
            ))}
        </div>
    );

    const renderErrorState = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6"
        >
            <div className="flex items-center">
                <div className="text-red-400 mr-4">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
                    <p className="text-red-700">{error}</p>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="price-dashboard py-4 sm:py-8">
            <div className="dashboard-container">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Price Trend Dashboard</h1>
                    <p className="text-gray-600">Real-time pricing insights and market analysis for comic books</p>
                </motion.div>

                {/* Search Input */}
                {renderSearchInput()}

                {/* Error Display */}
                <AnimatePresence>
                    {error && renderErrorState()}
                </AnimatePresence>

                {/* Time Range Selector */}
                {(currentData || historyData) && renderTimeRangeSelector()}

                {/* Dashboard Content */}
                {comicId && (
                    <div className="dashboard-grid space-y-6 sm:space-y-8">
                        {/* Top Row - Current Value and Year-over-Year Change */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                            {/* Current Value Card - Task 5 Acceptance Criteria 1 */}
                            <div className="lg:col-span-2">
                                <CurrentValueCard 
                                    data={currentData}
                                    loading={loading.current}
                                    formatPrice={formatPrice}
                                />
                            </div>

                            {/* Value Change vs Last Year - Task 5 Acceptance Criteria 5 */}
                            <div className="lg:col-span-1">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-white rounded-lg shadow-md p-6 h-full"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Year-over-Year Change</h3>
                                    {loading.history ? (
                                        <div className="flex items-center justify-center h-24">
                                            <LoadingSpinner />
                                        </div>
                                    ) : yearOverYearData ? (
                                        <div className="space-y-4">
                                            <div className="text-center">
                                                <div className={`text-2xl font-bold ${
                                                    yearOverYearData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {formatPercentage(yearOverYearData.changePercent)}
                                                </div>
                                                <div className="text-sm text-gray-500">vs. last year</div>
                                            </div>
                                            <div className="text-center space-y-1">
                                                <div className="text-sm text-gray-600">
                                                    {formatPrice(yearOverYearData.yearAgo)} → {formatPrice(yearOverYearData.current)}
                                                </div>
                                                <div className={`text-sm font-medium ${
                                                    yearOverYearData.changeAmount >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {yearOverYearData.changeAmount >= 0 ? '+' : ''}{formatPrice(yearOverYearData.changeAmount)}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">No historical data available</p>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </div>

                        {/* Second Row - Price History Chart */}
                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            {/* Interactive Price Charts - Task 5 Acceptance Criteria 2 */}
                            <div className="chart-container">
                                <PriceHistoryChart 
                                    data={historyData}
                                    loading={loading.history}
                                    timeRange={selectedTimeRange}
                                    onTimeRangeChange={handleTimeRangeChange}
                                />
                            </div>
                        </div>

                        {/* Third Row - Trends and Suggestions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Market Trend Indicators - Task 5 Acceptance Criteria 3 */}
                            <TrendIndicators 
                                data={trendsData}
                                loading={loading.trends}
                                formatPrice={formatPrice}
                                formatPercentage={formatPercentage}
                            />

                            {/* Price Suggestions - Task 5 Acceptance Criteria 4 */}
                            <PriceSuggestions 
                                data={suggestionsData}
                                loading={loading.suggestions}
                                formatPrice={formatPrice}
                            />
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!comicId && !error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to Price Trend Dashboard</h3>
                        <p className="text-gray-600 mb-6">Enter a comic name or ID above to analyze pricing trends and market insights</p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                            <p className="text-sm text-blue-700">
                                <strong>Example searches:</strong><br />
                                Amazing Spider-Man 300<br />
                                X-Men 1<br />
                                Batman 1
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default PriceTrendDashboard; 