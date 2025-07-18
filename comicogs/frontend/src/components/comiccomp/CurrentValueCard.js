/**
 * Task 5: Current Value Card Component
 * Displays current comic value prominently - Acceptance Criteria 1
 */

import React from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../common/LoadingSpinner';

const CurrentValueCard = ({ data, loading, formatPrice }) => {
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-md p-6 h-full"
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Market Value</h3>
                <div className="flex items-center justify-center h-48">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Market Value</h3>
                <div className="text-center py-16">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    </div>
                    <p className="text-gray-500">No pricing data available</p>
                </div>
            </motion.div>
        );
    }

    const { current_value, market_activity, condition_breakdown, data_quality } = data;

    // Determine confidence level and color
    const getConfidenceInfo = (confidence) => {
        if (confidence >= 0.8) {
            return { level: 'High', color: 'text-green-600', bg: 'bg-green-100' };
        } else if (confidence >= 0.6) {
            return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        } else {
            return { level: 'Low', color: 'text-red-600', bg: 'bg-red-100' };
        }
    };

    const confidenceInfo = getConfidenceInfo(current_value?.confidence || 0);

    // Get data quality badge
    const getDataQualityBadge = (score) => {
        if (score >= 0.8) return { text: 'Excellent', bg: 'bg-green-100', color: 'text-green-800' };
        if (score >= 0.6) return { text: 'Good', bg: 'bg-yellow-100', color: 'text-yellow-800' };
        return { text: 'Limited', bg: 'bg-red-100', color: 'text-red-800' };
    };

    const qualityBadge = getDataQualityBadge(data_quality?.score || 0);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-md p-6 h-full"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Current Market Value</h3>
                <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${qualityBadge.bg} ${qualityBadge.color}`}>
                        {qualityBadge.text} Data
                    </span>
                    <span className="text-xs text-gray-500">
                        Last updated: {new Date(data.last_updated).toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* Main Value Display */}
            <div className="text-center mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-2"
                >
                    <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-1">
                        {formatPrice(current_value?.market_price)}
                    </div>
                    <div className="text-sm text-gray-500">Current Market Price</div>
                </motion.div>

                {/* Price Range */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-4"
                >
                    <div className="text-lg text-gray-600">
                        Range: {formatPrice(current_value?.price_range?.min)} - {formatPrice(current_value?.price_range?.max)}
                    </div>
                </motion.div>

                {/* Confidence Level */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center"
                >
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${confidenceInfo.bg} ${confidenceInfo.color}`}>
                        {confidenceInfo.level} Confidence ({Math.round((current_value?.confidence || 0) * 100)}%)
                    </span>
                </motion.div>
            </div>

            {/* Market Activity Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-blue-50 rounded-lg p-4 text-center"
                >
                    <div className="text-2xl font-bold text-blue-600">{market_activity?.total_listings || 0}</div>
                    <div className="text-sm text-blue-700">Total Listings</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-green-50 rounded-lg p-4 text-center"
                >
                    <div className="text-2xl font-bold text-green-600">{market_activity?.recent_sales || 0}</div>
                    <div className="text-sm text-green-700">Recent Sales</div>
                </motion.div>
            </div>

            {/* Market Breakdown */}
            <div className="space-y-3 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex justify-between items-center"
                >
                    <span className="text-sm text-gray-600">Auction Listings</span>
                    <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">
                            {market_activity?.auction_listings || 0}
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ 
                                    width: `${market_activity?.total_listings > 0 
                                        ? (market_activity.auction_listings / market_activity.total_listings) * 100 
                                        : 0}%` 
                                }}
                            ></div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex justify-between items-center"
                >
                    <span className="text-sm text-gray-600">Fixed Price</span>
                    <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">
                            {market_activity?.fixed_price_listings || 0}
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-green-600 h-2 rounded-full"
                                style={{ 
                                    width: `${market_activity?.total_listings > 0 
                                        ? (market_activity.fixed_price_listings / market_activity.total_listings) * 100 
                                        : 0}%` 
                                }}
                            ></div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Condition Breakdown */}
            {condition_breakdown && Object.keys(condition_breakdown).length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="border-t pt-4"
                >
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Price by Condition</h4>
                    <div className="space-y-2">
                        {Object.entries(condition_breakdown)
                            .sort(([,a], [,b]) => (b.average || 0) - (a.average || 0))
                            .slice(0, 3) // Show top 3 conditions
                            .map(([condition, data], index) => (
                                <div key={condition} className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600 truncate max-w-20">
                                        {condition}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-medium text-gray-900">
                                            {formatPrice(data.average)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            ({data.count})
                                        </span>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </motion.div>
            )}

            {/* Real-time Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="flex items-center justify-center mt-4 pt-4 border-t"
            >
                <div className="flex items-center text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Real-time pricing data
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CurrentValueCard; 