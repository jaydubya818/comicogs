import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import EnhancedDashboard from './components/Dashboard/EnhancedDashboard';
import ComicCatalog from './components/ComicCatalog/ComicCatalog';
import EnhancedCollectionManagement from './components/CollectionManagement/EnhancedCollectionManagement';
import EnhancedWantList from './components/WantList/EnhancedWantList';
import EnhancedComicCompDashboard from './components/EnhancedComicCompDashboard';
import EnhancedMarketplace from './components/Marketplace/EnhancedMarketplace';
import AuthManager from './components/Auth/AuthManager';
import UserProfile from './components/UserProfile/UserProfile';
import Search from './components/Search/Search';
import ComicDetails from './components/ComicDetails/ComicDetails';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Validate token with backend
          const response = await fetch('http://localhost:3001/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('token');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const handleAuthSuccess = async (token) => {
    localStorage.setItem('token', token);
    
    try {
      // Get user data after successful authentication
      const response = await fetch('http://localhost:3001/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      // Still authenticate even if user data fetch fails
      setUser({ username: 'Comic Collector' });
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner">Loading...</div>
        </div>
      );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  // Public Route Component (redirect to dashboard if authenticated)
  const PublicRoute = ({ children }) => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner">Loading...</div>
        </div>
      );
    }

    return !isAuthenticated ? children : <Navigate to="/" replace />;
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Comicogs...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated && (
          <nav className="navbar">
            <div className="nav-brand">
              <Link to="/">📚 Comicogs</Link>
            </div>
            <div className="nav-links">
              <Link to="/" className="nav-link">Dashboard</Link>
              <Link to="/comics" className="nav-link">Browse Comics</Link>
              <Link to="/collection" className="nav-link">My Collection</Link>
              <Link to="/wantlist" className="nav-link">Want List</Link>
              <Link to="/marketplace" className="nav-link">🛒 Marketplace</Link>
              <Link to="/ai-tools" className="nav-link">🤖 ComicComp</Link>
              <Link to="/search" className="nav-link">Search</Link>
            </div>
            <div className="nav-user">
              <span className="welcome-text">Welcome, {user?.username || 'User'}!</span>
              <Link to="/profile" className="nav-link">Profile</Link>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </nav>
        )}

        <main className={isAuthenticated ? "main-content" : "main-content-auth"}>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <div className="auth-page">
                    <AuthManager onAuthSuccess={handleAuthSuccess} />
                  </div>
                </PublicRoute>
              } 
            />

            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <EnhancedDashboard onLogout={handleLogout} user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/comics" 
              element={
                <ProtectedRoute>
                  <ComicCatalog />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/collection" 
              element={
                <ProtectedRoute>
                  <EnhancedCollectionManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/wantlist" 
              element={
                <ProtectedRoute>
                  <EnhancedWantList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/marketplace" 
              element={
                <ProtectedRoute>
                  <EnhancedMarketplace />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ai-tools" 
              element={
                <ProtectedRoute>
                  <EnhancedComicCompDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/search" 
              element={
                <ProtectedRoute>
                  <Search />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/comics/:id" 
              element={
                <ProtectedRoute>
                  <ComicDetails />
                </ProtectedRoute>
              } 
            />

            {/* Catch all route */}
            <Route 
              path="*" 
              element={
                isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;