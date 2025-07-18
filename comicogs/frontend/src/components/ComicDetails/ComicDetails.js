
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ComicDetails.css';

const ComicDetails = () => {
    const { id } = useParams();
    const [comic, setComic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchComicDetails = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:3001/api/comics/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch comic details');
                }
                const data = await response.json();
                setComic(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchComicDetails();
    }, [id]);

    if (loading) {
        return <div className="details-loading">Loading comic details...</div>;
    }

    if (error) {
        return <div className="details-error">Error: {error}</div>;
    }

    if (!comic) {
        return <div className="details-not-found">Comic not found.</div>;
    }

    return (
        <div className="comic-details-page">
            <div className="details-header">
                <div className="details-cover">
                    <img src={comic.cover_image_url} alt={`${comic.title} #${comic.issue_number}`} />
                </div>
                <div className="details-info">
                    <h1>{comic.title} #{comic.issue_number}</h1>
                    <h2>{comic.series_title}</h2>
                    <h3>{comic.publisher_name}</h3>
                    <p><strong>Publication Date:</strong> {new Date(comic.publication_date).toLocaleDateString()}</p>
                    <p><strong>Format:</strong> {comic.format}</p>
                </div>
            </div>

            <div className="details-body">
                <div className="details-description">
                    <h3>Description</h3>
                    <p>{comic.description}</p>
                </div>

                <div className="details-key-issue">
                    <h3>Key Issue Notes</h3>
                    <p>{comic.key_issue_notes}</p>
                </div>

                <div className="details-creators">
                    <h3>Creators</h3>
                    <ul>
                        {comic.creators.map((creator, index) => (
                            <li key={index}>{creator.name} - {creator.role}</li>
                        ))}
                    </ul>
                </div>

                <div className="details-characters">
                    <h3>Characters</h3>
                    <ul>
                        {comic.characters.map((character, index) => (
                            <li key={index}>{character}</li>
                        ))}
                    </ul>
                </div>

                <div className="details-price-history">
                    <h3>Price History</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Condition</th>
                                <th>Price</th>
                                <th>Source</th>
                                <th>Sale Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comic.price_history.map((sale, index) => (
                                <tr key={index}>
                                    <td>{sale.condition}</td>
                                    <td>${sale.price}</td>
                                    <td>{sale.source}</td>
                                    <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ComicDetails;
