"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiHeart, FiTrash2, FiShoppingCart, FiArrowRight } from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../components/Toast";

export default function WishlistPage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  const loadWishlist = () => {
    try {
      const storedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
      setWishlist(storedWishlist);
    } catch (e) {
      console.error("Error loading wishlist:", e);
      setWishlist([]);
    }
  };

  useEffect(() => {
    setIsClient(true);
    loadWishlist();

    const handleStorageChange = () => loadWishlist();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("wishlistUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("wishlistUpdated", handleStorageChange);
    };
  }, []);

  const removeItem = (id, showToast = true) => {
    const updated = wishlist.filter((item) => (item.id || item._id) !== id);
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    window.dispatchEvent(new Event("wishlistUpdated"));
    if (showToast) {
      toast.success("Removed from Wishlist");
    }
  };

  const handleAddToCart = async (item) => {
    if (!user) {
      toast.error("Please sign in to add items to your cart");
      router.push("/signin");
      return;
    }

    const productId = item._id || item.id;
    if (!productId) return;

    const success = await addToCart(productId, 1);
    if (success) {
      toast.success(`Added "${item.name}" to cart!`);
      // Remove product from wishlist after adding to cart
      removeItem(productId, false);
    } else {
      toast.error("Failed to add product to cart");
    }
  };

  const getProductPath = (item) => {
    const id = item._id || item.id;
    let categoryPath = "eyeglasses";
    const catLower = item.category?.toLowerCase() || "";
    if (catLower.includes("sunglasses")) {
      categoryPath = "sunglasses";
    } else if (catLower.includes("computer")) {
      categoryPath = "computer-glasses";
    } else if (catLower.includes("power")) {
      categoryPath = "power-glasses";
    } else if (catLower.includes("contact")) {
      categoryPath = "contact-lenses";
    }
    return `/${categoryPath}/${id}`;
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-12 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <FiHeart className="text-red-500 fill-red-500 w-7 h-7" />
              My Wishlist
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {wishlist.length === 1
                ? "1 item saved"
                : `${wishlist.length} items saved`}
            </p>
          </div>
          {wishlist.length > 0 && (
            <Link
              href="/eyeglasses"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
            >
              Continue Shopping <FiArrowRight />
            </Link>
          )}
        </div>

        {/* Wishlist Items Grid */}
        {wishlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-sm text-center px-4"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-400 mb-4">
              <FiHeart className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Your wishlist is empty</h2>
            <p className="text-gray-500 max-w-md mt-2 mb-6 text-sm">
              Explore our collection of stylish eyewear and click the heart icon on any product to save it for later.
            </p>
            <Link
              href="/eyeglasses"
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition shadow-md flex items-center gap-2"
            >
              Explore Collection <FiArrowRight />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {wishlist.map((item) => {
                const itemId = item._id || item.id;
                const productPath = getProductPath(item);
                const itemImage =
                  item.image ||
                  (item.images && item.images.length > 0
                    ? item.images[0].url
                    : "/placeholder.jpg");

                const hasDiscountPrice =
                  Boolean(item.originalPrice) &&
                  Number(item.originalPrice) > Number(item.price);

                return (
                  <motion.div
                    key={itemId}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group relative"
                  >
                    {/* Delete button overlay */}
                    <button
                      onClick={() => removeItem(itemId, true)}
                      className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-md p-2 rounded-full text-gray-500 hover:text-red-500 border border-gray-200 shadow-sm hover:scale-110 transition-transform"
                      title="Remove from Wishlist"
                      aria-label="Remove from Wishlist"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>

                    {/* Image Area */}
                    <Link href={productPath} className="block relative w-full h-56 bg-gray-50 p-4">
                      <Image
                        src={itemImage}
                        alt={item.name}
                        fill
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                      <div>
                        {item.brand && (
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            {item.brand}
                          </span>
                        )}
                        <Link href={productPath} className="hover:text-blue-600 transition">
                          <h3 className="font-bold text-gray-900 text-base line-clamp-1">
                            {item.name}
                          </h3>
                        </Link>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-lg font-extrabold text-gray-900">
                            ₹{item.price}
                          </span>
                          {hasDiscountPrice ? (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{item.originalPrice}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
                      >
                        <FiShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
