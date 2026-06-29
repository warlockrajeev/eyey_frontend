"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiChevronDown, FiSearch, FiHelpCircle, FiShoppingCart } from "react-icons/fi";
import { FaUserCircle, FaWallet } from "react-icons/fa";
import { useAuth } from "../context/AuthContext"; // ✅ Import Auth Context
import { useCart } from "../context/CartContext"; // ✅ Import Cart Context

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Search Input Component to handle search queries cleanly with Suspense support
function SearchInput({ isMobile, closeMenu }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products?search=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.products || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navigateToProduct = (product) => {
    let categoryPath = "eyeglasses";
    const catLower = product.category?.toLowerCase() || "";
    if (catLower.includes("sunglasses")) {
      categoryPath = "sunglasses";
    } else if (catLower.includes("computer")) {
      categoryPath = "computer-glasses";
    } else if (catLower.includes("power")) {
      categoryPath = "power-glasses";
    } else if (catLower.includes("contact")) {
      categoryPath = "contact-lenses";
    }
    
    setSearchQuery("");
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    router.push(`/${categoryPath}/${product._id}`);
    if (closeMenu) closeMenu();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      if (closeMenu) closeMenu();
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev - 1 >= 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    } else if (e.key === "Enter") {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        e.preventDefault();
        navigateToProduct(suggestions[activeSuggestionIndex]);
      }
    }
  };

  const renderSuggestionsList = () => {
    if (!showSuggestions || suggestions.length === 0) return null;

    return (
      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden z-[100] max-h-80 overflow-y-auto animate-fadeIn">
        <div className="py-1 text-xs text-gray-500 font-bold px-3 border-b border-gray-100 uppercase bg-gray-50">
          Suggested Products
        </div>
        {suggestions.map((product, idx) => {
          const isActive = idx === activeSuggestionIndex;
          return (
            <div
              key={product._id}
              onClick={() => navigateToProduct(product)}
              onMouseEnter={() => setActiveSuggestionIndex(idx)}
              className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors duration-150 ${
                isActive ? "bg-blue-50 text-blue-900" : "hover:bg-gray-100 text-gray-800"
              }`}
            >
              <div className="relative w-8 h-8 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden animate-pulse-once">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">
                    N/A
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-snug">{product.name}</p>
                <p className="text-xs text-gray-500 truncate leading-none mt-0.5">
                  {product.brand} • {product.category}
                </p>
              </div>
              <div className="text-sm font-bold text-gray-900">
                ₹{product.price}
              </div>
            </div>
          );
        })}
        <div 
          onClick={handleSearchSubmit}
          className="p-3 border-t border-gray-100 text-xs font-bold text-blue-600 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors"
        >
          <span>Search for "{searchQuery}" in all products</span>
          <FiSearch className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div ref={wrapperRef} className="relative w-full">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-full h-10 px-4 py-2 bg-gray-100 rounded-sm text-sm focus:outline-none pr-10 text-black placeholder:text-gray-500 font-medium"
          />
          <button type="submit" className="absolute right-3 top-3 text-gray-500 hover:text-black">
            <FiSearch className="w-4 h-4" />
          </button>
        </form>
        {renderSuggestionsList()}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="hidden md:flex flex-1 max-w-md relative">
      <form onSubmit={handleSearchSubmit} className="w-full relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for stylish eyeglasses.."
          className="w-full h-9 px-4 py-2 bg-white border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-gray-400 font-bold text-black placeholder:text-black pr-10"
        />
        <button type="submit" className="absolute right-3 top-2.5 text-gray-500 hover:text-black">
          <FiSearch className="w-4 h-4" />
        </button>
      </form>
      {renderSuggestionsList()}
    </div>
  );
}

export default function Navbar() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [eyeglassesOpen, setEyeglassesOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // ✅ Use AuthContext
  const { user, logout } = useAuth();
  const { cartCount } = useCart(); // ✅ Get cart count

  // Add click outside handler for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close profile dropdown when clicking outside
      if (
        profileDropdownOpen &&
        !event.target.closest(".profile-dropdown-container")
      ) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownOpen]);

  useEffect(() => {
    setIsClient(true); // Set client flag to true after hydration
  }, []);


  const handleLogout = async () => {
    await logout();
    router.push("/"); // Use Next.js router instead of window.location.href
  };

  return (
    <div className="w-full flex flex-col font-nunito">
      {/* --- Row 1: Top Navbar --- */}
      <div className="bg-[#F2ECE4] flex items-center justify-between pl-4 md:pl-16 pr-4 md:pr-16 py-3 gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/Eyey Business Card.png"
            alt="EyeMyEye Logo"
            width={120}
            height={40}
            className="w-32 md:w-48 h-auto object-contain"
            priority
          />
        </Link>

        {/* Search Bar (Centered) */}
        <Suspense fallback={<div className="hidden md:flex flex-1 max-w-md h-9 bg-white border border-gray-300 rounded-sm" />}>
          <SearchInput isMobile={false} />
        </Suspense>

        {/* Top Right Icons */}
        <div className="flex items-center gap-4 md:gap-8 text-gray-700 font-medium">
          <Link href="/help" className="hidden md:flex items-center gap-1 text-black font-bold text-sm">
            Help
          </Link>

          {user ? (
            <div className="relative profile-dropdown-container">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="text-black flex items-center gap-1 focus:outline-none text-sm font-bold"
              >
                {user.name ? `Hi, ${user.name.split(" ")[0]}` : "Profile"}
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 bg-white shadow-lg mt-2 rounded-sm border w-48 z-50 py-2">
                  <div className="px-4 py-2 border-b text-xs text-gray-500 font-bold uppercase">
                    Welcome, {user.name}
                  </div>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/signin" className="hover:text-black text-sm font-semibold whitespace-nowrap">
              Sign In
            </Link>
          )}

          <div className="flex items-center gap-3">
            <Link href="/cart" className="relative group p-1 flex items-center justify-center">
              <FiShoppingCart className="w-6 h-6 text-black hover:text-blue-600 transition-colors" />
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#4DA9FF] flex items-center justify-center text-white text-[10px] font-bold">
                {cartCount}
              </div>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-gray-800 text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* --- Row 2: Guaranteed Lowest Price Banner --- */}
      <div className="bg-[#4A5B67] py-1.5 flex items-center justify-center gap-2">
        <span className="text-white text-base md:text-lg font-bold tracking-wide">
          Guaranteed Lowest Price
        </span>
        {/* <div className="bg-[#F9A825] text-[10px] font-extrabold px-1 rounded-sm text-white skew-x-[-10deg] leading-tight">
          LOWEST<br />PRICE
        </div> */}
      </div>

      {/* --- Row 3: Navigation & 3D Try On --- */}
      {isClient && (
        <div className="bg-[#F9F9F9] hidden md:block border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 md:px-10 flex items-center justify-between py-2 text-gray-800 font-bold text-[15px]">
            {/* Eyeglasses */}
            <div
              className="relative group py-2"
              onMouseEnter={() => setEyeglassesOpen(true)}
              onMouseLeave={() => setEyeglassesOpen(false)}
            >
              <Link href="/eyeglasses" className="hover:text-gray-600 flex items-center gap-1">
                Eyeglasses
              </Link>
              <AnimatePresence>
                {eyeglassesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-2 w-[40rem] bg-white border border-gray-200 shadow-2xl rounded-sm py-8 z-50 font-normal"
                  >
                    <div className="grid grid-cols-3 gap-10 px-8">
                      <div>
                        <h3 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wider border-b pb-2">Gender</h3>
                        <div className="space-y-3">
                          <Link href="/men" className="block text-gray-700 hover:text-blue-600 text-sm">Men</Link>
                          <Link href="/women" className="block text-gray-700 hover:text-blue-600 text-sm">Women</Link>
                          <Link href="/kids" className="block text-gray-700 hover:text-blue-600 text-sm">Kids</Link>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wider border-b pb-2">Brands</h3>
                        <div className="grid grid-cols-1 gap-3">
                          <Link href="/eyeglasses" className="block text-gray-700 hover:text-blue-600 text-sm">Ray-Ban</Link>
                          <Link href="/eyeglasses" className="block text-gray-700 hover:text-blue-600 text-sm">Gucci</Link>
                          <Link href="/eyeglasses" className="block text-gray-700 hover:text-blue-600 text-sm">Prada</Link>
                          <Link href="/eyeglasses" className="block text-gray-700 hover:text-blue-600 text-sm">Oakley</Link>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wider border-b pb-2">Frame Type</h3>
                        <div className="space-y-3">
                          <Link href="/eyeglasses" className="block text-gray-700 hover:text-blue-600 text-sm">Full Frame</Link>
                          <Link href="/eyeglasses" className="block text-gray-700 hover:text-blue-600 text-sm">Half Frame</Link>
                          <Link href="/eyeglasses" className="block text-gray-700 hover:text-blue-600 text-sm">Rimless</Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/computer-glasses" className="hover:text-gray-600 py-2">Computer Glasses</Link>
            <Link href="/sunglasses" className="hover:text-gray-600 py-2">Sunglasses</Link>
            <Link href="/power-glasses" className="hover:text-gray-600 py-2">Power Glasses</Link>
            <Link href="/contact-lenses" className="hover:text-gray-600 py-2">Contact Lenses</Link>

            {/* 3D Try On Button */}
            <Link href="/try-on" className="bg-gradient-to-r from-[#59a4dc] to-[#30cbd1] text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 font-bold text-[13px] shadow-sm hover:opacity-90 transition-opacity">
              <span className="text-base">👓</span>
              3D Try On
            </Link>
          </div>
        </div>
      )}

      {/* --- Mobile Menu --- */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-t border-gray-100 flex flex-col p-4 gap-4"
          >
            <Suspense fallback={<div className="w-full h-10 bg-gray-100 rounded-sm" />}>
              <SearchInput isMobile={true} closeMenu={() => setMenuOpen(false)} />
            </Suspense>

            <div className="flex flex-col gap-3 py-2 border-b border-gray-50">
              <Link href="/eyeglasses" className="font-bold text-gray-800">Eyeglasses</Link>
              <Link href="/computer-glasses" className="font-bold text-gray-800">Computer Glasses</Link>
              <Link href="/sunglasses" className="font-bold text-gray-800">Sunglasses</Link>
              <Link href="/power-glasses" className="font-bold text-gray-800">Power Glasses</Link>
              <Link href="/contact-lenses" className="font-bold text-gray-800">Contact Lenses</Link>
            </div>

            <div className="flex flex-col gap-3 py-2 border-b border-gray-50">
              {user ? (
                <>
                  <div className="text-sm text-gray-500 font-bold">WELCOME, {user.name}</div>
                  <Link href="/profile" className="text-gray-700">My Account</Link>
                  <button onClick={handleLogout} className="text-red-500 text-left">Logout</button>
                </>
              ) : (
                <Link href="/signin" className="font-bold text-gray-800">Sign In</Link>
              )}
              <Link href="/cart" className="text-gray-700">Cart ({cartCount})</Link>
              <Link href="/help" className="text-gray-700">Help Center</Link>
            </div>

            <Link href="/try-on" onClick={() => setMenuOpen(false)} className="bg-gradient-to-r from-[#59a4dc] to-[#30cbd1] text-white px-4 py-1.5 rounded-md font-bold text-sm text-center mt-2">
              3D Try On
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
