"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingCart, Zap } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../components/Toast";
import { API_BASE_URL } from "../../config";

function SearchResultsContent() {
  const router = useRouter();
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
    if (sort === "new") sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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

  const handleBuyNow = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to buy items");
      return;
    }

    const success = await addToCart(productId, 1);
    if (success) {
      router.push("/cart");
    } else {
      toast.error("Failed to process request");
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
          Search Results for: <span className="text-gray-800 font-bold">"{query}"</span>
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
                  className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
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
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800"></div>
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
                className="mt-6 inline-block bg-gray-900 text-white font-bold py-2.5 px-6 rounded-md shadow-md hover:bg-black transition"
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
                const discount = product.originalPrice && product.originalPrice > product.price
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
                    <div className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transform transition-all duration-300 flex flex-col justify-between h-full">
                      <div>
                        {product.hotSeller && (
                          <span className="absolute top-3 left-3 z-10 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                            Hot Seller
                          </span>
                        )}

                        {product.stock <= 0 ? (
                          <span className="absolute top-3 right-3 z-10 bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider">
                            Out of Stock
                          </span>
                        ) : product.stock <= 5 ? (
                          <span className="absolute top-3 right-3 z-10 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 animate-pulse">
                            ⚡ Only {product.stock} left
                          </span>
                        ) : null}

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
                        </Link>

                        {/* Detail Area */}
                        <div className="p-5 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                              {product.brand || product.category}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              {product.size || "Standard"}
                            </span>
                          </div>
                          <Link href={`/${categoryPath}/${product._id}`}>
                            <h3 className="text-base font-bold text-gray-900 line-clamp-1 hover:text-gray-700 transition duration-200">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-lg font-extrabold text-gray-900">
                              ₹{product.price}
                            </span>
                            {product.originalPrice > 0 && (
                              <span className="text-xs text-gray-400 line-through">
                                ₹{product.originalPrice}
                              </span>
                            )}
                            {discount > 0 && (
                              <span className="text-xs text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">
                                {discount}% OFF
                              </span>
                            )}
                          </div>

                          {/* Stock Indicator Line */}
                          {product.stock <= 0 ? (
                            <p className="text-xs text-red-600 font-bold flex items-center gap-1 pt-1">
                              <span>❌</span> Out of Stock
                            </p>
                          ) : product.stock <= 5 ? (
                            <p className="text-xs text-amber-600 font-bold flex items-center gap-1 pt-1">
                              <span>🔥</span> Low Stock: Only {product.stock} left!
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                        <button
                          disabled={product.stock <= 0}
                          onClick={(e) => handleAddToCart(e, product._id)}
                          className={`w-full py-2.5 px-3 border text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 ${
                            product.stock <= 0
                              ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300"
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                        </button>
                        <button
                          disabled={product.stock <= 0}
                          onClick={(e) => handleBuyNow(e, product._id)}
                          className={`w-full py-2.5 px-3 text-xs font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-1.5 ${
                            product.stock <= 0
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-gray-900 hover:bg-black text-white"
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Buy Now
                        </button>
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
