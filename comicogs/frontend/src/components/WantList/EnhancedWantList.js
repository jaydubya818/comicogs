import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Tag, Bell, CheckCircle, ShoppingCart, Trash2 } from 'lucide-react';

// Mock Data
const mockWantList = [
    { id: 1, title: 'Saga', issue: '1', priority: 'High', maxPrice: 150.00, notes: 'First printing only', imageUrl: '/placeholder-comic.jpg' },
    { id: 2, title: 'Invincible', issue: '1', priority: 'Medium', maxPrice: 500.00, notes: 'CGC 9.6+', imageUrl: '/placeholder-comic.jpg' },
    { id: 3, title: 'Y: The Last Man', issue: '1', priority: 'Low', maxPrice: 75.00, notes: '', imageUrl: '/placeholder-comic.jpg' },
    { id: 4, title: 'Paper Girls', issue: '1', priority: 'High', maxPrice: 100.00, notes: 'Variant cover', imageUrl: '/placeholder-comic.jpg' },
    { id: 5, title: 'Monstress', issue: '1', priority: 'Medium', maxPrice: 60.00, notes: '', imageUrl: '/placeholder-comic.jpg' },
];

const mockMatches = [
    { id: 101, wantId: 1, title: 'Saga #1', price: 145.00, seller: 'TopComics', url: '#' },
    { id: 102, wantId: 2, title: 'Invincible #1 CGC 9.4', price: 480.00, seller: 'GradedGems', url: '#' },
    { id: 103, wantId: 4, title: 'Paper Girls #1 Variant', price: 95.00, seller: 'ComicDeals', url: '#' },
];

const PriorityBadge = ({ priority }) => {
    const colors = {
        High: 'bg-red-100 text-red-800',
        Medium: 'bg-yellow-100 text-yellow-800',
        Low: 'bg-green-100 text-green-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority]}`}>{priority}</span>;
};

const WantListItem = ({ item, onNotify, onDelete }) => (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-lg shadow-sm p-4 flex items-start space-x-4 border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-blue-300">
        <img src={item.imageUrl} alt={item.title} className="w-16 h-24 object-cover rounded-md flex-shrink-0 border border-gray-200" />
        <div className="flex-grow">
            <h3 className="font-bold text-gray-800 text-lg">{item.title} #{item.issue}</h3>
            <div className="flex items-center gap-2 mt-1">
                <PriorityBadge priority={item.priority} />
                <span className="text-sm text-gray-600">Max Price: ${item.maxPrice.toFixed(2)}</span>
            </div>
            {item.notes && <p className="text-sm text-gray-500 mt-2 italic">Notes: {item.notes}</p>}
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <button onClick={() => onNotify(item.id)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Bell size={18} /></button>
            <button onClick={() => onDelete(item.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={18} /></button>
        </div>
    </motion.div>
);

const MatchItem = ({ match }) => (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
        <div>
            <h4 className="font-semibold text-green-800 text-base">Match found for {match.title}</h4>
            <p className="text-sm text-green-700">Price: <span className="font-bold">${match.price.toFixed(2)}</span> from <span className="font-medium">{match.seller}</span></p>
        </div>
        <a href={match.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">
            <ShoppingCart size={16} />
            <span>View Listing</span>
        </a>
    </motion.div>
);

const EnhancedWantList = () => {
    const [wantList, setWantList] = useState(mockWantList);
    const [matches, setMatches] = useState(mockMatches);

    const handleAdd = () => alert('Add to want list');
    const handleNotify = (id) => alert(`Setup notifications for item ${id}`);
    const handleDelete = (id) => {
        if (window.confirm('Are you sure?')) {
            setWantList(wantList.filter(item => item.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Want List</h1>
                        <p className="text-gray-600 mt-1">Track your most desired comics and get notified of matches.</p>
                    </div>
                    <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 transition-colors">
                        <Plus size={18} />
                        <span>Add to List</span>
                    </button>
                </header>

                {/* Matches Section */}
                <AnimatePresence>
                    {matches.length > 0 && (
                        <motion.div layout className="mb-8 p-4 bg-white rounded-lg shadow-md border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <CheckCircle className="text-green-500" /> Available Matches
                            </h2>
                            <div className="space-y-4">
                                {matches.map(match => <MatchItem key={match.id} match={match} />)}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Want List Section */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Your Wanted Comics</h2>
                    <AnimatePresence>
                        {wantList.length > 0 ? (
                            <div className="space-y-4">
                                {wantList.map(item => (
                                    <WantListItem key={item.id} item={item} onNotify={handleNotify} onDelete={handleDelete} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                                <Tag size={48} className="mx-auto text-gray-400 mb-4" />
                                <h3 className="mt-4 text-xl font-semibold text-gray-800">Your want list is empty</h3>
                                <p className="mt-1 text-gray-600">Click "Add to List" to start tracking comics you desire.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default EnhancedWantList;