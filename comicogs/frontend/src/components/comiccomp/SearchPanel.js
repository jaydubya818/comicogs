import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SearchPanel = ({ onSearch, loading, initialQuery = '' }) => {
    const [query, setQuery] = useState(initialQuery);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [searchOptions, setSearchOptions] = useState({
        action: 'research', // 'buy', 'sell', 'research'
        condition: '',
        maxPrice: '',
        minPrice: '',
        gradeMin: '',
        gradeMax: '',
        marketplace: 'all'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim(), searchOptions);
        }
    };

    const handleOptionChange = (option, value) => {
        setSearchOptions(prev => ({
            ...prev,
            [option]: value
        }));
    };

    const exampleSearches = [
        'Amazing Spider-Man #1',
        'Batman #1 1940',
        'X-Men #1 CGC 9.8',
        'Incredible Hulk #181',
        'Superman #1 1939'
    ];

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit}>
                {/* Main Search Input */}
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for comics (e.g., Amazing Spider-Man #1, Batman #1 1940)"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        disabled={loading}
                    />
                </div>

                {/* Search Actions */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">I want to:</label>
                        <select
                            value={searchOptions.action}
                            onChange={(e) => handleOptionChange('action', e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="research">Research</option>
                            <option value="buy">Buy</option>
                            <option value="sell">Sell</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                        <span>Advanced Options</span>
                        <svg 
                            className={`w-4 h-4 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-200 pt-4 mb-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Condition Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                                <select
                                    value={searchOptions.condition}
                                    onChange={(e) => handleOptionChange('condition', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Any Condition</option>
                                    <option value="Mint">Mint</option>
                                    <option value="Near Mint">Near Mint</option>
                                    <option value="Very Fine">Very Fine</option>
                                    <option value="Fine">Fine</option>
                                    <option value="Very Good">Very Good</option>
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                    <option value="Poor">Poor</option>
                                </select>
                            </div>

                            {/* Price Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="number"
                                        placeholder="Min $"
                                        value={searchOptions.minPrice}
                                        onChange={(e) => handleOptionChange('minPrice', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max $"
                                        value={searchOptions.maxPrice}
                                        onChange={(e) => handleOptionChange('maxPrice', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Grade Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CGC Grade Range</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        min="1"
                                        max="10"
                                        step="0.1"
                                        value={searchOptions.gradeMin}
                                        onChange={(e) => handleOptionChange('gradeMin', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        min="1"
                                        max="10"
                                        step="0.1"
                                        value={searchOptions.gradeMax}
                                        onChange={(e) => handleOptionChange('gradeMax', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Marketplace Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Marketplace</label>
                                <select
                                    value={searchOptions.marketplace}
                                    onChange={(e) => handleOptionChange('marketplace', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Marketplaces</option>
                                    <option value="ebay">eBay</option>
                                    <option value="whatnot">Whatnot</option>
                                    <option value="comicconnect">ComicConnect</option>
                                    <option value="heritage">Heritage Auctions</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Search Button */}
                <div className="flex justify-between items-center">
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Analyze Market
                            </>
                        )}
                    </button>

                    {/* Search Tips */}
                    <div className="text-sm text-gray-500">
                        <span className="hidden sm:inline">Try: </span>
                        {exampleSearches.slice(0, 2).map((example, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setQuery(example)}
                                className="text-blue-600 hover:text-blue-800 mx-1 hover:underline"
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </div>
            </form>

            {/* Search Tips */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Search Tips:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Include series name and issue number for best results</li>
                    <li>• Add publication year for vintage comics (e.g., "Batman #1 1940")</li>
                    <li>• Specify grading service and grade (e.g., "CGC 9.8" or "CBCS 9.6")</li>
                    <li>• Use variants and special editions (e.g., "variant cover", "first print")</li>
                </ul>
            </div>
        </div>
    );
};

export default SearchPanel; 