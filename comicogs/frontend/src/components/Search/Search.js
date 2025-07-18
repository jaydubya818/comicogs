
import React, { useState } from 'react';
import './Search.css';

const Search = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [publisher, setPublisher] = useState('');
    const [series, setSeries] = useState('');
    const [yearFrom, setYearFrom] = useState('');
    const [yearTo, setYearTo] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let url = `http://localhost:3001/api/comics?search=${searchTerm}`;
            if (publisher) url += `&publisher=${publisher}`;
            if (series) url += `&series=${series}`;
            if (yearFrom) url += `&year_from=${yearFrom}`;
            if (yearTo) url += `&year_to=${yearTo}`;

            const response = await fetch(url);
            const data = await response.json();
            setSearchResults(data.comics);
        } catch (error) {
            console.error('Error searching comics:', error);
        }
        setIsLoading(false);
    };

    return (
        <div className="search-container">
            <h2>Comic Book Search</h2>
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    placeholder="Search by title, character, etc..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <input
                    type="text"
                    placeholder="Publisher"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="search-input"
                />
                <input
                    type="text"
                    placeholder="Series"
                    value={series}
                    onChange={(e) => setSeries(e.target.value)}
                    className="search-input"
                />
                <input
                    type="number"
                    placeholder="Year From"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    className="search-input"
                />
                <input
                    type="number"
                    placeholder="Year To"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    className="search-input"
                />
                <button type="submit" className="search-button">Search</button>
            </form>

            {isLoading ? (
                <div className="loading-spinner">Loading...</div>
            ) : (
                <div className="search-results">
                    {searchResults.map(comic => (
                        <div key={comic.id} className="comic-card">
                            <img src={comic.cover_image_url} alt={comic.title} />
                            <div className="comic-info">
                                <h3>{comic.title} #{comic.issue_number}</h3>
                                <p><strong>Publisher:</strong> {comic.publisher_name}</p>
                                <p><strong>Series:</strong> {comic.series_title}</p>
                                <p><strong>Publication Date:</strong> {new Date(comic.publication_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Search;
