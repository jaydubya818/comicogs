import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PricingAnalysisPanel from './comiccomp/PricingAnalysisPanel';
import RecommendationsPanel from './comiccomp/RecommendationsPanel';
import MarketTrendsPanel from './comiccomp/MarketTrendsPanel';
import SearchPanel from './comiccomp/SearchPanel';
import LoadingSpinner from './common/LoadingSpinner';

const ComicCompDashboard = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [pricingData, setPricingData] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedComic, setSelectedComic] = useState(null);

    const handleSearch = async (query, options = {}) => {
        setLoading(true);
        setError(null);
        setSearchQuery(query);

        try {
            // Search for pricing data across all marketplaces
            const response = await fetch('/api/comiccomp/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    options: {
                        maxResults: 100,
                        includeTrends: true,
                        includeRecommendations: true,
                        userContext: {
                            action: options.action || 'research',
                            condition: options.condition
                        }
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }

            const data = await response.json();
            setPricingData(data.pricing);
            setRecommendations(data.recommendations);
            
            // Auto-select first comic if available
            if (data.pricing && Object.keys(data.pricing).length > 0) {
                const firstComic = Object.keys(data.pricing)[0];
                setSelectedComic(firstComic);
            }

        } catch (err) {
            console.error('ComicComp search error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleComicSelect = (comicKey) => {
        setSelectedComic(comicKey);
    };

    const selectedPricingData = selectedComic && pricingData ? pricingData[selectedComic] : null;
    const selectedRecommendations = selectedComic && recommendations ? recommendations.comics[selectedComic] : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        ComicComp Live Pricing Intelligence
                    </h1>
                    <p className="text-gray-600 text-lg">
                        AI-powered comic book market analysis and pricing recommendations
                    </p>
                </motion.div>

                {/* Search Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <SearchPanel 
                        onSearch={handleSearch}
                        loading={loading}
                        initialQuery={searchQuery}
                    />
                </motion.div>

                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
                    >
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                                <div className="mt-1 text-sm text-red-700">{error}</div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Loading State */}
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-center items-center py-12"
                    >
                        <LoadingSpinner size="large" />
                        <span className="ml-3 text-gray-600">Analyzing market data...</span>
                    </motion.div>
                )}

                {/* Results */}
                {!loading && pricingData && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Comic Selection & Pricing Analysis */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Comic Selection */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-lg shadow-md p-6"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h3>
                                <div className="space-y-2">
                                    {Object.entries(pricingData).map(([comicKey, data]) => (
                                        <button
                                            key={comicKey}
                                            onClick={() => handleComicSelect(comicKey)}
                                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                                selectedComic === comicKey
                                                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            <div className="font-medium">{comicKey.replace(/-/g, ' ')}</div>
                                            {data.status === 'success' && data.data.statistics && (
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {data.data.filteredListingCount} listings • 
                                                    Median: ${data.data.statistics.median} • 
                                                    Range: ${data.data.statistics.min} - ${data.data.statistics.max}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Pricing Analysis */}
                            {selectedPricingData && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <PricingAnalysisPanel data={selectedPricingData} />
                                </motion.div>
                            )}

                            {/* Market Trends */}
                            {selectedPricingData && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <MarketTrendsPanel data={selectedPricingData} />
                                </motion.div>
                            )}
                        </div>

                        {/* Right Column - Recommendations */}
                        <div className="space-y-6">
                            {selectedRecommendations && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <RecommendationsPanel 
                                        recommendations={selectedRecommendations} 
                                        portfolioRecommendations={recommendations.portfolio}
                                    />
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !pricingData && !error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center py-12"
                    >
                        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Analyze</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Search for any comic book to get comprehensive pricing analysis, 
                            market trends, and AI-powered recommendations.
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ComicCompDashboard; 