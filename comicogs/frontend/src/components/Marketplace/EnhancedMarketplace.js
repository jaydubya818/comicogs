import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowDownUp, LayoutGrid, List, DollarSign, Shield, Star } from 'lucide-react';

// Mock Data
const mockListings = [
    { id: 1, title: 'Amazing Spider-Man', issue: '300', price: 1250.00, condition: 'CGC 9.8', seller: 'ComicFan82', rating: 4.9, imageUrl: '/placeholder-comic.jpg' },
    { id: 2, title: 'X-Men', issue: '1', price: 8500.00, condition: 'CGC 8.0', seller: 'CollectorX', rating: 4.8, imageUrl: '/placeholder-comic.jpg' },
    { id: 3, title: 'Batman', issue: '181', price: 2300.00, condition: 'CGC 7.5', seller: 'Gothamite', rating: 5.0, imageUrl: '/placeholder-comic.jpg' },
    { id: 4, title: 'Incredible Hulk', issue: '181', price: 4500.00, condition: 'CGC 9.2', seller: 'StrongestThereIs', rating: 4.7, imageUrl: '/placeholder-comic.jpg' },
    // ... add more mock listings
];

const FilterSortControls = ({ onFilter, onSort, onLayoutChange, layout }) => (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="relative min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                placeholder="Search listings..."
                onChange={(e) => onFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-2 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
        <div className="flex items-center gap-4">
            <select onChange={(e) => onSort(e.target.value)} className="py-2 px-4 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="price_desc">Price: High to Low</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="condition_desc">Condition: Best First</option>
                <option value="rating_desc">Seller Rating</option>
            </select>
            <div className="flex items-center gap-2">
                <button onClick={() => onLayoutChange('grid')} className={`p-2 rounded-full ${layout === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}><LayoutGrid /></button>
                <button onClick={() => onLayoutChange('list')} className={`p-2 rounded-full ${layout === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}><List /></button>
            </div>
        </div>
    </div>
);

const ListingCard = ({ listing }) => (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl shadow-md overflow-hidden group transition-transform transform hover:-translate-y-1">
        <div className="h-48 bg-gray-200 overflow-hidden">
            <img src={listing.imageUrl} alt={`${listing.title} #${listing.issue}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-4">
            <h3 className="font-bold text-lg truncate">{listing.title} #{listing.issue}</h3>
            <div className="flex items-center justify-between mt-2">
                <p className="font-semibold text-xl text-blue-600">${listing.price.toFixed(2)}</p>
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{listing.condition}</div>
            </div>
            <div className="flex items-center text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                <span>{listing.seller}</span>
                <Star className="ml-auto mr-1 h-4 w-4 text-yellow-400" />
                <span>{listing.rating}</span>
            </div>
        </div>
    </motion.div>
);

const ListingRow = ({ listing }) => (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-lg shadow-sm p-4 flex items-center space-x-4 transition-shadow hover:shadow-md">
        <img src={listing.imageUrl} alt={`${listing.title} #${listing.issue}`} className="w-12 h-16 object-cover rounded-md" />
        <div className="flex-grow grid grid-cols-4 gap-4 items-center">
            <h3 className="font-semibold col-span-2">{listing.title} #{listing.issue}</h3>
            <div className="text-center">
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium inline-block">{listing.condition}</div>
            </div>
            <p className="font-semibold text-lg text-blue-600 text-right">${listing.price.toFixed(2)}</p>
        </div>
        <div className="flex items-center text-sm text-gray-500">
            <span>{listing.seller}</span>
            <Star className="ml-2 mr-1 h-4 w-4 text-yellow-400" />
            <span>{listing.rating}</span>
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
            .filter(l => l.title.toLowerCase().includes(filter.toLowerCase()))
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
        return <div className="text-center p-10">Loading...</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen p-8">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900">Marketplace</h1>
                <p className="text-gray-600 mt-2">Discover and acquire your next grail comic.</p>
            </header>

            <FilterSortControls onFilter={setFilter} onSort={setSort} onLayoutChange={setLayout} layout={layout} />

            <AnimatePresence>
                <motion.div
                    layout
                    className={layout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
                    {filteredAndSortedListings.map(listing => (
                        layout === 'grid' ? <ListingCard key={listing.id} listing={listing} /> : <ListingRow key={listing.id} listing={listing} />
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default EnhancedMarketplace;
