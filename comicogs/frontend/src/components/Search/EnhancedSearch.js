import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Filter, ChevronDown, XCircle } from 'lucide-react';

// Mock Data - Enhanced with more details for advanced search
const mockComics = [
    { id: 1, title: 'Amazing Spider-Man', issue: '300', publisher: 'Marvel', year: 1988, condition: 'CGC 9.8', imageUrl: '/placeholder-comic.jpg', series: 'Amazing Spider-Man', writer: 'David Michelinie', artist: 'Todd McFarlane', character: 'Spider-Man', genre: 'Superhero', gradingCompany: 'CGC', gradeValue: 9.8, variantType: 'Newsstand', storyArc: 'Venom' },
    { id: 2, title: 'X-Men', issue: '1', publisher: 'Marvel', year: 1991, condition: 'CGC 8.0', imageUrl: '/placeholder-comic.jpg', series: 'X-Men', writer: 'Chris Claremont', artist: 'Jim Lee', character: 'X-Men', genre: 'Superhero', gradingCompany: 'CGC', gradeValue: 8.0, variantType: 'Cover A', storyArc: 'Mutant Genesis' },
    { id: 3, title: 'Batman', issue: '181', publisher: 'DC', year: 1966, condition: 'CGC 7.5', imageUrl: '/placeholder-comic.jpg', series: 'Batman', writer: 'Robert Kanigher', artist: 'Sheldon Moldoff', character: 'Batman', genre: 'Superhero', gradingCompany: 'CGC', gradeValue: 7.5, variantType: 'Direct', storyArc: 'Poison Ivy' },
    { id: 4, title: 'Incredible Hulk', issue: '181', publisher: 'Marvel', year: 1974, condition: 'CGC 9.2', imageUrl: '/placeholder-comic.jpg', series: 'Incredible Hulk', writer: 'Len Wein', artist: 'Herb Trimpe', character: 'Hulk', genre: 'Superhero', gradingCompany: 'CGC', gradeValue: 9.2, variantType: 'Newsstand', storyArc: 'Wolverine' },
    { id: 5, title: 'Action Comics', issue: '1', publisher: 'DC', year: 1938, condition: 'CGC 0.5', imageUrl: '/placeholder-comic.jpg', series: 'Action Comics', writer: 'Jerry Siegel', artist: 'Joe Shuster', character: 'Superman', genre: 'Superhero', gradingCompany: 'CGC', gradeValue: 0.5, variantType: 'First Print', storyArc: 'Origin' },
    { id: 6, title: 'Detective Comics', issue: '27', publisher: 'DC', year: 1939, condition: 'CGC 1.8', imageUrl: '/placeholder-comic.jpg', series: 'Detective Comics', writer: 'Bill Finger', artist: 'Bob Kane', character: 'Batman', genre: 'Superhero', gradingCompany: 'CGC', gradeValue: 1.8, variantType: 'First Print', storyArc: 'Origin' },
    { id: 7, title: 'Fantastic Four', issue: '1', publisher: 'Marvel', year: 1961, condition: 'CGC 6.0', imageUrl: '/placeholder-comic.jpg', series: 'Fantastic Four', writer: 'Stan Lee', artist: 'Jack Kirby', character: 'Fantastic Four', genre: 'Superhero', gradingCompany: 'CGC', gradeValue: 6.0, variantType: 'First Print', storyArc: 'Origin' },
    { id: 8, title: 'Giant-Size X-Men', issue: '1', publisher: 'Marvel', year: 1975, condition: 'VF/NM', imageUrl: '/placeholder-comic.jpg', series: 'Giant-Size X-Men', writer: 'Len Wein', artist: 'Dave Cockrum', character: 'X-Men', genre: 'Superhero', gradingCompany: 'None', gradeValue: null, variantType: 'First Appearance', storyArc: 'New X-Men' },
    { id: 9, title: 'Watchmen', issue: '1', publisher: 'DC', year: 1986, condition: 'NM', imageUrl: '/placeholder-comic.jpg', series: 'Watchmen', writer: 'Alan Moore', artist: 'Dave Gibbons', character: 'Rorschach', genre: 'Mystery', gradingCompany: 'None', gradeValue: null, variantType: 'First Print', storyArc: 'Main' },
    { id: 10, title: 'Saga', issue: '1', publisher: 'Image', year: 2012, condition: 'VF', imageUrl: '/placeholder-comic.jpg', series: 'Saga', writer: 'Brian K. Vaughan', artist: 'Fiona Staples', character: 'Hazel', genre: 'Sci-Fi', gradingCompany: 'None', gradeValue: null, variantType: 'First Print', storyArc: 'Main' },
];

const publishers = [...new Set(mockComics.map(c => c.publisher))].sort();
const conditions = [...new Set(mockComics.map(c => c.condition))].sort();
const years = [...new Set(mockComics.map(c => c.year))].sort((a, b) => b - a);
const series = [...new Set(mockComics.map(c => c.series))].sort();
const writers = [...new Set(mockComics.map(c => c.writer))].sort();
const artists = [...new Set(mockComics.map(c => c.artist))].sort();
const characters = [...new Set(mockComics.map(c => c.character))].sort();
const genres = [...new Set(mockComics.map(c => c.genre))].sort();
const gradingCompanies = [...new Set(mockComics.map(c => c.gradingCompany))].sort();
const variantTypes = [...new Set(mockComics.map(c => c.variantType))].sort();
const storyArcs = [...new Set(mockComics.map(c => c.storyArc))].sort();

const SearchFilterPanel = ({ filters, setFilters, onSearch }) => {
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
            series: '',
            writer: '',
            artist: '',
            character: '',
            genre: '',
            gradingCompany: '',
            minGrade: '',
            maxGrade: '',
            variantType: '',
            storyArc: '',
            minYear: '',
            maxYear: '',
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Search & Filters</h3>
                <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
                    <Filter size={16} />
                    <span>{showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters</span>
                    <ChevronDown size={16} className={`${showAdvancedFilters ? 'rotate-180' : ''} transition-transform`} />
                </button>
            </div>

            <div className="relative mb-4">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    name="keyword"
                    value={filters.keyword}
                    onChange={handleChange}
                    placeholder="Search by title, issue, or keyword..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                    onKeyPress={(e) => { if (e.key === 'Enter') onSearch(); }}
                />
            </div>

            <AnimatePresence>
                {showAdvancedFilters && (
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
                                <label htmlFor="series" className="block text-sm font-medium text-gray-700 mb-1">Series</label>
                                <select id="series" name="series" value={filters.series} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Series</option>
                                    {series.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="writer" className="block text-sm font-medium text-gray-700 mb-1">Writer</label>
                                <select id="writer" name="writer" value={filters.writer} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Writers</option>
                                    {writers.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="artist" className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
                                <select id="artist" name="artist" value={filters.artist} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Artists</option>
                                    {artists.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="character" className="block text-sm font-medium text-gray-700 mb-1">Character</label>
                                <select id="character" name="character" value={filters.character} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Characters</option>
                                    {characters.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                                <select id="genre" name="genre" value={filters.genre} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Genres</option>
                                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="gradingCompany" className="block text-sm font-medium text-gray-700 mb-1">Grading Company</label>
                                <select id="gradingCompany" name="gradingCompany" value={filters.gradingCompany} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Companies</option>
                                    {gradingCompanies.map(gc => <option key={gc} value={gc}>{gc}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="minGrade" className="block text-sm font-medium text-gray-700 mb-1">Min Grade</label>
                                    <input type="number" step="0.1" id="minGrade" name="minGrade" value={filters.minGrade} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label htmlFor="maxGrade" className="block text-sm font-medium text-gray-700 mb-1">Max Grade</label>
                                    <input type="number" step="0.1" id="maxGrade" name="maxGrade" value={filters.maxGrade} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="variantType" className="block text-sm font-medium text-gray-700 mb-1">Variant Type</label>
                                <select id="variantType" name="variantType" value={filters.variantType} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Variants</option>
                                    {variantTypes.map(vt => <option key={vt} value={vt}>{vt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="storyArc" className="block text-sm font-medium text-gray-700 mb-1">Story Arc</label>
                                <select id="storyArc" name="storyArc" value={filters.storyArc} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Story Arcs</option>
                                    {storyArcs.map(sa => <option key={sa} value={sa}>{sa}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="minYear" className="block text-sm font-medium text-gray-700 mb-1">Min Year</label>
                                    <input type="number" id="minYear" name="minYear" value={filters.minYear} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label htmlFor="maxYear" className="block text-sm font-medium text-gray-700 mb-1">Max Year</label>
                                    <input type="number" id="maxYear" name="maxYear" value={filters.maxYear} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
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
        series: '',
        writer: '',
        artist: '',
        character: '',
        genre: '',
        gradingCompany: '',
        minGrade: '',
        maxGrade: '',
        variantType: '',
        storyArc: '',
        minYear: '',
        maxYear: '',
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
                     comic.issue.includes(filters.keyword) ||
                     (comic.series && comic.series.toLowerCase().includes(filters.keyword.toLowerCase())) ||
                     (comic.writer && comic.writer.toLowerCase().includes(filters.keyword.toLowerCase())) ||
                     (comic.artist && comic.artist.toLowerCase().includes(filters.keyword.toLowerCase())) ||
                     (comic.character && comic.character.toLowerCase().includes(filters.keyword.toLowerCase()))
                    ) : true;
                const matchesPublisher = filters.publisher ? comic.publisher === filters.publisher : true;
                const matchesYear = filters.year ? comic.year === parseInt(filters.year) : true;
                const matchesCondition = filters.condition ? comic.condition === filters.condition : true;
                const matchesSeries = filters.series ? comic.series === filters.series : true;
                const matchesWriter = filters.writer ? comic.writer === filters.writer : true;
                const matchesArtist = filters.artist ? comic.artist === filters.artist : true;
                const matchesCharacter = filters.character ? comic.character === filters.character : true;
                const matchesGenre = filters.genre ? comic.genre === filters.genre : true;
                const matchesGradingCompany = filters.gradingCompany ? comic.gradingCompany === filters.gradingCompany : true;
                const matchesMinGrade = filters.minGrade ? comic.gradeValue >= parseFloat(filters.minGrade) : true;
                const matchesMaxGrade = filters.maxGrade ? comic.gradeValue <= parseFloat(filters.maxGrade) : true;
                const matchesVariantType = filters.variantType ? comic.variantType === filters.variantType : true;
                const matchesStoryArc = filters.storyArc ? comic.storyArc === filters.storyArc : true;
                const matchesMinYear = filters.minYear ? comic.year >= parseInt(filters.minYear) : true;
                const matchesMaxYear = filters.maxYear ? comic.year <= parseInt(filters.maxYear) : true;

                return matchesKeyword && matchesPublisher && matchesYear && matchesCondition &&
                       matchesSeries && matchesWriter && matchesArtist && matchesCharacter &&
                       matchesGenre && matchesGradingCompany && matchesMinGrade && matchesMaxGrade &&
                       matchesVariantType && matchesStoryArc && matchesMinYear && matchesMaxYear;
            });
            setSearchResults(filtered);
            setLoading(false);
        }, 500);
    };

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