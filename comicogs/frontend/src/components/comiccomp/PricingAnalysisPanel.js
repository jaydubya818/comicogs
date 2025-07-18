import React from 'react';
import { motion } from 'framer-motion';

const PricingAnalysisPanel = ({ data }) => {
    if (!data || data.status !== 'success') {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Analysis</h3>
                <div className="text-center py-8">
                    <p className="text-gray-500">
                        {data?.status === 'insufficient_data' 
                            ? `Insufficient data (${data.listingCount}/${data.minRequired} required)`
                            : 'No pricing data available'
                        }
                    </p>
                </div>
            </div>
        );
    }

    const { statistics, dataQuality, conditionPricing, rawListingCount, filteredListingCount, outlierCount } = data.data;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(price);
    };

    const getDataQualityColor = (score) => {
        if (score >= 0.8) return 'text-green-600';
        if (score >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getDataQualityBadge = (score) => {
        if (score >= 0.8) return { text: 'Excellent', bg: 'bg-green-100', color: 'text-green-800' };
        if (score >= 0.6) return { text: 'Good', bg: 'bg-yellow-100', color: 'text-yellow-800' };
        return { text: 'Limited', bg: 'bg-red-100', color: 'text-red-800' };
    };

    const qualityBadge = getDataQualityBadge(dataQuality.score);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Pricing Analysis</h3>
                <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${qualityBadge.bg} ${qualityBadge.color}`}>
                        {qualityBadge.text} Data
                    </span>
                    <span className="text-sm text-gray-500">
                        {filteredListingCount} of {rawListingCount} listings
                    </span>
                </div>
            </div>

            {/* Key Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center p-4 bg-blue-50 rounded-lg"
                >
                    <div className="text-2xl font-bold text-blue-600">{formatPrice(statistics.median)}</div>
                    <div className="text-sm text-blue-700">Median Price</div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center p-4 bg-green-50 rounded-lg"
                >
                    <div className="text-2xl font-bold text-green-600">{formatPrice(statistics.mean)}</div>
                    <div className="text-sm text-green-700">Average Price</div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center p-4 bg-purple-50 rounded-lg"
                >
                    <div className="text-2xl font-bold text-purple-600">
                        {formatPrice(statistics.min)} - {formatPrice(statistics.max)}
                    </div>
                    <div className="text-sm text-purple-700">Price Range</div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center p-4 bg-orange-50 rounded-lg"
                >
                    <div className="text-2xl font-bold text-orange-600">{statistics.count}</div>
                    <div className="text-sm text-orange-700">Active Listings</div>
                </motion.div>
            </div>

            {/* Price Distribution */}
            <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Price Distribution</h4>
                <div className="grid grid-cols-5 gap-2 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-medium text-gray-900">{formatPrice(statistics.percentiles.p10)}</div>
                        <div className="text-gray-600">10th %</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-medium text-gray-900">{formatPrice(statistics.percentiles.p25)}</div>
                        <div className="text-gray-600">25th %</div>
                    </div>
                    <div className="text-center p-2 bg-blue-100 rounded">
                        <div className="font-medium text-blue-900">{formatPrice(statistics.median)}</div>
                        <div className="text-blue-700">Median</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-medium text-gray-900">{formatPrice(statistics.percentiles.p75)}</div>
                        <div className="text-gray-600">75th %</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-medium text-gray-900">{formatPrice(statistics.percentiles.p90)}</div>
                        <div className="text-gray-600">90th %</div>
                    </div>
                </div>
            </div>

            {/* Market Volatility */}
            <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Market Volatility</h4>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <div className="text-sm text-gray-600">Coefficient of Variation</div>
                        <div className="font-medium text-gray-900">
                            {Math.round(statistics.coefficientOfVariation * 100)}%
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Standard Deviation</div>
                        <div className="font-medium text-gray-900">{formatPrice(statistics.standardDeviation)}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Volatility Level</div>
                        <div className={`font-medium ${
                            statistics.coefficientOfVariation > 0.5 ? 'text-red-600' :
                            statistics.coefficientOfVariation > 0.3 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                            {statistics.coefficientOfVariation > 0.5 ? 'High' :
                             statistics.coefficientOfVariation > 0.3 ? 'Moderate' : 'Low'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Condition-Specific Pricing */}
            {conditionPricing && Object.keys(conditionPricing).length > 0 && (
                <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Pricing by Condition</h4>
                    <div className="space-y-2">
                        {Object.entries(conditionPricing)
                            .sort(([,a], [,b]) => b.average - a.average)
                            .map(([condition, pricing]) => (
                            <div key={condition} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">{condition}</div>
                                    <div className="text-sm text-gray-600">{pricing.count} listings</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium text-gray-900">{formatPrice(pricing.average)}</div>
                                    <div className="text-sm text-gray-600">
                                        {formatPrice(pricing.min)} - {formatPrice(pricing.max)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Data Quality Details */}
            <div className="border-t border-gray-200 pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Data Quality Assessment</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                        <div className={`text-lg font-bold ${getDataQualityColor(dataQuality.score)}`}>
                            {Math.round(dataQuality.score * 100)}%
                        </div>
                        <div className="text-gray-600">Overall Score</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                            {Math.round(dataQuality.outlierRate * 100)}%
                        </div>
                        <div className="text-gray-600">Outliers Removed</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{dataQuality.marketplaceDiversity}</div>
                        <div className="text-gray-600">Marketplaces</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{Math.round(dataQuality.timeSpanDays)}</div>
                        <div className="text-gray-600">Days of Data</div>
                    </div>
                </div>
                
                {outlierCount > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-yellow-800">
                                {outlierCount} outlier{outlierCount > 1 ? 's' : ''} removed from analysis 
                                (extreme prices that may indicate errors or unique circumstances)
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PricingAnalysisPanel; 