"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  Heart,
  Tag,
  X,
  MapPin,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../components/Toast";
import CouponModal from "../../components/CouponModal";
import AddressModal from "../../components/AddressModal";
import OrderSuccessModal from "../../components/OrderSuccessModal";

export default function CartPage() {
  const { user } = useAuth();
  const {
    cartItems,
    cartCount,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
  } = useCart();

  const [localLoading, setLocalLoading] = useState({});

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [suggestedCoupons, setSuggestedCoupons] = useState([]);

  // Address state
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [userAddresses, setUserAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);

  // Payment and order state
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [orderLoading, setOrderLoading] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderData, setOrderData] = useState(null);

  // Scroll state for order summary
  const [shouldScroll, setShouldScroll] = useState(false);
  const cartItemsRef = useRef(null);
  const orderSummaryRef = useRef(null);

  // Debug useEffect to monitor modal state
  useEffect(() => {
    console.log("🔍 Modal state changed:", {
      showOrderSuccess,
      orderData: !!orderData,
    });
  }, [showOrderSuccess, orderData]);

  // Single source of truth for subtotal calculation
  const calculateSubtotal = useCallback(
    (items = cartItems) => {
      const itemsArray = Object.values(items);
      return itemsArray.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    },
    [cartItems]
  );

  // Single source of truth for coupon discount calculation
  const calculateCouponDiscount = useCallback((subtotalAmount, coupon) => {
    if (!coupon) return 0;

    if (coupon.type === "flat") {
      return coupon.amount;
    } else if (coupon.type === "percentage") {
      return Math.floor((subtotalAmount * coupon.amount) / 100);
    }
    return 0;
  }, []);

  // Calculate totals with proper order
  const cartItemsArray = Object.values(cartItems);
  const subtotal = calculateSubtotal(cartItems);
  const originalTotal = cartItemsArray.reduce(
    (sum, item) => sum + (item.originalPrice || item.price) * item.quantity,
    0
  );
  const savings = originalTotal - subtotal;

  const tax = (subtotal - couponDiscount) * 0.18; // 18% tax after coupon discount

  // Calculate shipping based on selected address or default rules
  let shipping = 0;
  if (selectedAddress && selectedAddress.shippingInfo) {
    // Use shipping cost from selected address
    shipping = selectedAddress.shippingInfo.finalCharge;
  } else {
    // Default shipping rules (free shipping above ₹999 after discount)
    shipping = subtotal - couponDiscount > 999 ? 0 : 99;
  }

  const total = subtotal - couponDiscount + tax + shipping;

  // Check if order summary should scroll
  useEffect(() => {
    const checkScrollNeed = () => {
      if (cartItemsRef.current && orderSummaryRef.current) {
        const cartItemsHeight = cartItemsRef.current.offsetHeight;
        const orderSummaryHeight = orderSummaryRef.current.scrollHeight;
        const viewportHeight = window.innerHeight;

        // If order summary is taller than viewport and cart items are shorter than order summary
        const needsScroll =
          orderSummaryHeight > viewportHeight - 200 &&
          cartItemsHeight < orderSummaryHeight;
        setShouldScroll(needsScroll);
      }
    };

    // Check on mount and when cart items change
    setTimeout(checkScrollNeed, 100); // Small delay to ensure DOM is updated

    // Add resize listener
    window.addEventListener("resize", checkScrollNeed);

    return () => {
      window.removeEventListener("resize", checkScrollNeed);
    };
  }, [cartItems, appliedCoupon, selectedAddress, suggestedCoupons]);

  // Fetch suggested coupons
  const fetchSuggestedCoupons = useCallback(async () => {
    try {
      const currentSubtotal = calculateSubtotal(cartItems);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/coupons?status=active&limit=3`
      );
      const data = await response.json();

      if (data.success) {
        // Filter coupons that are applicable for current cart total
        const applicableCoupons = data.data
          .filter(
            (coupon) =>
              currentSubtotal >= coupon.minValue &&
              currentSubtotal <= coupon.maxValue &&
              coupon.usedCount < coupon.usageLimit
          )
          .slice(0, 2); // Show only 2 suggestions

        setSuggestedCoupons(applicableCoupons);
      }
    } catch (error) {
      console.error("Error fetching suggested coupons:", error);
    }
  }, [calculateSubtotal, cartItems]);

  // Fetch user addresses
  const fetchUserAddresses = useCallback(async () => {
    if (!user?._id) return;
    
    setAddressLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/addresses`, {
        method: "GET",
        credentials: "include",
      });
      
      // Handle 404 specifically (API not deployed yet)
      if (response.status === 404) {
        console.log("Address API not available yet");
        setUserAddresses([]);
        return;
      }
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }
      
      const data = await response.json();
      if (data.success) {
        setUserAddresses(data.data || []);
        
        // Auto-select default address if available
        const defaultAddress = data.data?.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
          setDeliveryAvailable(true);
        }
      } else {
        console.error("Failed to fetch addresses:", data.message);
        setUserAddresses([]);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setUserAddresses([]);
    } finally {
      setAddressLoading(false);
    }
  }, [user?._id]);

  // Fetch cart on component mount
  useEffect(() => {
    if (user?._id) {
      fetchCart();
      fetchUserAddresses();
    }
  }, [user, fetchCart, fetchUserAddresses]);

  // Fetch suggested coupons when subtotal changes
  useEffect(() => {
    if (subtotal > 0 && !appliedCoupon) {
      fetchSuggestedCoupons();
    }
  }, [subtotal, appliedCoupon, fetchSuggestedCoupons]);

  // Smart coupon validation when cart changes
  useEffect(() => {
    if (appliedCoupon && cartItemsArray.length > 0) {
      const currentSubtotal = calculateSubtotal(cartItems);

      console.log("Validating coupon:", {
        couponCode: appliedCoupon.code,
        currentSubtotal,
        minValue: appliedCoupon.minValue,
        maxValue: appliedCoupon.maxValue,
        isValid:
          currentSubtotal >= appliedCoupon.minValue &&
          currentSubtotal <= appliedCoupon.maxValue,
      });

      if (currentSubtotal < appliedCoupon.minValue) {
        handleRemoveCoupon();
        toast.error(
          `Cart total (₹${currentSubtotal}) is below minimum value of ₹${appliedCoupon.minValue} for coupon ${appliedCoupon.code}`
        );
      } else if (currentSubtotal > appliedCoupon.maxValue) {
        handleRemoveCoupon();
        toast.error(
          `Cart total (₹${currentSubtotal}) exceeds maximum value of ₹${appliedCoupon.maxValue} for coupon ${appliedCoupon.code}`
        );
      } else {
        // Recalculate discount if coupon is still valid
        const newDiscount = calculateCouponDiscount(
          currentSubtotal,
          appliedCoupon
        );
        if (Math.abs(newDiscount - couponDiscount) > 0.01) {
          setCouponDiscount(newDiscount);
        }
      }
    }
  }, [
    cartItems,
    cartItemsArray.length,
    appliedCoupon,
    calculateSubtotal,
    calculateCouponDiscount,
    couponDiscount,
  ]);

  // Handle quantity update
  const handleUpdateQuantity = async (cartKey, newQuantity) => {
    if (newQuantity < 1) return;

    setLocalLoading((prev) => ({ ...prev, [cartKey]: true }));

    const success = await updateQuantity(cartKey, newQuantity);
    if (success) {
      toast.success("Quantity updated successfully!");
    } else {
      toast.error("Failed to update quantity");
    }

    setLocalLoading((prev) => ({ ...prev, [cartKey]: false }));
  };

  // Handle remove item
  const handleRemoveItem = async (cartKey, itemName) => {
    setLocalLoading((prev) => ({ ...prev, [cartKey]: true }));

    const success = await removeFromCart(cartKey);
    if (success) {
      toast.success(`${itemName} removed from cart!`);
    } else {
      toast.error("Failed to remove item");
    }

    setLocalLoading((prev) => ({ ...prev, [cartKey]: false }));
  };

  // Handle clear cart
  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to clear your entire cart?")) {
      const success = await clearCart();
      if (success) {
        toast.success("Cart cleared successfully!");
        // Reset coupon when cart is cleared
        handleRemoveCoupon();
      } else {
        toast.error("Failed to clear cart");
      }
    }
  };

  // Handle apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);

    try {
      const currentSubtotal = calculateSubtotal(cartItems);

      console.log("Applying coupon:", {
        code: couponCode.trim(),
        orderAmount: currentSubtotal,
        currentSubtotal: currentSubtotal,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/coupons/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: couponCode.trim(),
            orderAmount: currentSubtotal,
          }),
        }
      );

      const data = await response.json();
      console.log("Coupon response:", data);

      if (data.success) {
        setAppliedCoupon(data.data.couponDetails);
        const calculatedDiscount = calculateCouponDiscount(
          currentSubtotal,
          data.data.couponDetails
        );
        setCouponDiscount(calculatedDiscount);
        toast.success(`Coupon applied! You saved ₹${calculatedDiscount}`);
      } else {
        toast.error(data.message || "Invalid coupon code");
        setCouponCode("");
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      toast.error("Failed to apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  // Handle remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    toast.success("Coupon removed");
  };

  // Handle coupon selection from modal
  const handleSelectCouponFromModal = async (code) => {
    setCouponCode(code);

    // Apply the coupon directly
    setCouponLoading(true);

    try {
      const currentSubtotal = calculateSubtotal(cartItems);

      console.log("Applying coupon from modal:", {
        code: code,
        orderAmount: currentSubtotal,
        currentSubtotal: currentSubtotal,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/coupons/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: code,
            orderAmount: currentSubtotal,
          }),
        }
      );

      const data = await response.json();
      console.log("Coupon modal response:", data);

      if (data.success) {
        setAppliedCoupon(data.data.couponDetails);
        const calculatedDiscount = calculateCouponDiscount(
          currentSubtotal,
          data.data.couponDetails
        );
        setCouponDiscount(calculatedDiscount);
        toast.success(
          `Coupon ${code} applied! You saved ₹${calculatedDiscount}`
        );
      } else {
        toast.error(data.message || "Invalid coupon code");
        setCouponCode("");
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      toast.error("Failed to apply coupon");
      setCouponCode("");
    } finally {
      setCouponLoading(false);
    }
  };

  // Handle address added
  const handleAddressAdded = (address) => {
    setSelectedAddress(address);
    setDeliveryAvailable(true);
    // Refresh addresses list to include the new address
    fetchUserAddresses();
    console.log("Address added:", address);
  };

  // Handle remove address
  const handleRemoveAddress = () => {
    setSelectedAddress(null);
    setDeliveryAvailable(true);
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    console.log("=== ORDER PLACEMENT STARTED ===");
    console.log("User:", user);
    console.log("Selected address:", selectedAddress);
    console.log("Cart items:", cartItemsArray);

    if (!selectedAddress) {
      toast.error("Please add a delivery address");
      return;
    }

    if (!deliveryAvailable) {
      toast.error("Delivery not available to this location");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setOrderLoading(true);

    try {
      // Prepare order data using current calculated values
      const orderData = {
        items: cartItemsArray.map((item) => ({
          productId: item.productId || item._id,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          category: item.category,
          image: (typeof item.images?.[0] === "object" ? item.images[0].url : item.images?.[0]) || (typeof item.image === "object" ? item.image?.url || item.image?.src : item.image) || "",
        })),
        shippingAddress: selectedAddress,
        paymentMethod,
        orderSummary: {
          subtotal,
          couponDiscount,
          couponCode: appliedCoupon?.code,
          tax: Math.round(tax * 100) / 100, // Round to 2 decimal places
          shippingCharge: shipping,
          total: Math.round(total * 100) / 100, // Round to 2 decimal places
        },
        notes: "",
      };

      console.log("Making API request with data:", orderData);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          credentials: "include",
          body: JSON.stringify(orderData),
        }
      );

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("API Response:", data);

      if (data.success) {
        console.log("✅ Order successful - Setting modal data");

        // FIRST: Set modal data and show modal
        setOrderData(data.data);
        setShowOrderSuccess(true);

        console.log("Modal state set:", {
          orderData: data.data,
          showOrderSuccess: true,
        });

        // Force a small delay to ensure state is set
        setTimeout(() => {
          console.log("Checking modal state after delay:", {
            showOrderSuccess: true,
            orderDataExists: !!data.data,
          });
        }, 100);

        toast.success("Order placed successfully!");

        // Don't clear cart automatically - let user decide when to close modal
        console.log(
          "✅ Order completed - cart will be cleared when user closes modal"
        );
      } else {
        console.error("❌ Order failed:", data.message, data.error);
        const errMsg = data.error
          ? `${data.message}: ${data.error}`
          : data.message || "Failed to place order";
        toast.error(errMsg);
      }
    } catch (error) {
      console.error("❌ Order placement error:", error);
      toast.error("Failed to place order");
    } finally {
      setOrderLoading(false);
      console.log("=== ORDER PLACEMENT COMPLETED ===");
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -100 },
  };

  // Loading state
  if (loading && cartCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (!loading && cartCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Your Cart is Empty
          </h2>
          <p className="text-gray-600 mb-8">
            Start shopping to add items to your cart and enjoy great deals!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Shopping Cart
              </h1>
              <p className="text-gray-600 mt-1">
                {cartCount} item(s) in your cart
              </p>
            </div>
            <Link
              href="/"
              className="group flex items-center gap-3 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white px-6 py-2 rounded-full shadow-md border border-blue-400/30 font-semibold text-base hover:from-blue-600 hover:to-blue-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 active:scale-95 transform-gpu hover:scale-105"
              style={{ boxShadow: "0 4px 16px 0 rgba(30, 64, 175, 0.10)" }}
            >
              <span className="flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1 group-hover:scale-110" />
              </span>
              <span className="tracking-wide">Continue Shopping</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <motion.div
              ref={cartItemsRef}
              className="bg-white rounded-xl shadow-sm p-6"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {/* Clear Cart Button */}
              {cartCount > 0 && (
                <div className="flex justify-between items-center mb-6 pb-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Cart Items
                  </h2>
                  <button
                    onClick={handleClearCart}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                    disabled={loading}
                  >
                    Clear Cart
                  </button>
                </div>
              )}

              {/* Items List */}
              <AnimatePresence mode="popLayout">
                {Object.entries(cartItems).map(([cartKey, item]) => (
                  <motion.div
                    key={cartKey}
                    variants={itemVariants}
                    exit="exit"
                    className="flex gap-4 p-4 border border-gray-200 rounded-lg mb-4 last:mb-0"
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                      <Image
                        src={item.images?.[0]?.url || "/placeholder-image.jpg"}
                        alt={item.name}
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {item.category}
                          </p>
                          {(item.size || item.color) && (
                            <p className="text-sm text-gray-500">
                              {item.size && `Size: ${item.size}`}
                              {item.size && item.color && " • "}
                              {item.color && `Color: ${item.color}`}
                            </p>
                          )}
                          {item.lensPackage && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-800 bg-gray-100 p-2 rounded-lg border border-gray-200">
                              <span className="font-bold text-gray-900">Lens Plan:</span>
                              <span className="font-semibold text-gray-800">
                                {item.lensPackage.name || item.lensPackage.feature || item.lensPackage.optionName}
                              </span>
                              {item.lensPackage.thickness && (
                                <span className="text-gray-500">• {item.lensPackage.thickness}</span>
                              )}
                              {item.lensPackage.warranty && (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  {item.lensPackage.warranty} Warranty
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(cartKey, item.name)}
                          disabled={localLoading[cartKey]}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Price and Quantity Controls */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            ₹{item.price?.toLocaleString()}
                          </span>
                          {item.originalPrice > item.price ? (
                            <span className="text-sm text-gray-400 line-through">
                              ₹{item.originalPrice?.toLocaleString()}
                            </span>
                          ) : null}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(cartKey, item.quantity - 1)
                            }
                            disabled={
                              item.quantity <= 1 || localLoading[cartKey]
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <span className="font-semibold min-w-[2rem] text-center">
                            {localLoading[cartKey] ? "..." : item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              handleUpdateQuantity(cartKey, item.quantity + 1)
                            }
                            disabled={localLoading[cartKey]}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="mt-2 text-right">
                        <span className="text-sm text-gray-600">Total: </span>
                        <span className="font-bold text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              ref={orderSummaryRef}
              className={`bg-white rounded-xl shadow-sm p-6 ${
                shouldScroll
                  ? "max-h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400"
                  : "sticky top-8"
              }`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                // Custom scrollbar styles for better appearance
                scrollbarWidth: shouldScroll ? "thin" : "auto",
                scrollbarColor: shouldScroll ? "#d1d5db #f3f4f6" : "auto",
              }}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Order Summary
              </h2>

              {/* Coupon Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Apply Coupon Code
                  </h3>
                  <button
                    onClick={() => setShowCouponModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Available
                  </button>
                </div>

                {!appliedCoupon ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code (e.g., SAVE10)"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                        disabled={couponLoading}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleApplyCoupon()
                        }
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors min-w-[60px]"
                      >
                        {couponLoading ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Enter your coupon code to get discount on your order
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <span className="text-sm font-medium text-green-800">
                          {appliedCoupon.code}
                        </span>
                        <p className="text-xs text-green-600">
                          {appliedCoupon.name} • Saved ₹
                          {couponDiscount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100 transition-colors"
                      title="Remove coupon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Suggested Coupons */}
              {!appliedCoupon && suggestedCoupons.length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-600" />
                    Recommended for You
                  </h3>
                  <div className="space-y-2">
                    {suggestedCoupons.map((coupon) => {
                      const potentialDiscount = calculateCouponDiscount(
                        subtotal,
                        coupon
                      );
                      return (
                        <div
                          key={coupon._id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 cursor-pointer transition-colors"
                          onClick={() =>
                            handleSelectCouponFromModal(coupon.code)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-blue-100 rounded">
                              <Tag className="w-3 h-3 text-blue-600" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {coupon.code}
                              </span>
                              <p className="text-xs text-gray-600">
                                {coupon.name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              Save ₹{potentialDiscount}
                            </p>
                            <p className="text-xs text-blue-600">
                              Click to apply
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Address Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Delivery Address
                  </h3>
                </div>

                {addressLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading addresses...</span>
                  </div>
                ) : !selectedAddress && userAddresses.length === 0 ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Add Delivery Address
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                      We&apos;ll check if we deliver to your location
                    </p>
                  </div>
                ) : !selectedAddress && userAddresses.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-2">Select from your saved addresses:</p>
                    {userAddresses.map((address) => (
                      <div
                        key={address._id}
                        className={`p-3 border rounded-md cursor-pointer transition-all ${
                          selectedAddress?._id === address._id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => {
                          setSelectedAddress(address);
                          setDeliveryAvailable(true);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {address.name}
                              </span>
                              {address.isDefault && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {address.address}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {address.phone}
                            </p>
                          </div>
                          <div className="ml-2">
                            <div
                              className={`w-4 h-4 rounded-full border-2 ${
                                selectedAddress?._id === address._id
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedAddress?._id === address._id && (
                                <div className="w-full h-full rounded-full bg-white scale-50"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      Add New Address
                    </button>
                  </div>
                ) : selectedAddress ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between p-3 bg-white border border-gray-200 rounded-md">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {selectedAddress.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            ✓ Available
                          </span>
                          {selectedAddress.isDefault && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {selectedAddress.address}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedAddress.phone}
                        </p>
                        {selectedAddress.shippingInfo && (
                          <p className="text-xs text-blue-600 mt-1">
                            Shipping: ₹
                            {selectedAddress.shippingInfo.finalCharge} to{" "}
                            {selectedAddress.shippingInfo.state}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handleRemoveAddress}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors ml-2"
                        title="Remove address"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      Change Address
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Payment Method Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    💳 Payment Method
                  </h3>
                </div>

                <div className="space-y-3">
                  {/* Cash on Delivery */}
                  <div
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "cash_on_delivery"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setPaymentMethod("cash_on_delivery")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            paymentMethod === "cash_on_delivery"
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {paymentMethod === "cash_on_delivery" && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            Cash on Delivery
                          </span>
                          <p className="text-xs text-gray-500">
                            Pay when your order is delivered
                          </p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        Available
                      </span>
                    </div>
                  </div>

                  {/* Online Payment - Disabled */}
                  <div className="p-3 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed bg-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            Online Payment
                          </span>
                          <p className="text-xs text-gray-400">
                            Credit/Debit Card, UPI, Net Banking
                          </p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Subtotal ({cartCount} items)
                  </span>
                  <span className="font-semibold">
                    ₹{subtotal.toLocaleString()}
                  </span>
                </div>

                {/* Savings */}
                {savings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Savings</span>
                    <span className="font-semibold">
                      -₹{savings.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Coupon Discount */}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount ({appliedCoupon?.code})</span>
                    <span className="font-semibold">
                      -₹{couponDiscount.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Tax */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (18%)</span>
                  <span className="font-semibold">₹{Math.round(tax)}</span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Shipping
                    {selectedAddress && selectedAddress.shippingInfo && (
                      <span className="text-xs text-gray-500 block">
                        to {selectedAddress.shippingInfo.state}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold">
                    {shipping === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>

                {/* Free shipping notice */}
                {shipping > 0 && !selectedAddress?.shippingInfo && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                    Add ₹
                    {Math.max(
                      0,
                      1000 - (subtotal - couponDiscount)
                    ).toLocaleString()}{" "}
                    more for free shipping!
                  </div>
                )}

                {/* Location-based shipping info */}
                {selectedAddress?.shippingInfo && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    📍 Shipping to {selectedAddress.shippingInfo.state}: ₹
                    {selectedAddress.shippingInfo.finalCharge}
                    {selectedAddress.shippingInfo.finalCharge === 0 && (
                      <span className="text-green-600 ml-1">(Free)</span>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{Math.round(total).toLocaleString()}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                {!selectedAddress ? (
                  <div className="mt-6 space-y-2">
                    <button
                      disabled
                      className="w-full bg-gray-400 text-white py-3 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Add Address to Proceed
                    </button>
                    <p className="text-xs text-center text-gray-500">
                      Please add a delivery address to continue
                    </p>
                  </div>
                ) : !deliveryAvailable ? (
                  <div className="mt-6 space-y-2">
                    <button
                      disabled
                      className="w-full bg-red-400 text-white py-3 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Delivery Not Available
                    </button>
                    <p className="text-xs text-center text-red-600">
                      We don&apos;t deliver to this location yet
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={orderLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-6 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {orderLoading ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Placing Order...
                      </>
                    ) : (
                      `Place Order - ₹${Math.round(total).toLocaleString()}`
                    )}
                  </button>
                )}

                {/* Security Badge */}
                <div className="text-center text-sm text-gray-500 mt-4">
                  🔒 Secure Checkout • 100% Safe & Secure
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Coupon Modal */}
      <CouponModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        onSelectCoupon={handleSelectCouponFromModal}
        currentTotal={subtotal}
      />

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressAdded={handleAddressAdded}
        currentUser={user}
      />

      {/* Order Success Modal */}
      <OrderSuccessModal
        isOpen={showOrderSuccess}
        onClose={async (navigateTo = "/") => {
          console.log(
            "Modal close requested - clearing cart and navigating to:",
            navigateTo
          );

          try {
            // Clear cart and reset state when user closes modal
            await clearCart();
            setAppliedCoupon(null);
            setCouponDiscount(0);
            setCouponCode("");
            console.log("✅ Cart cleared successfully");
          } catch (error) {
            console.error("❌ Error clearing cart:", error);
          }

          setShowOrderSuccess(false);

          // Navigate to specified page after clearing
          setTimeout(() => {
            window.location.href = navigateTo;
          }, 100);
        }}
        orderData={orderData}
      />
    </div>
  );
}
