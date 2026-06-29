"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../components/Toast";
import { API_BASE_URL } from "../../config";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("featured");

  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/products?search=${encodeURIComponent(query.trim())}`);
        if (!res.ok) {
          throw new Error("Failed to fetch search results");
        }
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error("Error fetching search results:", err);
        setError("Something went wrong while searching. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  // Sort products
  const sortedProducts = useMemo(() => {
    let sorted = [...products];
    if (sort === "low-to-high") sorted.sort((a, b) => a.price - b.price);
    if (sort === "high-to-low") sorted.sort((a, b) => b.price - a.price);
    if (sort === "new") sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sorted;
  }, [products, sort]);

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }

    const success = await addToCart(productId, 1);
    if (success) {
      toast.success("Product added to cart successfully!");
    } else {
      toast.error("Failed to add product to cart");
    }
  };

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 py-10 px-4 md:px-16 font-nunito animate-fadeIn">
      {/* Title Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Search Results for: <span className="text-blue-600 font-bold">"{query}"</span>
        </h1>
        <p className="text-gray-500 mt-2 font-medium">
          {loading ? "Searching..." : `${products.length} ${products.length === 1 ? "product" : "products"} found`}
        </p>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Main Content Area */}
        <main className="flex-1">
          {/* Controls / Filter Bar */}
          {products.length > 0 && (
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-600">Showing all matched products</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Sort By:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="featured">Featured</option>
                  <option value="low-to-high">Price: Low to High</option>
                  <option value="high-to-low">Price: High to Low</option>
                  <option value="new">Newest First</option>
                </select>
              </div>
            </div>
          )}

          {/* Load States */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-4 font-semibold">Finding the best eyewear for you...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-red-100 p-8">
              <p className="text-red-500 text-lg font-bold">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-800">No results found</h2>
              <p className="text-gray-500 mt-2 max-w-md">
                We couldn't find any products matching your search query. Try checking your spelling or search for something else like "Aviator", "Ray-Ban", or "Sunglasses".
              </p>
              <Link
                href="/eyeglasses"
                className="mt-6 inline-block bg-blue-600 text-white font-bold py-2.5 px-6 rounded-md shadow-md hover:bg-blue-700 transition"
              >
                Browse All Eyeglasses
              </Link>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              animate="show"
              variants={containerVariants}
            >
              {sortedProducts.map((product) => {
                const discount = product.originalPrice
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0;

                // Determine category prefix for routing
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

                return (
                  <motion.div key={product._id} variants={itemVariants}>
                    <div className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transform transition-all duration-300 flex flex-col h-full">
                      {product.hotSeller && (
                        <span className="absolute top-3 left-3 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                          Hot Seller
                        </span>
                      )}

                      {/* Image Area */}
                      <Link href={`/${categoryPath}/${product._id}`} className="block relative w-full h-56 bg-gray-50 overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            No Image
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </Link>

                      {/* Detail Area */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                              {product.brand || product.category}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              {product.size || "Standard"}
                            </span>
                          </div>
                          <Link href={`/${categoryPath}/${product._id}`}>
                            <h3 className="text-base font-bold text-gray-900 line-clamp-2 hover:text-blue-600 transition duration-200">
                              {product.name}
                            </h3>
                          </Link>
                          <p className="text-gray-500 text-xs mt-1.5 line-clamp-2">
                            {product.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg font-extrabold text-gray-900">
                                ₹{product.price}
                              </span>
                              {discount > 0 && (
                                <span className="text-xs text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">
                                  {discount}% OFF
                                </span>
                              )}
                            </div>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-xs text-gray-400 line-through">
                                ₹{product.originalPrice}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => handleAddToCart(e, product._id)}
                            className="bg-blue-600 text-white p-2.5 rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 font-bold text-sm px-4"
                            title="Add to Cart"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
