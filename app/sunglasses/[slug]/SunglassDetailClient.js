"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Star,
  Truck,
  ShieldCheck,
  Store,
  ShoppingCart,
  Zap,
  ChevronDown,
  ChevronRight,
  Eye,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Minus,
  Plus,
} from "lucide-react";
import React from "react";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "../../../components/Toast";

export default function SunglassDetail({ product, slug }) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState("description");
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Check if product is already in wishlist
  React.useEffect(() => {
    if (product && product._id) {
      try {
        const stored = JSON.parse(localStorage.getItem("wishlist")) || [];
        const exists = stored.some((item) => (item.id || item._id) === product._id);
        setIsWishlisted(exists);
      } catch (e) {
        console.error("Error reading wishlist:", e);
      }
    }
  }, [product]);

  const toggleWishlist = () => {
    if (!product || !product._id) return;
    try {
      const stored = JSON.parse(localStorage.getItem("wishlist")) || [];
      const exists = stored.some((item) => (item.id || item._id) === product._id);
      let updated;
      if (exists) {
        updated = stored.filter((item) => (item.id || item._id) !== product._id);
        setIsWishlisted(false);
        toast.success("Removed from Wishlist");
      } else {
        const itemToAdd = {
          id: product._id,
          _id: product._id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          image: (product.images && product.images.length > 0) ? product.images[0].url : "/placeholder.jpg",
          category: product.category || "sunglasses",
          brand: product.brand
        };
        updated = [...stored, itemToAdd];
        setIsWishlisted(true);
        toast.success("Added to Wishlist!");
      }
      localStorage.setItem("wishlist", JSON.stringify(updated));
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (e) {
      console.error("Error updating wishlist:", e);
    }
  };

  // Cart and Auth context
  const { addToCart, loading: cartLoading, isInCart } = useCart();
  const { user } = useAuth();

  // Check if product is already in cart
  const productInCart = isInCart(product._id);

  const imageFiles =
    product.images && product.images.length > 0
      ? product.images.map((image) => image.url)
      : ["/placeholder.jpg"];

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : 50;

  const originalPriceDisplay =
    product.originalPrice > 0
      ? product.originalPrice
      : Math.round(product.price * 1.5);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }

    const success = await addToCart(product._id, quantity);
    if (success) {
      toast.success("Added to cart successfully!");
    } else {
      toast.error("Failed to add product to cart");
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error("Please login to proceed to checkout");
      return;
    }
    if (!productInCart) {
      await addToCart(product._id, quantity);
    }
    router.push("/cart");
  };

  const toggleSection = (sectionId) => {
    setOpenSection(openSection === sectionId ? "" : sectionId);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-12 font-sans text-gray-900">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto mb-6 text-xs sm:text-sm text-gray-500 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-gray-900 transition">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link href="/sunglasses" className="hover:text-gray-900 transition">
          Sunglasses
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-900 font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN - Sticky Gallery */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4">
            <div className="relative bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-10 shadow-sm hover:shadow-md transition-shadow">
              {/* Badges */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {product.bestSeller && (
                  <span className="bg-gradient-to-r from-gray-800 to-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                    Best Seller
                  </span>
                )}
                {discount > 0 && (
                  <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    {discount}% OFF
                  </span>
                )}
              </div>

              {/* Wishlist */}
              <button
                onClick={toggleWishlist}
                className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md p-2.5 rounded-full border border-gray-200 shadow-sm hover:scale-110 transition-transform text-gray-700 hover:text-red-500"
                aria-label="Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted ? "text-red-500 fill-red-500" : ""
                  }`}
                />
              </button>

              {/* Main Image */}
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-[22rem] sm:h-[30rem] flex items-center justify-center overflow-hidden rounded-2xl bg-gray-50/50"
              >
                <Image
                  src={imageFiles[selectedImage - 1] || imageFiles[0]}
                  alt={product.name}
                  fill
                  className="object-contain p-4 sm:p-8"
                  priority
                />
              </motion.div>
            </div>

            {/* Thumbnails */}
            {imageFiles.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {imageFiles.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx + 1)}
                    className={`relative aspect-square rounded-2xl overflow-hidden bg-white border-2 transition-all duration-200 p-2 ${
                      selectedImage === idx + 1
                        ? "border-gray-900 shadow-md scale-[1.02]"
                        : "border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-400"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      fill
                      className="object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Details */}
          <div className="lg:col-span-5 space-y-6">
            {/* Title & Brand */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-md">
                  {product.brand || "EyeyOptics Sun Collection"}
                </span>
                {product.stock <= 0 ? (
                  <span className="text-xs text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full border border-red-200 flex items-center gap-1">
                    <span>❌</span> Out of Stock
                  </span>
                ) : product.stock <= 5 ? (
                  <span className="text-xs text-amber-700 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1 animate-pulse">
                    <span>⚡</span> Low Stock: Only {product.stock} left!
                  </span>
                ) : (
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({product.stock} left)
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg gap-1">
                  <span>{product.sellerRating || "4.9"}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  (96 Verified Buyer Reviews)
                </span>
              </div>
            </div>

            {/* Price Card */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  ₹{product.price?.toLocaleString()}
                </span>
                {originalPriceDisplay > product.price && (
                  <span className="text-lg text-gray-400 line-through font-medium">
                    ₹{originalPriceDisplay.toLocaleString()}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                    {discount}% OFF
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Inclusive of all taxes & free express delivery
              </p>
            </div>

            {/* Low Stock Warning Banner */}
            {product.stock > 0 && product.stock <= 5 && (
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/40 rounded-2xl p-4 flex items-center gap-3 text-amber-900 text-xs font-bold shadow-xs">
                <span className="text-xl">🔥</span>
                <div>
                  <p className="text-sm font-extrabold text-amber-900">Hurry! Low Stock Alert</p>
                  <p className="text-amber-800/90 font-medium mt-0.5">Only <span className="underline decoration-amber-500 decoration-2 font-extrabold text-amber-900">{product.stock} units remaining</span> in stock. Order now before it runs out!</p>
                </div>
              </div>
            )}
            {product.stock <= 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-800 text-xs font-bold shadow-xs">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-sm font-extrabold text-red-900">Currently Out of Stock</p>
                  <p className="text-red-700 font-medium mt-0.5">This item is currently out of stock. Please check back later for restock.</p>
                </div>
              </div>
            )}

            {/* Frame Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white border border-gray-200 p-3 rounded-xl text-center">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">
                  Size
                </span>
                <span className="font-semibold text-gray-800">
                  {product.size || "Medium"}
                </span>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-xl text-center">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">
                  Shape
                </span>
                <span className="font-semibold text-gray-800">
                  {product.shape || "Aviator"}
                </span>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-xl text-center">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">
                  Polarized
                </span>
                <span className="font-semibold text-gray-800">
                  Yes (UV400)
                </span>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-xl text-center">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">
                  Style
                </span>
                <span className="font-semibold text-gray-800">
                  {product.style || "Full Rim"}
                </span>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between bg-white border border-gray-200 p-3.5 rounded-2xl">
              <span className="text-sm font-semibold text-gray-700">Quantity</span>
              <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-bold text-sm text-gray-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleAddToCart}
                disabled={cartLoading || productInCart || product.stock <= 0}
                className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                  product.stock <= 0
                    ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                    : productInCart
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {product.stock <= 0
                  ? "Out of Stock"
                  : cartLoading
                  ? "Adding..."
                  : productInCart
                  ? "✓ Added in Cart"
                  : "Add to Cart"}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  product.stock <= 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-900 hover:bg-black text-white"
                }`}
              >
                <Zap className="w-4 h-4" />
                {product.stock <= 0 ? "Out of Stock" : "Buy Now"}
              </button>
            </div>

            {/* Trust Features Bar */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white border border-gray-200 p-3 rounded-xl text-center flex flex-col items-center">
                <Truck className="w-5 h-5 text-gray-700 mb-1" />
                <span className="text-[11px] font-bold text-gray-800">
                  Free Shipping
                </span>
                <span className="text-[9px] text-gray-500">Above ₹999</span>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-xl text-center flex flex-col items-center">
                <RotateCcw className="w-5 h-5 text-gray-700 mb-1" />
                <span className="text-[11px] font-bold text-gray-800">
                  7 Days Return
                </span>
                <span className="text-[9px] text-gray-500">Easy exchange</span>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-xl text-center flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-gray-700 mb-1" />
                <span className="text-[11px] font-bold text-gray-800">
                  UV Protection
                </span>
                <span className="text-[9px] text-gray-500">100% Polarized</span>
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2.5 rounded-xl text-gray-700">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wider">
                    Official Seller
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    {product.sellerName || "EyeyOptics Official Store"}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Verified Seller
              </span>
            </div>

            {/* Collapsible Accordions */}
            <div className="space-y-3 pt-2">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection("description")}
                  className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-gray-900"
                >
                  <span>Product Description</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      openSection === "description" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openSection === "description" && (
                  <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-100">
                    {product.description ||
                      "Designed for maximum sun protection and effortless style. Features TAC polarized lenses to eliminate glare and enhance clarity in outdoor settings."}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection("specifications")}
                  className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-gray-900"
                >
                  <span>Specifications & Fit</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      openSection === "specifications" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openSection === "specifications" && (
                  <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="font-semibold text-gray-500">Gender</span>
                      <span className="font-bold text-gray-900">
                        {product.gender || "Unisex"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="font-semibold text-gray-500">Lens Color</span>
                      <span className="font-bold text-gray-900">
                        {product.color || "Dark Grey / Gradient"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="font-semibold text-gray-500">UV Rating</span>
                      <span className="font-bold text-gray-900">UV400 Polarized</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
