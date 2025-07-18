/**
 * Task 5: Price History Chart Component
 * Interactive 6M/1Y historical price charts using Chart.js - Acceptance Criteria 2
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../common/LoadingSpinner';

// Chart.js imports
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const PriceHistoryChart = ({ data, loading, timeRange, onTimeRangeChange }) => {
    const chartRef = useRef(null);
    const [chartData, setChartData] = useState(null);
    const [chartOptions, setChartOptions] = useState(null);

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (timeRange === '1Y') {
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    // Format price for chart tooltip
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(price);
    };

    // Process data for Chart.js
    useEffect(() => {
        if (!data?.price_history || data.price_history.length === 0) {
            setChartData(null);
            return;
        }

        // Sort data by date
        const sortedData = [...data.price_history].sort((a, b) => new Date(a.period) - new Date(b.period));

        // Aggregate data by period (combine multiple entries for same period)
        const aggregatedData = sortedData.reduce((acc, item) => {
            const period = new Date(item.period).toISOString().split('T')[0]; // Get date part only
            
            if (!acc[period]) {
                acc[period] = {
                    period: item.period,
                    prices: [],
                    volumes: []
                };
            }
            
            acc[period].prices.push(item.average_price);
            acc[period].volumes.push(item.transaction_count);
            
            return acc;
        }, {});

        // Calculate averages for each period
        const processedData = Object.values(aggregatedData).map(item => ({
            period: item.period,
            average_price: item.prices.reduce((sum, price) => sum + price, 0) / item.prices.length,
            min_price: Math.min(...item.prices),
            max_price: Math.max(...item.prices),
            volume: item.volumes.reduce((sum, vol) => sum + vol, 0)
        }));

        const labels = processedData.map(item => formatDate(item.period));
        const prices = processedData.map(item => item.average_price);
        const minPrices = processedData.map(item => item.min_price);
        const maxPrices = processedData.map(item => item.max_price);
        const volumes = processedData.map(item => item.volume);

        // Calculate price trend (simple moving average)
        const trendData = prices.map((price, index) => {
            if (index < 4) return price; // Not enough data for trend
            const recentPrices = prices.slice(index - 4, index + 1);
            return recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
        });

        setChartData({
            labels,
            datasets: [
                {
                    label: 'Average Price',
                    data: prices,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Trend Line',
                    data: trendData,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Price Range',
                    data: maxPrices,
                    borderColor: 'rgba(156, 163, 175, 0.5)',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: '+1',
                    tension: 0.4
                },
                {
                    label: 'Price Range (Min)',
                    data: minPrices,
                    borderColor: 'rgba(156, 163, 175, 0.5)',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.4
                }
            ]
        });

        // Chart options
        setChartOptions({
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        filter: (item) => !item.text.includes('Range (Min)'), // Hide min price from legend
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                    borderWidth: 1,
                    callbacks: {
                        title: (context) => {
                            return `Date: ${context[0].label}`;
                        },
                        label: (context) => {
                            const datasetLabel = context.dataset.label;
                            const value = context.parsed.y;
                            
                            if (datasetLabel === 'Average Price') {
                                const volume = volumes[context.dataIndex];
                                return [
                                    `${datasetLabel}: ${formatPrice(value)}`,
                                    `Volume: ${volume} transactions`
                                ];
                            } else if (datasetLabel === 'Trend Line') {
                                return `${datasetLabel}: ${formatPrice(value)}`;
                            } else if (datasetLabel === 'Price Range') {
                                const minPrice = minPrices[context.dataIndex];
                                return `Range: ${formatPrice(minPrice)} - ${formatPrice(value)}`;
                            }
                            return null;
                        },
                        filter: (tooltipItem) => {
                            return !tooltipItem.dataset.label.includes('Range (Min)');
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date',
                        color: '#6b7280'
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6b7280',
                        maxTicksLimit: 8
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Price (USD)',
                        color: '#6b7280'
                    },
                    grid: {
                        color: 'rgba(107, 114, 128, 0.1)'
                    },
                    ticks: {
                        color: '#6b7280',
                        callback: function(value) {
                            return formatPrice(value);
                        }
                    }
                }
            },
            elements: {
                point: {
                    hoverBorderWidth: 3
                }
            }
        });
    }, [data, timeRange]);

    // Render loading state
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-md p-6"
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price History</h3>
                <div className="flex items-center justify-center h-80">
                    <LoadingSpinner />
                </div>
            </motion.div>
        );
    }

    // Render no data state
    if (!data?.price_history || data.price_history.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-md p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Price History</h3>
                    <div className="flex items-center gap-2">
                        {['3M', '6M', '1Y'].map((range) => (
                            <button
                                key={range}
                                onClick={() => onTimeRangeChange && onTimeRangeChange(range)}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                    timeRange === range
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="text-center py-20">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Historical Data</h4>
                    <p className="text-gray-600">Price history is not available for the selected time range.</p>
                </div>
            </motion.div>
        );
    }

    // Calculate summary statistics
    const prices = data.price_history.map(item => item.average_price);
    const currentPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const priceChange = currentPrice - firstPrice;
    const priceChangePercent = ((priceChange / firstPrice) * 100);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-md p-6"
        >
            {/* Header with time range selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Price History</h3>
                    <p className="text-sm text-gray-600">
                        {data.summary?.total_records || 0} data points over {data.summary?.date_range_days || 0} days
                    </p>
                </div>
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                    {['3M', '6M', '1Y'].map((range) => (
                        <motion.button
                            key={range}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onTimeRangeChange && onTimeRangeChange(range)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                timeRange === range
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {range}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center p-3 bg-gray-50 rounded-lg"
                >
                    <div className={`text-lg font-bold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {priceChange >= 0 ? '+' : ''}{formatPrice(priceChange)}
                    </div>
                    <div className="text-xs text-gray-600">Period Change</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center p-3 bg-gray-50 rounded-lg"
                >
                    <div className={`text-lg font-bold ${priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">% Change</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center p-3 bg-blue-50 rounded-lg"
                >
                    <div className="text-lg font-bold text-blue-600">{formatPrice(maxPrice)}</div>
                    <div className="text-xs text-blue-700">Period High</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center p-3 bg-blue-50 rounded-lg"
                >
                    <div className="text-lg font-bold text-blue-600">{formatPrice(minPrice)}</div>
                    <div className="text-xs text-blue-700">Period Low</div>
                </motion.div>
            </div>

            {/* Chart Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="h-80 md:h-96"
            >
                {chartData && chartOptions && (
                    <Line 
                        ref={chartRef}
                        data={chartData} 
                        options={chartOptions}
                    />
                )}
            </motion.div>

            {/* Chart Legend/Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-4 pt-4 border-t border-gray-200"
            >
                <div className="flex flex-wrap items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            <span>Average Price</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-1 bg-red-500 mr-2" style={{borderStyle: 'dashed'}}></div>
                            <span>Trend Line</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                            <span>Price Range</span>
                        </div>
                    </div>
                    <div className="text-right mt-2 md:mt-0">
                        <div>Data source: Multiple marketplaces</div>
                        <div>Updated: {new Date().toLocaleString()}</div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PriceHistoryChart; 