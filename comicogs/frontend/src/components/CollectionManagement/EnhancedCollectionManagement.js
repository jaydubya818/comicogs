import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Filter, ChevronDown, Edit, Trash2, MoreVertical, X } from 'lucide-react';

// Mock Data
const mockCollection = [
    { id: 1, title: 'Amazing Spider-Man', issue: '300', grade: 'CGC 9.8', value: 1250.00, purchasePrice: 800.00, dateAdded: '2023-05-10', imageUrl: '/placeholder-comic.jpg' },
    { id: 2, title: 'X-Men', issue: '1', grade: 'CGC 8.0', value: 8500.00, purchasePrice: 5000.00, dateAdded: '2022-11-21', imageUrl: '/placeholder-comic.jpg' },
    { id: 3, title: 'Batman', issue: '181', grade: 'CGC 7.5', value: 2300.00, purchasePrice: 1500.00, dateAdded: '2023-08-01', imageUrl: '/placeholder-comic.jpg' },
];

const StatCard = ({ title, value, change }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {change && <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{change}</p>}
    </div>
);

const CollectionControls = ({ onAdd, onFilter }) => (
    <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Collection</h2>
        <div className="flex items-center gap-4">
            <button onClick={onFilter} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg shadow-sm hover:bg-gray-50">
                <Filter size={16} />
                <span>Filter</span>
            </button>
            <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700">
                <PlusCircle size={16} />
                <span>Add Comic</span>
            </button>
        </div>
    </div>
);

const ComicRow = ({ comic, onEdit, onDelete }) => {
    const valueChange = comic.value - comic.purchasePrice;
    const valueChangePercent = (valueChange / comic.purchasePrice) * 100;

    return (
        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-gray-50">
            <td className="p-4 whitespace-nowrap">
                <div className="flex items-center">
                    <img className="h-16 w-12 object-cover rounded-md mr-4" src={comic.imageUrl} alt="" />
                    <div>
                        <div className="text-sm font-semibold text-gray-900">{comic.title} #{comic.issue}</div>
                        <div className="text-sm text-gray-500">Added: {new Date(comic.dateAdded).toLocaleDateString()}</div>
                    </div>
                </div>
            </td>
            <td className="p-4 whitespace-nowrap text-sm text-gray-500 text-center">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{comic.grade}</span>
            </td>
            <td className="p-4 whitespace-nowrap text-sm text-gray-800 font-medium text-center">${comic.value.toFixed(2)}</td>
            <td className="p-4 whitespace-nowrap text-sm text-center">
                <span className={`${valueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {valueChange >= 0 ? '+' : ''}${valueChange.toFixed(2)} ({valueChangePercent.toFixed(1)}%)
                </span>
            </td>
            <td className="p-4 whitespace-nowrap text-right text-sm font-medium">
                <button onClick={() => onEdit(comic.id)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={18} /></button>
                <button onClick={() => onDelete(comic.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
            </td>
        </motion.tr>
    );
};

const EnhancedCollectionManagement = () => {
    const [collection, setCollection] = useState(mockCollection);

    const stats = useMemo(() => {
        const totalValue = collection.reduce((sum, item) => sum + item.value, 0);
        const totalInvestment = collection.reduce((sum, item) => sum + item.purchasePrice, 0);
        const totalGainLoss = totalValue - totalInvestment;
        const gainLossPercent = (totalGainLoss / totalInvestment) * 100;
        return {
            totalComics: collection.length,
            totalValue: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            totalGainLoss: `${totalGainLoss >= 0 ? '+' : ''}$${totalGainLoss.toFixed(2)} (${gainLossPercent.toFixed(1)}%)`,
        };
    }, [collection]);

    const handleAddComic = () => alert('Add new comic form');
    const handleFilter = () => alert('Filter options');
    const handleEdit = (id) => alert(`Editing comic ${id}`);
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this comic?')) {
            setCollection(collection.filter(c => c.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Total Comics" value={stats.totalComics} />
                        <StatCard title="Total Collection Value" value={stats.totalValue} />
                        <StatCard title="Total Gain/Loss" value={stats.totalGainLoss} change={stats.totalGainLoss.startsWith('+') ? 'up' : 'down'} />
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <CollectionControls onAdd={handleAddComic} onFilter={handleFilter} />
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comic</th>
                                    <th scope="col" className="p-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                                    <th scope="col" className="p-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                                    <th scope="col" className="p-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Gain/Loss</th>
                                    <th scope="col" className="relative p-4"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <AnimatePresence>
                                    {collection.map(comic => (
                                        <ComicRow key={comic.id} comic={comic} onEdit={handleEdit} onDelete={handleDelete} />
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedCollectionManagement;