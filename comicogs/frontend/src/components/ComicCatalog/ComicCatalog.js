import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ComicCatalog.css';

const ComicCatalog = () => {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  // Fetch comics from API
  const fetchComics = async (page = 1, search = '', genre = '', publisher = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `http://localhost:3001/api/comics?page=${page}&limit=20`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (genre) url += `&genre=${encodeURIComponent(genre)}`;
      if (publisher) url += `&publisher=${encodeURIComponent(publisher)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comics');
      }

      const data = await response.json();
      setComics(data.comics);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComics();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchComics(1, searchTerm, selectedGenre, selectedPublisher);
  };

  // Handle adding to collection
  const addToCollection = async (comicId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/collections', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comic_id: comicId,
          condition: 'VF',
          purchase_price: 0
        })
      });

      if (response.ok) {
        alert('Comic added to collection!');
      } else {
        throw new Error('Failed to add comic to collection');
      }
    } catch (err) {
      alert('Error adding comic to collection: ' + err.message);
    }
  };

  // Handle adding to want list
  const addToWantList = async (comicId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/wantlists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comic_id: comicId,
          max_price: 0,
          priority: 'medium'
        })
      });

      if (response.ok) {
        alert('Comic added to want list!');
      } else {
        throw new Error('Failed to add comic to want list');
      }
    } catch (err) {
      alert('Error adding comic to want list: ' + err.message);
    }
  };

  // Get unique genres and publishers for filters
  const genres = [...new Set(comics.map(comic => comic.genre))].filter(Boolean);
  const publishers = [...new Set(comics.map(comic => comic.publisher_name))].filter(Boolean);

  if (loading) {
    return <div className="comic-catalog-loading">Loading comics...</div>;
  }

  if (error) {
    return <div className="comic-catalog-error">Error: {error}</div>;
  }

  return (
    <div className="comic-catalog">
      <div className="catalog-header">
        <h1>Comic Catalog</h1>
        <p>Discover and explore our comprehensive comic database</p>
      </div>

      <div className="catalog-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search comics, characters, creators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="filter-select"
          >
            <option value="">All Genres</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          <select
            value={selectedPublisher}
            onChange={(e) => setSelectedPublisher(e.target.value)}
            className="filter-select"
          >
            <option value="">All Publishers</option>
            {publishers.map(publisher => (
              <option key={publisher} value={publisher}>{publisher}</option>
            ))}
          </select>
          <button type="submit" className="search-btn">Search</button>
        </form>
      </div>

      <div className="catalog-stats">
        <span>Showing {comics.length} of {pagination.total} comics</span>
        <span>Page {pagination.page} of {pagination.pages}</span>
      </div>

      <div className="comics-grid">
        {comics.map(comic => (
          <div key={comic.id} className="comic-card">
            <Link to={`/comics/${comic.id}`} className="comic-image-link">
              <div className="comic-image">
                {comic.cover_image_url ? (
                  <img src={comic.cover_image_url} alt={comic.title} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
            </Link>
            <div className="comic-info">
              <h3 className="comic-title">{comic.title} #{comic.issue_number}</h3>
              <p className="comic-series">{comic.series_title}</p>
              <p className="comic-publisher">{comic.publisher_name}</p>
              <p className="comic-date">{new Date(comic.cover_date).getFullYear()}</p>
              
              {comic.key_issue_notes && (
                <p className="key-issue-notes">{comic.key_issue_notes}</p>
              )}

              <div className="comic-creators">
                {comic.creators.map((creator, index) => (
                  <span key={index} className="creator">
                    {creator.name} ({creator.role})
                  </span>
                ))}
              </div>

              <div className="comic-characters">
                {comic.characters.slice(0, 3).map((character, index) => (
                  <span key={index} className="character">{character}</span>
                ))}
                {comic.characters.length > 3 && <span className="more-characters">+{comic.characters.length - 3} more</span>}
              </div>

              <div className="comic-prices">
                <span className="price nm">NM: ${comic.latest_nm_price}</span>
                <span className="price vf">VF: ${comic.latest_vf_price}</span>
              </div>

              <div className="comic-actions">
                <button 
                  onClick={() => addToCollection(comic.id)}
                  className="action-btn add-collection"
                >
                  Add to Collection
                </button>
                <button 
                  onClick={() => addToWantList(comic.id)}
                  className="action-btn add-wantlist"
                >
                  Add to Want List
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => fetchComics(pagination.page - 1, searchTerm, selectedGenre, selectedPublisher)}
            disabled={pagination.page === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => fetchComics(pagination.page + 1, searchTerm, selectedGenre, selectedPublisher)}
            disabled={pagination.page === pagination.pages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ComicCatalog; 