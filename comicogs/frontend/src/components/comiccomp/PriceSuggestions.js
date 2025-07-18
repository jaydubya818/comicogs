/**
 * Task 5: Price Suggestions Component
 * Suggested list price with confidence interval - Acceptance Criteria 4
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../common/LoadingSpinner';

const PriceSuggestions = ({ data, loading, formatPrice }) => {
    const [selectedAction, setSelectedAction] = useState('sell');

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-md p-6 h-full"
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Suggestions</h3>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Suggestions</h3>
                <div className="text-center py-16">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    </div>
                    <p className="text-gray-500">No price suggestions available</p>
                </div>
            </motion.div>
        );
    }

    const { pricing_suggestions, timing_advice, risk_assessment, recommendations, confidence } = data;

    // Get confidence level styling
    const getConfidenceStyle = (level) => {
        if (level >= 0.8) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
        if (level >= 0.6) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
    };

    const confidenceStyle = getConfidenceStyle(confidence || 0);

    // Get risk level styling
    const getRiskStyle = (level) => {
        switch (level?.toLowerCase()) {
            case 'low':
                return { icon: '🟢', color: 'text-green-600', bg: 'bg-green-50' };
            case 'medium':
                return { icon: '🟡', color: 'text-yellow-600', bg: 'bg-yellow-50' };
            case 'high':
                return { icon: '🔴', color: 'text-red-600', bg: 'bg-red-50' };
            default:
                return { icon: '⚪', color: 'text-gray-600', bg: 'bg-gray-50' };
        }
    };

    const riskStyle = getRiskStyle(risk_assessment?.risk_level);

    // Get urgency styling
    const getUrgencyStyle = (score) => {
        if (score >= 80) return { level: 'High', color: 'text-red-600', bg: 'bg-red-100' };
        if (score >= 50) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
    };

    const urgencyStyle = getUrgencyStyle(timing_advice?.urgency_score || 0);

    // Filter recommendations by type
    const pricingRecs = recommendations?.filter(r => r.type === 'pricing_strategy') || [];
    const timingRecs = recommendations?.filter(r => r.type === 'timing_advice') || [];
    const riskRecs = recommendations?.filter(r => r.type === 'risk_assessment') || [];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-md p-6 h-full"
        >
            {/* Header with Confidence */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">AI Price Suggestions</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${confidenceStyle.bg} ${confidenceStyle.text} border ${confidenceStyle.border}`}>
                    {Math.round((confidence || 0) * 100)}% Confidence
                </span>
            </div>

            {/* Recommended Price Section */}
            {pricing_suggestions && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-blue-50 rounded-lg p-6 mb-6 border-2 border-blue-200"
                >
                    <div className="text-center mb-4">
                        <h4 className="text-lg font-medium text-blue-900 mb-2">Recommended List Price</h4>
                        <div className="text-3xl font-bold text-blue-700 mb-2">
                            {formatPrice(pricing_suggestions.recommended_price)}
                        </div>
                        <div className="text-sm text-blue-600">
                            Based on current market analysis
                        </div>
                    </div>

                    {/* Price Range */}
                    {pricing_suggestions.price_range && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-blue-100 rounded-lg">
                                <div className="text-lg font-semibold text-blue-700">
                                    {formatPrice(pricing_suggestions.price_range.conservative)}
                                </div>
                                <div className="text-xs text-blue-600">Conservative</div>
                            </div>
                            <div className="text-center p-3 bg-blue-100 rounded-lg">
                                <div className="text-lg font-semibold text-blue-700">
                                    {formatPrice(pricing_suggestions.price_range.aggressive)}
                                </div>
                                <div className="text-xs text-blue-600">Aggressive</div>
                            </div>
                        </div>
                    )}

                    {/* Confidence Interval */}
                    {pricing_suggestions.confidence_interval && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4 p-3 bg-white rounded border"
                        >
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Confidence Interval:</span>
                                <span className="font-medium text-gray-900">
                                    {Math.round(pricing_suggestions.confidence_interval.lower * 100)}% - {Math.round(pricing_suggestions.confidence_interval.upper * 100)}%
                                </span>
                            </div>
                            <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ 
                                            width: `${(pricing_suggestions.confidence_interval.level || 0) * 100}%`,
                                            marginLeft: `${(pricing_suggestions.confidence_interval.lower || 0) * 100}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Timing & Risk Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Timing Advice */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`p-4 rounded-lg ${urgencyStyle.bg}`}
                >
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Market Timing</h4>
                    <div className="text-center">
                        <div className={`text-lg font-bold ${urgencyStyle.color}`}>
                            {urgencyStyle.level}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">Urgency</div>
                        <div className="text-xs text-gray-500">
                            {timing_advice?.optimal_timing || 'Analyzing...'}
                        </div>
                    </div>
                </motion.div>

                {/* Risk Assessment */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`p-4 rounded-lg ${riskStyle.bg}`}
                >
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Level</h4>
                    <div className="text-center">
                        <div className="text-2xl mb-1">{riskStyle.icon}</div>
                        <div className={`text-lg font-bold ${riskStyle.color}`}>
                            {risk_assessment?.risk_level || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-600">Market Risk</div>
                    </div>
                </motion.div>
            </div>

            {/* Market Conditions */}
            {timing_advice && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gray-50 rounded-lg p-4 mb-6"
                >
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Market Conditions</h4>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Overall Conditions:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                            timing_advice.market_conditions === 'favorable' 
                                ? 'bg-green-100 text-green-800'
                                : timing_advice.market_conditions === 'unfavorable'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {timing_advice.market_conditions || 'Neutral'}
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Top Recommendations */}
            {recommendations && recommendations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="border-t pt-4"
                >
                    <h4 className="text-sm font-medium text-gray-700 mb-4">AI Recommendations</h4>
                    <div className="space-y-3">
                        {recommendations.slice(0, 3).map((rec, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + index * 0.1 }}
                                className="flex items-start p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex-shrink-0 mr-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                        rec.priority >= 8 ? 'bg-red-100 text-red-700' :
                                        rec.priority >= 6 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                        {rec.priority || '?'}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-medium text-gray-900 mb-1">
                                        {rec.title}
                                    </h5>
                                    <p className="text-xs text-gray-600 mb-2">
                                        {rec.description}
                                    </p>
                                    {rec.confidence && (
                                        <div className="flex items-center">
                                            <span className="text-xs text-gray-500 mr-2">Confidence:</span>
                                            <div className="w-16 bg-gray-200 rounded-full h-1">
                                                <div 
                                                    className="bg-blue-600 h-1 rounded-full"
                                                    style={{ width: `${rec.confidence * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-500 ml-2">
                                                {Math.round(rec.confidence * 100)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Risk Factors */}
            {risk_assessment?.risk_factors && risk_assessment.risk_factors.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="mt-6 pt-4 border-t"
                >
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Risk Factors</h4>
                    <div className="space-y-2">
                        {risk_assessment.risk_factors.slice(0, 2).map((factor, index) => (
                            <div key={index} className="flex items-start">
                                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                <p className="text-xs text-gray-600">{factor}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Mitigation Strategies */}
            {risk_assessment?.mitigation_strategies && risk_assessment.mitigation_strategies.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="mt-4"
                >
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Recommended Actions</h4>
                    <div className="space-y-2">
                        {risk_assessment.mitigation_strategies.slice(0, 2).map((strategy, index) => (
                            <div key={index} className="flex items-start">
                                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                <p className="text-xs text-gray-600">{strategy}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Generation timestamp */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="flex items-center justify-center mt-6 pt-4 border-t"
            >
                <div className="flex items-center text-xs text-gray-500">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                    AI-powered suggestions • Updated {data.generated_at ? new Date(data.generated_at).toLocaleTimeString() : 'now'}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PriceSuggestions; 