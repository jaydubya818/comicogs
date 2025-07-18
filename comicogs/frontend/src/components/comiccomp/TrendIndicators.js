/**
 * Task 5: Trend Indicators Component
 * Market movement trendline with directional indicators - Acceptance Criteria 3
 */

import React from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../common/LoadingSpinner';

const TrendIndicators = ({ data, loading, formatPrice, formatPercentage }) => {
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-md p-6 h-full"
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Trends</h3>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                </div>
            </motion.div>
        );
    }

    if (!data) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-md p-6 h-full"
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Trends</h3>
                <div className="text-center py-16">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <p className="text-gray-500">No trend data available</p>
                </div>
            </motion.div>
        );
    }

    const { price_movement, market_indicators, trading_volume, insights, confidence } = data;

    // Get trend direction info
    const getTrendInfo = (direction) => {
        switch (direction) {
            case 'upward':
                return {
                    icon: '📈',
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    label: 'Upward Trend'
                };
            case 'downward':
                return {
                    icon: '📉',
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    label: 'Downward Trend'
                };
            default:
                return {
                    icon: '➡️',
                    color: 'text-gray-600',
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    label: 'Stable'
                };
        }
    };

    const trendInfo = getTrendInfo(price_movement?.direction);

    // Get momentum indicator
    const getMomentumInfo = (momentum) => {
        if (momentum >= 0.7) return { level: 'Strong', color: 'text-green-600', bg: 'bg-green-100' };
        if (momentum >= 0.4) return { level: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        return { level: 'Weak', color: 'text-red-600', bg: 'bg-red-100' };
    };

    const momentumInfo = getMomentumInfo(price_movement?.momentum || 0);

    // Get volatility level
    const getVolatilityInfo = (volatility) => {
        if (volatility <= 0.2) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
        if (volatility <= 0.4) return { level: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        return { level: 'High', color: 'text-red-600', bg: 'bg-red-100' };
    };

    const volatilityInfo = getVolatilityInfo(price_movement?.volatility || 0);

    // Get sentiment info
    const getSentimentInfo = (sentiment) => {
        switch (sentiment) {
            case 'bullish':
                return { icon: '🐂', color: 'text-green-600', bg: 'bg-green-50', label: 'Bullish' };
            case 'bearish':
                return { icon: '🐻', color: 'text-red-600', bg: 'bg-red-50', label: 'Bearish' };
            default:
                return { icon: '⚖️', color: 'text-gray-600', bg: 'bg-gray-50', label: 'Neutral' };
        }
    };

    const sentimentInfo = getSentimentInfo(market_indicators?.market_sentiment);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-md p-6 h-full"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Market Trends</h3>
                <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Confidence:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                        confidence >= 0.8 
                            ? 'bg-green-100 text-green-800'
                            : confidence >= 0.6 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {Math.round((confidence || 0) * 100)}%
                    </span>
                </div>
            </div>

            {/* Main Trend Indicator */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`p-4 rounded-lg border-2 ${trendInfo.bg} ${trendInfo.border} mb-6`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="text-2xl mr-3">{trendInfo.icon}</span>
                        <div>
                            <div className={`text-lg font-semibold ${trendInfo.color}`}>
                                {trendInfo.label}
                            </div>
                            <div className="text-sm text-gray-600">
                                Magnitude: {formatPercentage(price_movement?.magnitude || 0, false)}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-xl font-bold ${trendInfo.color}`}>
                            {price_movement?.direction === 'upward' ? '+' : price_movement?.direction === 'downward' ? '-' : ''}
                            {formatPercentage(Math.abs(price_movement?.magnitude || 0), false)}
                        </div>
                        <div className="text-xs text-gray-500">Price Movement</div>
                    </div>
                </div>
            </motion.div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Momentum */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`p-3 rounded-lg ${momentumInfo.bg}`}
                >
                    <div className="text-center">
                        <div className={`text-lg font-bold ${momentumInfo.color}`}>
                            {momentumInfo.level}
                        </div>
                        <div className="text-xs text-gray-600">Momentum</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {Math.round((price_movement?.momentum || 0) * 100)}%
                        </div>
                    </div>
                </motion.div>

                {/* Volatility */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`p-3 rounded-lg ${volatilityInfo.bg}`}
                >
                    <div className="text-center">
                        <div className={`text-lg font-bold ${volatilityInfo.color}`}>
                            {volatilityInfo.level}
                        </div>
                        <div className="text-xs text-gray-600">Volatility</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {formatPercentage((price_movement?.volatility || 0) * 100, false)}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Market Indicators */}
            <div className="space-y-4 mb-6">
                {/* Support & Resistance Levels */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-blue-50 rounded-lg p-4"
                >
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Support & Resistance</h4>
                    <div className="flex justify-between items-center">
                        <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                                {formatPrice(market_indicators?.support_level)}
                            </div>
                            <div className="text-xs text-blue-700">Support Level</div>
                        </div>
                        <div className="flex-1 mx-4 relative">
                            <div className="h-2 bg-gradient-to-r from-blue-200 via-yellow-200 to-red-200 rounded-full"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow"></div>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-red-600">
                                {formatPrice(market_indicators?.resistance_level)}
                            </div>
                            <div className="text-xs text-red-700">Resistance Level</div>
                        </div>
                    </div>
                </motion.div>

                {/* Trend Strength & Sentiment */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gray-50 rounded-lg p-3"
                    >
                        <div className="text-center">
                            <div className="text-lg font-bold text-gray-700">
                                {Math.round((market_indicators?.trend_strength || 0) * 100)}%
                            </div>
                            <div className="text-xs text-gray-600">Trend Strength</div>
                            <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${(market_indicators?.trend_strength || 0) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className={`rounded-lg p-3 ${sentimentInfo.bg}`}
                    >
                        <div className="text-center">
                            <div className="text-2xl mb-1">{sentimentInfo.icon}</div>
                            <div className={`text-sm font-medium ${sentimentInfo.color}`}>
                                {sentimentInfo.label}
                            </div>
                            <div className="text-xs text-gray-600">Market Sentiment</div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Trading Volume */}
            {trading_volume && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-green-50 rounded-lg p-4 mb-6"
                >
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Trading Activity</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-lg font-bold text-green-600">
                                {trading_volume.recent_activity || 0}
                            </div>
                            <div className="text-xs text-green-700">Recent Activity</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-green-600">
                                {trading_volume.volume_trend || 'N/A'}
                            </div>
                            <div className="text-xs text-green-700">Volume Trend</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-green-600">
                                {Math.round((trading_volume.liquidity_score || 0) * 100)}%
                            </div>
                            <div className="text-xs text-green-700">Liquidity Score</div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Market Insights */}
            {insights && insights.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="border-t pt-4"
                >
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Market Insights</h4>
                    <div className="space-y-2">
                        {insights.slice(0, 3).map((insight, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9 + index * 0.1 }}
                                className="flex items-start"
                            >
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                <p className="text-sm text-gray-600">{insight}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Forecast Indicator */}
            {data.forecast && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="mt-4 pt-4 border-t"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">30-Day Forecast:</span>
                        <span className={`text-sm font-medium ${
                            data.forecast.direction === 'up' ? 'text-green-600' : 
                            data.forecast.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                            {data.forecast.direction === 'up' ? '📈 Upward' : 
                             data.forecast.direction === 'down' ? '📉 Downward' : '➡️ Stable'}
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Real-time Update Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="flex items-center justify-center mt-4 pt-4 border-t"
            >
                <div className="flex items-center text-xs text-gray-500">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                    Live market analysis
                </div>
            </motion.div>
        </motion.div>
    );
};

export default TrendIndicators; 