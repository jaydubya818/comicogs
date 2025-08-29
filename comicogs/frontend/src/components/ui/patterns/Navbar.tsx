"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Heart, Bell, Menu, X, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import ThemeMenu from "@/components/theme/ThemeMenu";
import LocaleSwitcher from "@/components/ui/LocaleSwitcher";
import { UserRole } from "@/types/session";

interface NavbarProps {
  logoText?: string;
  logoHref?: string;
  userName?: string;
  userAvatar?: string;
  userRole?: UserRole;
  cartCount?: number;
  notificationCount?: number;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onLogoClick?: () => void;
  onUserMenuClick?: () => void;
  className?: string;
}

const getNavigationItems = (userRole?: UserRole) => {
  const baseItems = [
    { label: "My Vault", href: "/vault" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Wishlist", href: "/wishlist" },
  ];

  // Add role-specific navigation items
  if (userRole === 'seller' || userRole === 'admin') {
    baseItems.push({ label: "Sell", href: "/sell" });
  }

  if (userRole === 'admin') {
    baseItems.push({ label: "Admin", href: "/admin/moderation" });
  }

  return baseItems;
};

export default function Navbar({
  logoText = "Comicogs",
  logoHref = "/",
  userName = "John Collector",
  userAvatar,
  userRole = "user",
  cartCount = 0,
  notificationCount = 0,
  searchPlaceholder = "Search comics, series, creators...",
  onSearch,
  onLogoClick,
  onUserMenuClick,
  className = "",
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const navigationItems = getNavigationItems(userRole);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>
      
      <nav 
        className={`bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50 ${className}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Left Section: Logo + Primary Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link 
                href={logoHref || "/"} 
                onClick={onLogoClick}
                className="flex items-center space-x-2 text-primary font-bold text-xl hover:text-primary/90 transition-colors"
                prefetch
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span>{logoText}</span>
              </Link>
            </div>
            
            {/* Primary Navigation (Desktop) */}
            <div className="hidden md:flex space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-foreground hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium"
                  prefetch
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Center Section: Search Bar */}
          <div className="flex-1 max-w-lg mx-8 hidden lg:flex">
            <form onSubmit={handleSearch} className="w-full">
              <label htmlFor="search" className="sr-only">Search comics</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="search"
                  name="search"
                  type="search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder={searchPlaceholder}
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
              </div>
            </form>
          </div>

          {/* Right Section: Actions + User Menu */}
          <div className="flex items-center space-x-4">
            
            {/* Search Icon (Mobile) */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Cart/Watchlist */}
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[1.25rem]">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
              <span className="sr-only">Wishlist ({cartCount})</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive w-2 h-2 rounded-full"></span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>

            {/* Theme Menu */}
            <ThemeMenu />

            {/* User Menu */}
            <Button
              variant="ghost" 
              className="flex items-center space-x-3 px-2"
              onClick={onUserMenuClick}
            >
              {userAvatar ? (
                <div className="relative h-8 w-8 rounded-full overflow-hidden">
                  <Image 
                    src={userAvatar} 
                    alt="User avatar"
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm font-medium">{userName}</span>
                {userRole === 'admin' && (
                  <Shield className="h-4 w-4 text-orange-500" aria-label="Administrator" />
                )}
                {userRole === 'seller' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Seller</span>
                )}
              </div>
              <svg className="hidden sm:block h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden border-t border-border bg-background/95 backdrop-blur-md"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-muted transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              
              {/* Mobile Search */}
              <div className="pt-4">
                <form onSubmit={handleSearch}>
                  <label htmlFor="mobile-search" className="sr-only">Search comics</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      id="mobile-search"
                      name="search"
                      type="search"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder={searchPlaceholder}
                      className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      </nav>
    </>
  );
}


