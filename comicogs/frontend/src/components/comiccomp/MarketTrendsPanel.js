import React from 'react';
import { motion } from 'framer-motion';

const MarketTrendsPanel = ({ data }) => {
    if (!data || data.status !== 'success' || !data.data.trends) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Trends</h3>
                <div className="text-center py-8">
                    <p className="text-gray-500">No trend data available</p>
                </div>
            </div>
        );
    }

    const { trends, insights, statistics } = data.data;

    const getTrendIcon = (direction) => {
        switch (direction) {
            case 'increasing':
                return (
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                );
            case 'decreasing':
                return (
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 12h8" />
                    </svg>
                );
        }
    };

    const getTrendColor = (direction) => {
        switch (direction) {
            case 'increasing': return 'text-green-600 bg-green-50 border-green-200';
            case 'decreasing': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getConfidenceBadge = (confidence) => {
        if (confidence >= 0.8) return { text: 'High', color: 'bg-green-100 text-green-800' };
        if (confidence >= 0.6) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
        return { text: 'Low', color: 'bg-red-100 text-red-800' };
    };

    const getVolatilityLevel = (volatility) => {
        if (volatility > 0.5) return { text: 'High', color: 'text-red-600' };
        if (volatility > 0.3) return { text: 'Moderate', color: 'text-yellow-600' };
        return { text: 'Low', color: 'text-green-600' };
    };

    const getInsightIcon = (type) => {
        switch (type) {
            case 'data_quality':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                );
            case 'volatility':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                );
            case 'trend':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                );
            case 'diversity':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const getInsightColor = (level) => {
        switch (level) {
            case 'good': return 'text-green-600 bg-green-50 border-green-200';
            case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'weak': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'low': return 'text-green-600 bg-green-50 border-green-200';
            case 'bullish': return 'text-green-600 bg-green-50 border-green-200';
            case 'bearish': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    const confidenceBadge = getConfidenceBadge(trends.confidence);
    const volatilityLevel = getVolatilityLevel(trends.volatility);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Market Trends</h3>

            {/* Main Trend Analysis */}
            <div className="mb-6">
                <div className={`border rounded-lg p-4 ${getTrendColor(trends.direction)}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                            {getTrendIcon(trends.direction)}
                            <h4 className="font-semibold text-lg capitalize">{trends.direction} Trend</h4>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${confidenceBadge.color}`}>
                            {confidenceBadge.text} Confidence
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                            <div className="font-bold text-lg">
                                {trends.slope > 0 ? '+' : ''}{trends.slope}%
                            </div>
                            <div className="text-gray-600">Slope</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-lg">
                                {Math.round(trends.correlation * 100)}%
                            </div>
                            <div className="text-gray-600">Correlation</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-lg">
                                {Math.round(trends.confidence * 100)}%
                            </div>
                            <div className="text-gray-600">Confidence</div>
                        </div>
                        <div className="text-center">
                            <div className={`font-bold text-lg ${volatilityLevel.color}`}>
                                {volatilityLevel.text}
                            </div>
                            <div className="text-gray-600">Volatility</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Trend vs Overall Trend */}
            {trends.recentTrend && (
                <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Recent vs Overall Trend</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Overall Trend</span>
                                {getTrendIcon(trends.direction)}
                            </div>
                            <div className="font-medium text-gray-900 capitalize mt-1">
                                {trends.direction}
                            </div>
                            <div className="text-sm text-gray-600">
                                {trends.slope > 0 ? '+' : ''}{trends.slope}% per data point
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Recent Trend</span>
                                {getTrendIcon(trends.recentTrend.direction)}
                            </div>
                            <div className="font-medium text-gray-900 capitalize mt-1">
                                {trends.recentTrend.direction}
                            </div>
                            <div className="text-sm text-gray-600">
                                {trends.recentTrend.slope > 0 ? '+' : ''}{trends.recentTrend.slope}% per data point
                            </div>
                        </div>
                    </div>
                    
                    {trends.direction !== trends.recentTrend.direction && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-yellow-800">
                                    <strong>Trend Reversal Detected:</strong> Recent trend differs from overall pattern
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Moving Averages */}
            {trends.movingAverages && (trends.movingAverages.ma5 || trends.movingAverages.ma10) && (
                <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Moving Averages</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {trends.movingAverages.ma5 && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <div className="text-sm text-blue-600 font-medium">5-Point Moving Average</div>
                                <div className="text-lg font-bold text-blue-900 mt-1">
                                    Latest: ${trends.movingAverages.ma5[trends.movingAverages.ma5.length - 1]}
                                </div>
                                <div className="text-sm text-blue-700">
                                    {trends.movingAverages.ma5.length} data points
                                </div>
                            </div>
                        )}
                        {trends.movingAverages.ma10 && (
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <div className="text-sm text-purple-600 font-medium">10-Point Moving Average</div>
                                <div className="text-lg font-bold text-purple-900 mt-1">
                                    Latest: ${trends.movingAverages.ma10[trends.movingAverages.ma10.length - 1]}
                                </div>
                                <div className="text-sm text-purple-700">
                                    {trends.movingAverages.ma10.length} data points
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Market Insights */}
            {insights && insights.length > 0 && (
                <div>
                    <h4 className="font-medium text-gray-900 mb-3">Market Insights</h4>
                    <div className="space-y-3">
                        {insights.map((insight, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`border rounded-lg p-3 ${getInsightColor(insight.level)}`}
                            >
                                <div className="flex items-start space-x-2">
                                    {getInsightIcon(insight.type)}
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 capitalize">
                                            {insight.type.replace('_', ' ')} - {insight.level}
                                        </div>
                                        <p className="text-sm text-gray-700 mt-1">{insight.message}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Volatility Details */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Volatility Analysis</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className={`text-lg font-bold ${volatilityLevel.color}`}>
                            {Math.round(trends.volatility * 100)}%
                        </div>
                        <div className="text-gray-600">Volatility Score</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">
                            {statistics ? Math.round(statistics.coefficientOfVariation * 100) : 'N/A'}%
                        </div>
                        <div className="text-gray-600">Price Variation</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className={`text-lg font-bold ${volatilityLevel.color}`}>
                            {volatilityLevel.text}
                        </div>
                        <div className="text-gray-600">Risk Level</div>
                    </div>
                </div>
                
                <div className="mt-3 text-sm text-gray-600">
                    <p>
                        <strong>Volatility Interpretation:</strong> {' '}
                        {trends.volatility > 0.5 
                            ? 'High volatility indicates significant price swings and increased investment risk.'
                            : trends.volatility > 0.3
                            ? 'Moderate volatility suggests some price instability but manageable risk.'
                            : 'Low volatility indicates stable pricing with minimal price swings.'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MarketTrendsPanel; 