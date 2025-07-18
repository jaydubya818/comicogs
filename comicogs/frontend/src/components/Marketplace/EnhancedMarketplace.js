import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowDownUp, LayoutGrid, List, DollarSign, Shield, Star } from 'lucide-react';

// Mock Data
const mockListings = [
    { id: 1, title: 'Amazing Spider-Man', issue: '300', price: 1250.00, condition: 'CGC 9.8', seller: 'ComicFan82', rating: 4.9, imageUrl: '/placeholder-comic.jpg' },
    { id: 2, title: 'X-Men', issue: '1', price: 8500.00, condition: 'CGC 8.0', seller: 'CollectorX', rating: 4.8, imageUrl: '/placeholder-comic.jpg' },
    { id: 3, title: 'Batman', issue: '181', price: 2300.00, condition: 'CGC 7.5', seller: 'Gothamite', rating: 5.0, imageUrl: '/placeholder-comic.jpg' },
    { id: 4, title: 'Incredible Hulk', issue: '181', price: 4500.00, condition: 'CGC 9.2', seller: 'StrongestThereIs', rating: 4.7, imageUrl: '/placeholder-comic.jpg' },
    { id: 5, title: 'Action Comics', issue: '1', price: 100000.00, condition: 'CGC 0.5', seller: 'SupermanFan', rating: 4.5, imageUrl: '/placeholder-comic.jpg' },
    { id: 6, title: 'Detective Comics', issue: '27', price: 50000.00, condition: 'CGC 1.8', seller: 'BatCollector', rating: 4.9, imageUrl: '/placeholder-comic.jpg' },
    { id: 7, title: 'Fantastic Four', issue: '1', price: 15000.00, condition: 'CGC 6.0', seller: 'Marvelite', rating: 4.7, imageUrl: '/placeholder-comic.jpg' },
    { id: 8, title: 'Giant-Size X-Men', issue: '1', price: 800.00, condition: 'VF/NM', seller: 'XMenLover', rating: 4.6, imageUrl: '/placeholder-comic.jpg' },
];

const FilterSortControls = ({ onFilter, onSort, onLayoutChange, layout }) => (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
                type="text"
                placeholder="Search listings..."
                onChange={(e) => onFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
            />
        </div>
        <div className="flex items-center gap-3">
            <select onChange={(e) => onSort(e.target.value)} className="py-2 px-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="price_desc">Price: High to Low</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="condition_desc">Condition: Best First</option>
                <option value="rating_desc">Seller Rating</option>
            </select>
            <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <button onClick={() => onLayoutChange('grid')} className={`p-2 ${layout === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}><LayoutGrid size={20} /></button>
                <button onClick={() => onLayoutChange('list')} className={`p-2 ${layout === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}><List size={20} /></button>
            </div>
        </div>
    </div>
);

const ListingCard = ({ listing }) => (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-blue-300">
        <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
            <img src={listing.imageUrl} alt={`${listing.title} #${listing.issue}`} className="w-full h-full object-cover" />
        </div>
        <div className="p-4">
            <h3 className="font-semibold text-gray-800 text-lg truncate mb-1">{listing.title} #{listing.issue}</h3>
            <p className="text-blue-600 font-bold text-xl mb-2">${listing.price.toFixed(2)}</p>
            <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">{listing.condition}</span>
                <div className="flex items-center">
                    <span className="mr-1">{listing.seller}</span>
                    <Star size={14} className="text-yellow-500" />
                    <span className="ml-1">{listing.rating}</span>
                </div>
            </div>
        </div>
    </motion.div>
);

const ListingRow = ({ listing }) => (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-lg shadow-sm p-4 flex items-center space-x-4 border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-blue-300">
        <img src={listing.imageUrl} alt={`${listing.title} #${listing.issue}`} className="w-16 h-24 object-cover rounded-md flex-shrink-0" />
        <div className="flex-grow grid grid-cols-3 items-center gap-4">
            <div>
                <h3 className="font-semibold text-gray-800 text-lg">{listing.title} #{listing.issue}</h3>
                <p className="text-gray-600 text-sm">Seller: {listing.seller}</p>
            </div>
            <div className="text-center">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">{listing.condition}</span>
            </div>
            <div className="text-right">
                <p className="text-blue-600 font-bold text-xl">${listing.price.toFixed(2)}</p>
                <div className="flex items-center justify-end text-sm text-gray-600 mt-1">
                    <Star size={14} className="text-yellow-500 mr-1" />
                    <span>{listing.rating}</span>
                </div>
            </div>
        </div>
    </motion.div>
);

const EnhancedMarketplace = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [sort, setSort] = useState('price_desc');
    const [layout, setLayout] = useState('grid');

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setListings(mockListings);
            setLoading(false);
        }, 1000);
    }, []);

    const filteredAndSortedListings = useMemo(() => {
        return listings
            .filter(l => l.title.toLowerCase().includes(filter.toLowerCase()) || l.issue.includes(filter))
            .sort((a, b) => {
                switch (sort) {
                    case 'price_asc': return a.price - b.price;
                    case 'price_desc': return b.price - a.price;
                    case 'condition_desc': return b.condition.localeCompare(a.condition);
                    case 'rating_desc': return b.rating - a.rating;
                    default: return 0;
                }
            });
    }, [listings, filter, sort]);

    if (loading) {
        return <div className="text-center p-10 text-gray-600">Loading marketplace...</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen p-8">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Comicogs Marketplace</h1>
                <p className="text-gray-600">Discover and acquire your next grail comic from a vibrant community of collectors.</p>
            </header>

            <FilterSortControls onFilter={setFilter} onSort={setSort} onLayoutChange={setLayout} layout={layout} />

            <AnimatePresence>
                <motion.div
                    layout
                    className={layout === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "space-y-4"}>
                    {filteredAndSortedListings.length > 0 ? (
                        filteredAndSortedListings.map(listing => (
                            layout === 'grid' ? <ListingCard key={listing.id} listing={listing} /> : <ListingRow key={listing.id} listing={listing} />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full text-center p-10 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600"
                        >
                            <p className="text-lg">No listings found matching your criteria.</p>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default EnhancedMarketplace;