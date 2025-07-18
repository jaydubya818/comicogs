import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Filter, ChevronDown, XCircle } from 'lucide-react';

// Mock Data
const mockComics = [
    { id: 1, title: 'Amazing Spider-Man', issue: '300', publisher: 'Marvel', year: 1988, condition: 'CGC 9.8', imageUrl: '/placeholder-comic.jpg' },
    { id: 2, title: 'X-Men', issue: '1', publisher: 'Marvel', year: 1991, condition: 'CGC 8.0', imageUrl: '/placeholder-comic.jpg' },
    { id: 3, title: 'Batman', issue: '181', publisher: 'DC', year: 1966, condition: 'CGC 7.5', imageUrl: '/placeholder-comic.jpg' },
    { id: 4, title: 'Incredible Hulk', issue: '181', publisher: 'Marvel', year: 1974, condition: 'CGC 9.2', imageUrl: '/placeholder-comic.jpg' },
    { id: 5, title: 'Action Comics', issue: '1', publisher: 'DC', year: 1938, condition: 'CGC 0.5', imageUrl: '/placeholder-comic.jpg' },
    { id: 6, title: 'Detective Comics', issue: '27', publisher: 'DC', year: 1939, condition: 'CGC 1.8', imageUrl: '/placeholder-comic.jpg' },
    { id: 7, title: 'Fantastic Four', issue: '1', publisher: 'Marvel', year: 1961, condition: 'CGC 6.0', imageUrl: '/placeholder-comic.jpg' },
    { id: 8, title: 'Giant-Size X-Men', issue: '1', publisher: 'Marvel', year: 1975, condition: 'VF/NM', imageUrl: '/placeholder-comic.jpg' },
];

const publishers = [...new Set(mockComics.map(c => c.publisher))].sort();
const conditions = [...new Set(mockComics.map(c => c.condition))].sort();
const years = [...new Set(mockComics.map(c => c.year))].sort((a, b) => b - a);

const SearchFilterPanel = ({ filters, setFilters, onSearch }) => {
    const [showFilters, setShowFilters] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            keyword: '',
            publisher: '',
            year: '',
            condition: '',
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Search & Filters</h3>
                <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
                    <Filter size={16} />
                    <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
                    <ChevronDown size={16} className={`${showFilters ? 'rotate-180' : ''} transition-transform`} />
                </button>
            </div>

            <div className="relative mb-4">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    name="keyword"
                    value={filters.keyword}
                    onChange={handleChange}
                    placeholder="Search by title or issue..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                    onKeyPress={(e) => { if (e.key === 'Enter') onSearch(); }}
                />
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label htmlFor="publisher" className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                                <select id="publisher" name="publisher" value={filters.publisher} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Publishers</option>
                                    {publishers.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                <select id="year" name="year" value={filters.year} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Years</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                                <select id="condition" name="condition" value={filters.condition} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Conditions</option>
                                    {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={handleClearFilters} className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                                <XCircle size={14} /> Clear Filters
                            </button>
                            <button onClick={onSearch} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                                Search
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ComicResultCard = ({ comic }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-blue-300"
    >
        <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
            <img src={comic.imageUrl} alt={`${comic.title} #${comic.issue}`} className="w-full h-full object-cover" />
        </div>
        <div className="p-4">
            <h3 className="font-semibold text-gray-800 text-lg truncate mb-1">{comic.title} #{comic.issue}</h3>
            <p className="text-gray-600 text-sm mb-2">{comic.publisher} ({comic.year})</p>
            <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">{comic.condition}</span>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Details</button>
            </div>
        </div>
    </motion.div>
);

const EnhancedSearch = () => {
    const [filters, setFilters] = useState({
        keyword: '',
        publisher: '',
        year: '',
        condition: '',
    });
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const performSearch = () => {
        setLoading(true);
        setError(null);
        // Simulate API call
        setTimeout(() => {
            const filtered = mockComics.filter(comic => {
                const matchesKeyword = filters.keyword ? 
                    (comic.title.toLowerCase().includes(filters.keyword.toLowerCase()) || 
                     comic.issue.includes(filters.keyword)) : true;
                const matchesPublisher = filters.publisher ? comic.publisher === filters.publisher : true;
                const matchesYear = filters.year ? comic.year === parseInt(filters.year) : true;
                const matchesCondition = filters.condition ? comic.condition === filters.condition : true;
                return matchesKeyword && matchesPublisher && matchesYear && matchesCondition;
            });
            setSearchResults(filtered);
            setLoading(false);
        }, 500);
    };

    // Initial search on component mount or when filters change (if desired)
    // useEffect(() => {
    //     performSearch();
    // }, [filters]); // Uncomment to search on filter change

    return (
        <div className="bg-gray-100 min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                <header className="text-center mb-8 pb-4 border-b border-gray-200">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Comicogs Search</h1>
                    <p className="text-gray-600">Find any comic in our extensive database with powerful filters.</p>
                </header>

                <SearchFilterPanel filters={filters} setFilters={setFilters} onSearch={performSearch} />

                <div className="mt-8">
                    {loading ? (
                        <div className="text-center p-10 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600">
                            <div className="h-8 w-8 mx-auto border-t-2 border-blue-500 rounded-full animate-spin mb-4"></div>
                            Searching for comics...
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            <AnimatePresence>
                                {searchResults.map(comic => (
                                    <ComicResultCard key={comic.id} comic={comic} />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="text-center p-10 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600">
                            <SearchIcon size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No results found</h3>
                            <p>Try adjusting your search terms or filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnhancedSearch;
