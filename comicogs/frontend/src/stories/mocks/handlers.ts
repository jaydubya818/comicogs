// Mock API handlers for Storybook
// Based on the golden queries from the backend

export const mockComics = [
  {
    id: 1,
    title: "Batman: The Dark Knight Returns #1",
    publisher: "DC Comics",
    publicationDate: "1986-02-01",
    issueNumber: 1,
    description: "The first issue of Frank Miller's legendary Batman series.",
    coverImage: "/placeholder-comic-cover.jpg",
    creators: ["Frank Miller"],
    genre: "Superhero",
  },
  {
    id: 2,
    title: "Spider-Man #1",
    publisher: "Marvel Comics",
    publicationDate: "2021-01-01",
    issueNumber: 1,
    description: "A new Spider-Man series begins.",
    coverImage: "/placeholder-comic-cover.jpg",
    creators: ["Unknown"],
    genre: "Superhero",
  },
  {
    id: 3,
    title: "The Walking Dead #1",
    publisher: "Image Comics",
    publicationDate: "2003-10-01",
    issueNumber: 1,
    description: "The zombie apocalypse begins.",
    coverImage: "/placeholder-comic-cover.jpg",
    creators: ["Robert Kirkman"],
    genre: "Horror",
  },
];

export const mockListings = [
  {
    id: 1,
    comic: mockComics[0],
    seller: {
      id: 1,
      name: "ComicCollector123",
      avatar: "/placeholder-avatar.jpg",
      rating: 4.8,
    },
    price: 25.99,
    condition: "Near Mint",
    description: "Excellent condition, no defects.",
    images: ["/placeholder-comic-cover.jpg"],
    isAvailable: true,
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    comic: mockComics[1],
    seller: {
      id: 2,
      name: "MarvelFan",
      avatar: "/placeholder-avatar.jpg",
      rating: 4.5,
    },
    price: 15.50,
    condition: "Very Fine",
    description: "Minor wear on corners.",
    images: ["/placeholder-comic-cover.jpg"],
    isAvailable: true,
    createdAt: "2024-01-10T14:30:00Z",
  },
];

export const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    avatar: "/placeholder-avatar.jpg",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Admin User",
    email: "admin@comicogs.com",
    role: "admin",
    avatar: "/placeholder-avatar.jpg",
    createdAt: "2023-12-01T00:00:00Z",
  },
];

export const mockSavedSearches = [
  {
    id: 1,
    name: "Batman Comics",
    query: {
      search: "Batman",
      publisher: "DC Comics",
    },
    cadence: "weekly",
    userId: 1,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Marvel 2021",
    query: {
      publisher: "Marvel Comics",
      year: 2021,
    },
    cadence: "monthly",
    userId: 1,
    createdAt: "2024-01-15T00:00:00Z",
  },
];

// Mock API responses based on golden queries
export const mockApiResponses = {
  '/api/comics': {
    data: mockComics,
    pagination: {
      page: 1,
      limit: 20,
      total: mockComics.length,
      pages: 1,
    },
  },
  '/api/comics/1': mockComics[0],
  '/api/listings': {
    data: mockListings,
    pagination: {
      page: 1,
      limit: 20,
      total: mockListings.length,
      pages: 1,
    },
  },
  '/api/listings/1': mockListings[0],
  '/api/saved-searches': {
    data: mockSavedSearches,
  },
  '/api/saved-searches/match': {
    match: mockSavedSearches[0],
  },
  '/api/collection': {
    data: [
      {
        id: 1,
        comic: mockComics[0],
        condition: "Near Mint",
        purchasePrice: 25.99,
        currentValue: 45.00,
        purchaseDate: "2024-01-01",
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      pages: 1,
    },
  },
  '/api/auth/login': {
    user: mockUsers[0],
    token: 'mock-jwt-token',
  },
  '/api': {
    status: 'ok',
    version: '2.0.0',
    endpoints: {
      comics: '/api/comics',
      listings: '/api/listings',
      auth: '/api/auth',
      collection: '/api/collection',
      savedSearches: '/api/saved-searches',
    },
  },
};

// Helper function to simulate API delay
export const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock fetch function for Storybook
export const mockFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  await delay(100); // Simulate network delay
  
  const pathname = new URL(url, 'http://localhost').pathname;
  const searchParams = new URL(url, 'http://localhost').searchParams;
  
  let responseData = mockApiResponses[pathname as keyof typeof mockApiResponses];
  
  // Handle search parameters
  if (pathname === '/api/comics' && searchParams.has('search')) {
    const searchTerm = searchParams.get('search')?.toLowerCase();
    const filteredComics = mockComics.filter(comic => 
      comic.title.toLowerCase().includes(searchTerm || '')
    );
    responseData = {
      data: filteredComics,
      pagination: {
        page: 1,
        limit: 20,
        total: filteredComics.length,
        pages: 1,
      },
    };
  }
  
  if (pathname === '/api/comics' && searchParams.has('publisher')) {
    const publisher = searchParams.get('publisher');
    const filteredComics = mockComics.filter(comic => 
      comic.publisher === publisher
    );
    responseData = {
      data: filteredComics,
      pagination: {
        page: 1,
        limit: 20,
        total: filteredComics.length,
        pages: 1,
      },
    };
  }
  
  if (!responseData) {
    return new Response(
      JSON.stringify({ error: 'Not found', message: 'Resource not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify(responseData),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

export default mockApiResponses;
