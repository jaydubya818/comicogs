import React, { useState, useEffect } from 'react';
import './Marketplace.css';

function Marketplace() {
  const [activeTab, setActiveTab] = useState('browse');
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    condition: '',
    min_price: '',
    max_price: '',
    sort: 'created_at'
  });

  // Form states for creating listings
  const [newListing, setNewListing] = useState({
    comic_id: '',
    price: '',
    condition: 'NM',
    grade: '',
    description: ''
  });

  const conditions = ['Poor', 'Fair', 'Good', 'VG', 'Fine', 'VF', 'NM', 'MT'];

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchListings();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab, filters]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`http://localhost:3001/api/marketplace/listings?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      const data = await response.json();
      setListings(data.listings || []);
    } catch (err) {
      setError('Error fetching listings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/marketplace/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('Error fetching stats: ' + err.message);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/marketplace/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newListing,
          price: parseFloat(newListing.price),
          comic_id: parseInt(newListing.comic_id)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create listing');
      }

      const data = await response.json();
      alert('Listing created successfully!');
      setNewListing({
        comic_id: '',
        price: '',
        condition: 'NM',
        grade: '',
        description: ''
      });
      
      // Refresh listings if on browse tab
      if (activeTab === 'browse') {
        fetchListings();
      }
    } catch (err) {
      setError('Error creating listing: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (listingId) => {
    if (!window.confirm('Are you sure you want to purchase this comic?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/marketplace/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: listingId,
          payment_method: 'credit_card'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete purchase');
      }

      const data = await response.json();
      alert(`Purchase successful! Transaction ID: ${data.transaction.id}`);
      fetchListings(); // Refresh listings
    } catch (err) {
      setError('Error completing purchase: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderBrowseTab = () => (
    <div className="browse-tab">
      <div className="filters-section">
        <h3>🔍 Browse Marketplace</h3>
        <div className="filters-grid">
          <input
            type="text"
            placeholder="Search comics..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="filter-input"
          />
          
          <select
            value={filters.condition}
            onChange={(e) => handleFilterChange('condition', e.target.value)}
            className="filter-select"
          >
            <option value="">All Conditions</option>
            {conditions.map(condition => (
              <option key={condition} value={condition}>{condition}</option>
            ))}
          </select>
          
          <input
            type="number"
            placeholder="Min Price"
            value={filters.min_price}
            onChange={(e) => handleFilterChange('min_price', e.target.value)}
            className="filter-input"
          />
          
          <input
            type="number"
            placeholder="Max Price"
            value={filters.max_price}
            onChange={(e) => handleFilterChange('max_price', e.target.value)}
            className="filter-input"
          />
          
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="filter-select"
          >
            <option value="created_at">Newest First</option>
            <option value="price">Price: Low to High</option>
            <option value="price DESC">Price: High to Low</option>
          </select>
        </div>
      </div>

      {loading && <div className="loading">Loading listings...</div>}
      
      <div className="listings-grid">
        {listings.map(listing => (
          <div key={listing.id} className="listing-card">
            <div className="listing-image">
              <img 
                src={listing.cover_image_url || '/placeholder-comic.png'} 
                alt={listing.title}
              />
              <div className="condition-badge">{listing.condition}</div>
              {listing.grade && <div className="grade-badge">{listing.grade}</div>}
            </div>
            
            <div className="listing-details">
              <h4>{listing.title} #{listing.issue_number}</h4>
              {listing.variant_name && <p className="variant">{listing.variant_name}</p>}
              <p className="series">{listing.series_title} • {listing.publisher_name}</p>
              
              <div className="price-section">
                <div className="listing-price">${listing.price}</div>
                {listing.avg_market_price && (
                  <div className="market-price">
                    Avg: ${Math.round(listing.avg_market_price)}
                  </div>
                )}
              </div>
              
              <div className="seller-info">
                <span className="seller">Seller: {listing.seller_username}</span>
                {listing.seller_rating && (
                  <span className="rating">
                    ⭐ {listing.seller_rating.toFixed(1)} ({listing.seller_sales_count} sales)
                  </span>
                )}
              </div>
              
              {listing.listing_description && (
                <p className="description">{listing.listing_description}</p>
              )}
              
              <button 
                className="purchase-button"
                onClick={() => handlePurchase(listing.id)}
                disabled={loading}
              >
                💳 Purchase Now
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {listings.length === 0 && !loading && (
        <div className="no-results">
          <p>No listings found matching your criteria.</p>
        </div>
      )}
    </div>
  );

  const renderSellTab = () => (
    <div className="sell-tab">
      <h3>💰 Create New Listing</h3>
      <p>List your comics for sale on the marketplace</p>
      
      <form onSubmit={handleCreateListing} className="listing-form">
        <div className="form-group">
          <label>Comic ID *</label>
          <input
            type="number"
            value={newListing.comic_id}
            onChange={(e) => setNewListing(prev => ({ ...prev, comic_id: e.target.value }))}
            required
            className="form-input"
            placeholder="Enter comic ID from catalog"
          />
          <small>Browse the comic catalog to find the ID of the comic you want to sell</small>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Price ($) *</label>
            <input
              type="number"
              step="0.01"
              value={newListing.price}
              onChange={(e) => setNewListing(prev => ({ ...prev, price: e.target.value }))}
              required
              className="form-input"
              placeholder="0.00"
            />
          </div>
          
          <div className="form-group">
            <label>Condition *</label>
            <select
              value={newListing.condition}
              onChange={(e) => setNewListing(prev => ({ ...prev, condition: e.target.value }))}
              required
              className="form-select"
            >
              {conditions.map(condition => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Grade (Optional)</label>
          <input
            type="text"
            value={newListing.grade}
            onChange={(e) => setNewListing(prev => ({ ...prev, grade: e.target.value }))}
            className="form-input"
            placeholder="e.g., CGC 9.8, CBCS 9.6"
          />
        </div>
        
        <div className="form-group">
          <label>Description (Optional)</label>
          <textarea
            value={newListing.description}
            onChange={(e) => setNewListing(prev => ({ ...prev, description: e.target.value }))}
            className="form-textarea"
            rows="4"
            placeholder="Describe the comic's condition, any notable features, etc."
          />
        </div>
        
        <button 
          type="submit" 
          className="create-listing-button"
          disabled={loading}
        >
          {loading ? 'Creating...' : '📝 Create Listing'}
        </button>
      </form>
    </div>
  );

  const renderStatsTab = () => (
    <div className="stats-tab">
      <h3>📊 Marketplace Statistics</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.active_listings || 0}</div>
          <div className="stat-label">Active Listings</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.completed_transactions || 0}</div>
          <div className="stat-label">Completed Sales</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">${stats.total_volume?.toFixed(2) || '0.00'}</div>
          <div className="stat-label">Total Volume</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">${stats.average_listing_price?.toFixed(2) || '0.00'}</div>
          <div className="stat-label">Avg Listing Price</div>
        </div>
      </div>
      
      {stats.popular_conditions && stats.popular_conditions.length > 0 && (
        <div className="conditions-chart">
          <h4>Popular Conditions</h4>
          <div className="conditions-list">
            {stats.popular_conditions.map((item, index) => (
              <div key={index} className="condition-item">
                <span className="condition-name">{item.condition}</span>
                <div className="condition-bar">
                  <div 
                    className="condition-fill"
                    style={{ width: `${(item.count / stats.popular_conditions[0].count) * 100}%` }}
                  />
                </div>
                <span className="condition-count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {stats.recent_sales && stats.recent_sales.length > 0 && (
        <div className="recent-sales">
          <h4>Recent Sales</h4>
          <div className="sales-list">
            {stats.recent_sales.map((sale, index) => (
              <div key={index} className="sale-item">
                <div className="sale-comic">
                  {sale.title} #{sale.issue_number}
                  {sale.condition && <span className="sale-condition">({sale.condition})</span>}
                </div>
                <div className="sale-price">${sale.amount}</div>
                <div className="sale-date">
                  {new Date(sale.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <h2>🛒 Comic Marketplace</h2>
        <p>Buy and sell comics with secure escrow protection</p>
      </div>

      <div className="marketplace-tabs">
        <button 
          className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          🔍 Browse
        </button>
        <button 
          className={`tab ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell')}
        >
          💰 Sell
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
      </div>

      <div className="marketplace-content">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="close-error">×</button>
          </div>
        )}

        {activeTab === 'browse' && renderBrowseTab()}
        {activeTab === 'sell' && renderSellTab()}
        {activeTab === 'stats' && renderStatsTab()}
      </div>
    </div>
  );
}

export default Marketplace; 