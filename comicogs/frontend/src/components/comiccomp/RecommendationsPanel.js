import React, { useState } from 'react';
import { motion } from 'framer-motion';

const RecommendationsPanel = ({ recommendations, portfolioRecommendations }) => {
    const [activeTab, setActiveTab] = useState('comic');

    if (!recommendations && !portfolioRecommendations) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
                <div className="text-center py-8">
                    <p className="text-gray-500">No recommendations available</p>
                </div>
            </div>
        );
    }

    const getRecommendationIcon = (type) => {
        switch (type) {
            case 'pricing_strategy':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                );
            case 'market_opportunity':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                );
            case 'timing_advice':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'risk_assessment':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case 'condition_advice':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

    const getActionColor = (action) => {
        switch (action) {
            case 'buy': return 'text-green-600 bg-green-50 border-green-200';
            case 'sell': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'hold': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'caution': return 'text-red-600 bg-red-50 border-red-200';
            case 'research': return 'text-purple-600 bg-purple-50 border-purple-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getPriorityBadge = (priority) => {
        if (priority >= 8) return { text: 'High', color: 'bg-red-100 text-red-800' };
        if (priority >= 6) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
        return { text: 'Low', color: 'bg-green-100 text-green-800' };
    };

    const getConfidenceBadge = (confidence) => {
        if (confidence >= 0.8) return { text: 'High', color: 'bg-green-100 text-green-800' };
        if (confidence >= 0.6) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
        return { text: 'Low', color: 'bg-red-100 text-red-800' };
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(price);
    };

    return (
        <div className="bg-white rounded-lg shadow-md">
            {/* Tab Headers */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6 pt-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('comic')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'comic'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Comic Analysis
                        {recommendations && (
                            <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                                {recommendations.recommendations.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('portfolio')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'portfolio'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Portfolio
                        {portfolioRecommendations && (
                            <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                                {portfolioRecommendations.recommendations.length}
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            <div className="p-6">
                {/* Comic Recommendations Tab */}
                {activeTab === 'comic' && recommendations && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
                            <div className="flex items-center space-x-2">
                                {(() => {
                                    const confBadge = getConfidenceBadge(recommendations.confidence);
                                    return (
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${confBadge.color}`}>
                                            {confBadge.text} Confidence
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {recommendations.recommendations.map((rec, index) => {
                                const priorityBadge = getPriorityBadge(rec.priority);
                                const confBadge = getConfidenceBadge(rec.confidence);
                                
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`border rounded-lg p-4 ${getActionColor(rec.action)}`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                {getRecommendationIcon(rec.type)}
                                                <h4 className="font-medium text-gray-900">{rec.title}</h4>
                                            </div>
                                            <div className="flex space-x-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityBadge.color}`}>
                                                    {priorityBadge.text}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${confBadge.color}`}>
                                                    {Math.round(rec.confidence * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <p className="text-gray-700 mb-2">{rec.description}</p>
                                        
                                        {rec.rationale && (
                                            <p className="text-sm text-gray-600 mb-3">
                                                <span className="font-medium">Reasoning:</span> {rec.rationale}
                                            </p>
                                        )}

                                        {/* Specific Data Display */}
                                        {rec.data && (
                                            <div className="mt-3 space-y-2">
                                                {rec.data.suggestedPrice && (
                                                    <div className="flex justify-between items-center p-2 bg-white bg-opacity-50 rounded">
                                                        <span className="text-sm font-medium">Suggested Price:</span>
                                                        <span className="text-sm font-bold">{formatPrice(rec.data.suggestedPrice)}</span>
                                                    </div>
                                                )}
                                                
                                                {rec.data.maxBuyPrice && (
                                                    <div className="flex justify-between items-center p-2 bg-white bg-opacity-50 rounded">
                                                        <span className="text-sm font-medium">Max Buy Price:</span>
                                                        <span className="text-sm font-bold">{formatPrice(rec.data.maxBuyPrice)}</span>
                                                    </div>
                                                )}

                                                {rec.data.priceRange && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="p-2 bg-white bg-opacity-50 rounded text-center">
                                                            <div className="text-xs text-gray-600">Conservative</div>
                                                            <div className="text-sm font-medium">{formatPrice(rec.data.priceRange.conservative)}</div>
                                                        </div>
                                                        <div className="p-2 bg-white bg-opacity-50 rounded text-center">
                                                            <div className="text-xs text-gray-600">Aggressive</div>
                                                            <div className="text-sm font-medium">{formatPrice(rec.data.priceRange.aggressive)}</div>
                                                        </div>
                                                    </div>
                                                )}

                                                {rec.data.projectedGrowth && (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="p-2 bg-white bg-opacity-50 rounded text-center">
                                                            <div className="text-xs text-gray-600">1 Month</div>
                                                            <div className="text-sm font-medium">{rec.data.projectedGrowth['1_month']}%</div>
                                                        </div>
                                                        <div className="p-2 bg-white bg-opacity-50 rounded text-center">
                                                            <div className="text-xs text-gray-600">3 Months</div>
                                                            <div className="text-sm font-medium">{rec.data.projectedGrowth['3_month']}%</div>
                                                        </div>
                                                        <div className="p-2 bg-white bg-opacity-50 rounded text-center">
                                                            <div className="text-xs text-gray-600">6 Months</div>
                                                            <div className="text-sm font-medium">{rec.data.projectedGrowth['6_month']}%</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Portfolio Recommendations Tab */}
                {activeTab === 'portfolio' && portfolioRecommendations && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Analysis</h3>
                        
                        {/* Portfolio Summary */}
                        {portfolioRecommendations.summary && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Portfolio Summary</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Total Comics:</span>
                                        <span className="ml-2 font-medium">{portfolioRecommendations.summary.totalComics}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Avg Confidence:</span>
                                        <span className="ml-2 font-medium">
                                            {Math.round(portfolioRecommendations.summary.averageConfidence * 100)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Risk Profile */}
                        {portfolioRecommendations.riskProfile && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
                                <div className="flex items-center">
                                    <span className="text-gray-600">Overall Risk Level:</span>
                                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                        portfolioRecommendations.riskProfile === 'high' ? 'bg-red-100 text-red-800' :
                                        portfolioRecommendations.riskProfile === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                        {portfolioRecommendations.riskProfile.charAt(0).toUpperCase() + portfolioRecommendations.riskProfile.slice(1)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Portfolio Recommendations */}
                        {portfolioRecommendations.recommendations.length > 0 ? (
                            <div className="space-y-4">
                                {portfolioRecommendations.recommendations.map((rec, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="border border-gray-200 rounded-lg p-4"
                                    >
                                        <h4 className="font-medium text-gray-900 mb-2">{rec.title}</h4>
                                        <p className="text-gray-700">{rec.description}</p>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No portfolio recommendations available</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Analyze more comics to get comprehensive portfolio insights
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!recommendations && !portfolioRecommendations && (
                    <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
                        <p className="text-gray-600">
                            Search for a comic to get AI-powered pricing recommendations and market insights.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecommendationsPanel; 