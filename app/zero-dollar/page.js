"use client";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ShoppingCart, Zap } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../components/Toast";

export default function ZeroDollarPage() {
  const router = useRouter();
  const [sort, setSort] = useState("featured");
  const [selectedFilters, setSelectedFilters] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToCart } = useCart();
  const { user } = useAuth();

  const filters = {
    "Frame Style": ["Full Rim", "Half Rim", "Rimless"],
    "Frame Shape": ["Rectangle", "Round", "Aviator", "Square", "Cat Eye"],
    "Frame Color": ["Black", "Blue", "Brown", "Transparent"],
  };

  const matchesVal = (field, options) => {
    if (!options || options.length === 0) return true;
    if (!field) return false;
    const target = String(field).toLowerCase().trim();
    return options.some((opt) => {
      const optionStr = String(opt).toLowerCase().trim();
      return target.includes(optionStr) || optionStr.includes(target);
    });
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    for (const [category, options] of Object.entries(selectedFilters)) {
      if (options.length === 0) continue;
      filtered = filtered.filter((product) => {
        switch (category) {
          case "Frame Style":
            return matchesVal(product.style, options);
          case "Frame Shape":
            return matchesVal(product.shape, options);
          case "Frame Color":
            return matchesVal(product.color, options);
          default:
            return true;
        }
      });
    }

    if (sort === "low-to-high") filtered.sort((a, b) => a.price - b.price);
    if (sort === "high-to-low") filtered.sort((a, b) => b.price - a.price);

    return filtered;
  }, [products, selectedFilters, sort]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/products`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error("Error fetching zero dollar products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleFilterChange = (category, option, checked) => {
    setSelectedFilters((prev) => {
      const prevOptions = prev[category] || [];
      let newOptions = checked
        ? [...prevOptions, option]
        : prevOptions.filter((o) => o !== option);
      return { ...prev, [category]: newOptions };
    });
  };

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

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 via-gray-100 to-gray-200 min-h-screen">
      {/* Top Banner */}
      <motion.div
        className="relative w-full h-48 md:h-64 overflow-hidden bg-gradient-to-r from-orange-500 to-amber-600 flex items-center px-8 md:px-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="text-white z-10 max-w-2xl">
          <span className="bg-white text-orange-600 font-extrabold px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-3 inline-block">
            Special Promo
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-2 tracking-tight">
            $0 Frame Collection
          </h1>
          <p className="text-sm md:text-lg text-orange-100">
            Get your first frame for FREE on selected prescription lenses or promotional bundles!
          </p>
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-72 bg-gradient-to-b from-gray-100 to-gray-200 p-5 space-y-6 md:min-h-screen shadow-inner">
          <h2 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-2">
            Filters
          </h2>

          {Object.entries(filters).map(([key, options]) => (
            <FilterDropdown
              key={key}
              title={key}
              options={options}
              selectedOptions={selectedFilters[key] || []}
              onChange={handleFilterChange}
            />
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6 border-b border-gray-300 pb-3">
            <h2 className="text-xl font-semibold text-gray-800 tracking-wide">
              $0 Frame Eligible Eyewear
            </h2>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            >
              <option value="featured">Featured</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-10 text-lg text-gray-700">
              Loading zero-dollar frames...
            </div>
          ) : error ? (
            <div className="text-center py-10 text-lg text-red-600">
              {error}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10 text-lg text-gray-700">
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product, index) => (
                <div key={product._id || product.id || index}>
                  <div className="relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-2xl hover:scale-[1.02] transform transition-all duration-300 flex flex-col justify-between h-full">
                    <div>
                      <span className="absolute top-3 left-3 z-10 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        $0 Frame Offer
                      </span>

                      <Link
                        href={`/eyeglasses/${product._id}`}
                        className="block"
                      >
                        <div className="relative w-full h-64 bg-gray-50 z-0">
                          <Image
                            src={
                              product.images && product.images.length > 0
                                ? product.images[0].url
                                : "/placeholder.jpg"
                            }
                            alt={product.name}
                            fill
                            className="object-contain p-6 transition-transform duration-300 hover:scale-105"
                          />
                        </div>

                        <div className="p-5 space-y-2">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{product.brand || product.size || "Standard"}</span>
                            {product.shape && (
                              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                                {product.shape}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-lg font-bold text-green-600">
                              Frame: $0
                            </span>
                            <span className="text-xs text-gray-500">
                              (Regular: ₹{product.price})
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>

                    <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => handleAddToCart(e, product._id)}
                        className="w-full py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Add to Cart
                      </button>
                      <button
                        onClick={(e) => handleBuyNow(e, product._id)}
                        className="w-full py-2.5 px-3 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function FilterDropdown({ title, options, selectedOptions, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-300 pb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-gray-700 font-semibold hover:text-gray-900 transition"
      >
        <span>{title}</span>
        {open ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2 space-y-1 overflow-hidden"
          >
            {options.map((option, index) => (
              <li
                key={index}
                className="flex items-center gap-2 hover:text-gray-900 transition-colors"
              >
                <input
                  type="checkbox"
                  id={`${title}-${index}`}
                  checked={selectedOptions.includes(option)}
                  onChange={(e) => onChange(title, option, e.target.checked)}
                  className="accent-gray-700"
                />
                <label
                  htmlFor={`${title}-${index}`}
                  className="text-sm text-gray-600"
                >
                  {option}
                </label>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
