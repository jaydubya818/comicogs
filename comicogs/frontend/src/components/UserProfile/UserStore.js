import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, BookOpen, DollarSign, Store, Loader2 } from 'lucide-react';

const UserStore = () => {
    const { userId } = useParams(); // Assuming route is /user/:userId
    const [userData, setUserData] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserStore = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch user profile and listings
                const response = await fetch(`http://localhost:3001/api/profile/${userId}/store`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch user store: ${response.statusText}`);
                }
                const data = await response.json();
                setUserData(data.user);
                setListings(data.listings);
            } catch (err) {
                console.error('Error fetching user store:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUserStore();
        }
    }, [userId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
                <p className="ml-3 text-gray-600">Loading user store...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8 bg-red-100 text-red-700 rounded-lg shadow-md m-8">
                <XCircle className="w-6 h-6 mx-auto mb-3" />
                <p>Error: {error}</p>
                <p>Could not load user store. Please try again later.</p>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="text-center p-8 bg-white rounded-lg shadow-md m-8">
                <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-800">User Not Found</h2>
                <p className="text-gray-600">The requested user profile or store could not be found.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                {/* User Profile Header */}
                <div className="p-8 bg-gray-800 text-white flex items-center space-x-6">
                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-4xl font-bold uppercase">
                        {userData.username ? userData.username.charAt(0) : 'U'}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold mb-1">{userData.username}'s Store</h1>
                        <p className="text-gray-300 text-lg">{userData.bio || 'Comic collector and seller.'}</p>
                        <div className="flex items-center space-x-4 mt-3">
                            <span className="flex items-center text-sm text-gray-300"><BookOpen size={16} className="mr-1" /> {listings.length} Comics Listed</span>
                            <span className="flex items-center text-sm text-gray-300"><Store size={16} className="mr-1" /> Active Seller</span>
                        </div>
                    </div>
                </div>

                {/* Listings Section */}
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><DollarSign size={24} className="mr-2 text-green-600" /> Comics for Sale</h2>
                    
                    <AnimatePresence>
                        {listings.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {listings.map(comic => (
                                    <motion.div
                                        key={comic.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-blue-300"
                                    >
                                        <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                                            <img src={comic.cover_image_url || '/placeholder-comic.jpg'} alt={`${comic.title} #${comic.issue_number}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-800 text-lg truncate mb-1">{comic.title} #{comic.issue_number}</h3>
                                            <p className="text-gray-600 text-sm mb-2">{comic.series_title} ({comic.publisher_name})</p>
                                            <div className="flex items-center justify-between text-sm text-gray-600">
                                                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">{comic.condition}</span>
                                                <span className="text-blue-600 font-bold text-lg">${comic.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center p-10 bg-gray-50 rounded-lg border border-gray-200 text-gray-600"
                            >
                                <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">No comics listed for sale yet.</h3>
                                <p>Check back later or browse the main marketplace.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default UserStore;
