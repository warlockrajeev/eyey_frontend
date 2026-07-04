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

export default function ContactLensesPage() {
  const router = useRouter();
  const [sort, setSort] = useState("featured");
  const [selectedFilters, setSelectedFilters] = useState({});
  const [products, setProducts] = useState([]); // State to store fetched products
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Cart and Auth context
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Sidebar filter options for contact lenses
  const filters = {
    "Lens Type": ["Daily", "Monthly", "Yearly"],
    "Lens Material": ["Hydrogel", "Silicone Hydrogel"],
    "Lens Color": ["Transparent", "Blue Tint", "Green Tint", "Brown Tint"],
    Brands: ["Bausch & Lomb", "Acuvue", "Alcon", "CooperVision"],
    "Lens Diameter": ["13.8 mm", "14.0 mm", "14.2 mm"],
    "Lens Power": ["Spherical", "Toric", "Multifocal"],
    Price: ["Under ₹500", "₹500 - ₹999", "₹1000 - ₹1999", "Above ₹2000"],
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
          }/api/products?category=Contact Lenses`,
          {
            method: "GET",
          }
        );
        if (!res.ok) {
          throw new Error("Failed to fetch contact lenses");
        }
        const data = await res.json();
        setProducts(data.products);
      } catch (err) {
        console.error("Error fetching contact lenses:", err);
        setError("Failed to load contact lenses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const slugify = (text) =>
    text
      ? text
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "")
      : "";

  // Filter handler
  const handleFilterChange = (category, option, checked) => {
    setSelectedFilters((prev) => {
      const prevOptions = prev[category] || [];
      let newOptions = [];
      if (checked) {
        newOptions = [...prevOptions, option];
      } else {
        newOptions = prevOptions.filter((o) => o !== option);
      }
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

  // Helper matching function
  const matchesVal = (field, options) => {
    if (!options || options.length === 0) return true;
    if (!field) return false;
    const target = String(field).toLowerCase().trim();
    return options.some((opt) => {
      const optionStr = String(opt).toLowerCase().trim();
      return target.includes(optionStr) || optionStr.includes(target);
    });
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Apply filters
    for (const [category, options] of Object.entries(selectedFilters)) {
      if (options.length === 0) continue;
      filtered = filtered.filter((product) => {
        switch (category) {
          case "Lens Type":
            return matchesVal(product.lens || product.type, options);
          case "Lens Material":
            return matchesVal(product.material, options);
          case "Lens Color":
            return matchesVal(product.color, options);
          case "Brands":
            return matchesVal(product.brand, options);
          case "Lens Diameter":
            return matchesVal(product.diameter || product.frameDimensions, options);
          case "Lens Power":
            return matchesVal(product.power, options);
          case "Price":
            return options.some((priceRange) => {
              if (priceRange === "Under ₹500") return product.price < 500;
              if (priceRange === "₹500 - ₹999")
                return product.price >= 500 && product.price <= 999;
              if (priceRange === "₹1000 - ₹1999")
                return product.price >= 1000 && product.price <= 1999;
              if (priceRange === "Above ₹2000") return product.price > 2000;
              return true;
            });
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (sort === "low-to-high") filtered.sort((a, b) => a.price - b.price);
    if (sort === "high-to-low") filtered.sort((a, b) => b.price - a.price);
    if (sort === "new") filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return filtered;
  }, [products, selectedFilters, sort]);

  // Motion Variants
  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const productVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 via-gray-100 to-gray-200 min-h-screen">
      {/* Top Banner */}
      <motion.div
        className="relative w-full h-48 md:h-64 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <Image
          src="/banner2.svg"
          alt="Contact Lenses Banner"
          fill
          className="object-cover scale-105 transition-transform duration-700 ease-out hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-gray-800/20 to-transparent"></div>
      </motion.div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <motion.aside
          className="w-full md:w-72 bg-gradient-to-b from-gray-100 to-gray-200 p-5 space-y-6 md:min-h-screen shadow-inner"
          initial="hidden"
          animate="show"
          variants={containerVariants}
        >
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
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Sorting Bar */}
          <div className="flex items-center justify-between mb-6 border-b border-gray-300 pb-3">
            <h2 className="text-xl font-semibold text-gray-800 tracking-wide">
              Contact Lenses
            </h2>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            >
              <option value="featured">Featured</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
              <option value="new">Newest First</option>
            </select>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-10 text-lg text-gray-700">
              Loading contact lenses...
            </div>
          ) : error ? (
            <div className="text-center py-10 text-lg text-red-600">
              {error}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10 text-lg text-gray-700">
              No contact lenses found.
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              animate="show"
              variants={containerVariants}
            >
              {filteredProducts.map((product, index) => {
                const discount =
                  product.originalPrice && product.originalPrice > product.price
                    ? Math.round(
                        ((product.originalPrice - product.price) /
                          product.originalPrice) *
                          100
                      )
                    : 0;

                return (
                  <motion.div
                    key={product._id || product.id || index}
                    variants={productVariants}
                  >
                    <div className="relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-2xl hover:scale-[1.02] transform transition-all duration-300 flex flex-col justify-between h-full">
                      <div>
                        {product.bestSeller && (
                          <span className="absolute top-3 left-3 z-10 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                            Best Seller
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

                        <Link
                          href={`/contact-lenses/${product._id}`}
                          className="block"
                        >
                          <div className="relative w-full h-64 bg-gray-50 z-0">
                            {product.images && product.images.length > 0 && (
                              <Image
                                src={product.images[0].url}
                                alt={product.name}
                                fill
                                className="object-contain p-6 transition-transform duration-300 hover:scale-105"
                              />
                            )}
                          </div>

                          <div className="p-5 space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                              {product.name}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{product.brand || product.size || "Standard"}</span>
                              {product.lens && (
                                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                                  {product.lens}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-lg font-bold text-gray-900">
                                ₹{product.price}
                              </span>
                              {product.originalPrice > 0 && (
                                <span className="text-sm text-gray-400 line-through">
                                  ₹{product.originalPrice}
                                </span>
                              )}
                              {discount > 0 && (
                                <span className="text-sm text-green-600 font-medium">
                                  ({discount}% OFF)
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
                        </Link>
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

/* Sidebar Dropdown Component */
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
