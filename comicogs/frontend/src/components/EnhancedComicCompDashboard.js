import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BarChart2, Zap, TrendingUp, Shield, Star, CheckCircle, XCircle } from 'lucide-react';

// Mock API functions - replace with your actual API calls
const searchComics = async (query) => {
    console.log(`Searching for: ${query}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (query.toLowerCase().includes('fail')) {
        throw new Error('Failed to fetch comic data. Please try again.');
    }

    // Return mock data
    return {
        'amazing-spider-man-300': {
            title: 'Amazing Spider-Man #300',
            grade: 'CGC 9.8',
            currentValue: 1250.00,
            valueChange: 75.50,
            marketTrend: 'up',
            recommendation: 'Hold',
            confidence: 0.92,
            imageUrl: '/placeholder-comic.jpg',
        },
        'x-men-1': {
            title: 'X-Men #1',
            grade: 'CGC 8.0',
            currentValue: 8500.00,
            valueChange: -200.00,
            marketTrend: 'down',
            recommendation: 'Sell',
            confidence: 0.85,
            imageUrl: '/placeholder-comic.jpg',
        },
        'batman-181': {
            title: 'Batman #181',
            grade: 'CGC 7.5',
            currentValue: 2300.00,
            valueChange: 150.00,
            marketTrend: 'up',
            recommendation: 'Hold',
            confidence: 0.90,
            imageUrl: '/placeholder-comic.jpg',
        },
        'incredible-hulk-181': {
            title: 'Incredible Hulk #181',
            grade: 'CGC 9.2',
            currentValue: 4500.00,
            valueChange: -50.00,
            marketTrend: 'down',
            recommendation: 'Monitor',
            confidence: 0.88,
            imageUrl: '/placeholder-comic.jpg',
        },
    };
};

const SearchBar = ({ onSearch, loading }) => {
    const [query, setQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a comic (e.g., 'Amazing Spider-Man 300')"
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm"
                disabled={loading}
            />
            {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>}
        </form>
    );
};

const ComicCard = ({ comic, onSelect, isSelected }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        onClick={() => onSelect(comic)}
        className={`p-4 border border-gray-200 rounded-md cursor-pointer transition-all duration-300 hover:shadow-md hover:border-blue-300 ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'bg-white'}`}>
        <div className="flex items-center space-x-4">
            <img src={comic.imageUrl} alt={comic.title} className="w-16 h-24 object-cover rounded-sm border border-gray-200" />
            <div className="flex-grow">
                <h3 className="font-semibold text-gray-800 text-base">{comic.title}</h3>
                <p className="text-gray-600 text-sm">{comic.grade}</p>
                <div className="flex items-center mt-2">
                    <p className={`font-bold text-lg ${comic.marketTrend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        ${comic.currentValue.toFixed(2)}
                    </p>
                    <TrendingUp className={`ml-2 h-5 w-5 ${comic.marketTrend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
                </div>
            </div>
            {isSelected && <CheckCircle className="text-blue-500 h-6 w-6 flex-shrink-0" />}
        </div>
    </motion.div>
);

const DetailPanel = ({ comic }) => {
    if (!comic) return null;

    const details = [
        { icon: BarChart2, label: 'Market Trend', value: comic.marketTrend, color: comic.marketTrend === 'up' ? 'text-green-600' : 'text-red-600' },
        { icon: Zap, label: 'Recommendation', value: comic.recommendation, color: 'text-blue-600' },
        { icon: Shield, label: 'Confidence', value: `${(comic.confidence * 100).toFixed(0)}%`, color: 'text-indigo-600' },
        { icon: Star, label: 'Value Change', value: `${comic.valueChange > 0 ? '+' : ''}$${comic.valueChange.toFixed(2)}`, color: comic.valueChange > 0 ? 'text-green-600' : 'text-red-600' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center space-x-6 mb-6 pb-4 border-b border-gray-200">
                <img src={comic.imageUrl} alt={comic.title} className="w-24 h-36 object-cover rounded-sm shadow-sm border border-gray-200" />
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{comic.title}</h2>
                    <p className="text-lg text-gray-600 mb-2">{comic.grade}</p>
                    <p className={`text-3xl font-bold ${comic.marketTrend === 'up' ? 'text-green-700' : 'text-red-700'}`}>
                        ${comic.currentValue.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {details.map(detail => (
                    <div key={detail.label} className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                        <detail.icon className={`h-6 w-6 mr-3 ${detail.color}`} />
                        <div>
                            <p className="text-sm text-gray-500">{detail.label}</p>
                            <p className={`font-semibold text-base ${detail.color}`}>{detail.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const EnhancedComicCompDashboard = () => {
    const [comics, setComics] = useState(null);
    const [selectedComic, setSelectedComic] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = useCallback(async (query) => {
        setLoading(true);
        setError(null);
        setComics(null);
        setSelectedComic(null);
        try {
            const results = await searchComics(query);
            setComics(results);
            if (results && Object.keys(results).length > 0) {
                setSelectedComic(results[Object.keys(results)[0]]);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <header className="text-center mb-8 pb-4 border-b border-gray-200">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-2">
                        ComicComp Intelligence
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">Your AI-powered comic investment guide</p>
                </header>

                <main>
                    <div className="max-w-2xl mx-auto mb-8">
                        <SearchBar onSearch={handleSearch} loading={loading} />
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="flex items-center justify-center p-4 mb-6 bg-red-100 text-red-700 rounded-md shadow-sm border border-red-200">
                                <XCircle className="h-5 w-5 mr-3" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <AnimatePresence>
                                {loading && !comics && (
                                    <motion.div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
                                        <div className="h-8 w-8 mx-auto border-t-2 border-blue-500 rounded-full animate-spin"></div>
                                        <p className="mt-4 text-gray-600">Analyzing the market...</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <AnimatePresence>
                                {comics && (
                                    <motion.div className="space-y-4">
                                        {Object.values(comics).map(comic => (
                                            <ComicCard
                                                key={comic.title + comic.grade}
                                                comic={comic}
                                                onSelect={setSelectedComic}
                                                isSelected={selectedComic && selectedComic.title === comic.title && selectedComic.grade === comic.grade}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {!loading && !comics && !error && (
                                <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
                                    <BarChart2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <h3 className="mt-4 text-xl font-semibold text-gray-800">Ready for Analysis</h3>
                                    <p className="mt-1 text-gray-600">Search for a comic to begin.</p>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-2">
                            <AnimatePresence mode="wait">
                                {selectedComic && (
                                    <motion.div
                                        key={selectedComic.title + selectedComic.grade}
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <DetailPanel comic={selectedComic} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EnhancedComicCompDashboard;