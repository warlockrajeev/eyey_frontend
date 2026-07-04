"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { API_ENDPOINTS } from "../../config";
import {
  FaShoppingBag,
  FaCalendarAlt,
  FaBox,
  FaEye,
  FaTimes,
  FaSync,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCreditCard,
  FaTruck,
} from "react-icons/fa";

export default function OrderHistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    }
  }, [user, authLoading, router]);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.ORDERS_USER, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.data?.orders || []);
      } else {
        console.error("Failed to fetch orders:", data.message);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  const getValidImageUrl = (item) => {
    if (!item) return null;
    
    let img = item.image;
    
    // Fallback to populated Product catalog
    if ((!img || img === "[object Object]") && item.productId && typeof item.productId === "object") {
      const pImages = item.productId.images;
      if (pImages && pImages.length > 0) {
        img = pImages[0];
      }
    }

    // Fallback to item.images array
    if ((!img || img === "[object Object]") && item.images && item.images.length > 0) {
      img = item.images[0];
    }

    // Handle object structure { url: "..." }
    if (typeof img === "object" && img !== null) {
      img = img.url || img.src || img.secure_url || (Array.isArray(img) ? img[0] : null);
    }

    if (typeof img !== "string" || !img.trim() || img === "[object Object]") {
      return null;
    }

    const trimmed = img.trim();

    // Ignore 24-character hex Mongo ObjectIDs mistakenly saved as image strings
    if (trimmed.length === 24 && !trimmed.includes(".") && !trimmed.includes("/")) {
      return null;
    }

    if (
      trimmed.startsWith("/") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://")
    ) {
      return trimmed;
    }
    if (trimmed.includes(".") || trimmed.includes("/")) {
      return `/${trimmed}`;
    }
    return null;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-50 text-blue-800 border-blue-200",
      processing: "bg-indigo-50 text-indigo-800 border-indigo-200",
      shipped: "bg-purple-50 text-purple-800 border-purple-200",
      delivered: "bg-emerald-50 text-emerald-800 border-emerald-200",
      cancelled: "bg-red-50 text-red-800 border-red-200",
    };
    return colors[status?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "all") return true;
    return order.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  if (authLoading || (loading && orders.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-12 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Top Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/profile"
                className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition"
              >
                <FaArrowLeft className="text-[10px]" /> Back to Profile
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <FaShoppingBag className="text-gray-800" /> My Orders
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Check order statuses, view items, and track deliveries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition shadow-sm disabled:opacity-50"
            >
              <FaSync className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/eyeglasses"
              className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition shadow-sm"
            >
              Shop More
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap capitalize ${
                statusFilter === filter
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {filter === "all" ? "All Orders" : filter}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-sm text-center px-4"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <FaShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {statusFilter === "all" ? "No orders found" : `No ${statusFilter} orders`}
            </h2>
            <p className="text-gray-500 max-w-md mt-2 mb-6 text-sm">
              You haven't placed any orders in this category yet. Explore our eyewear collection to find something you love!
            </p>
            <Link
              href="/eyeglasses"
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition shadow-md"
            >
              Explore Eyewear
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.div
                  key={order._id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all p-6 relative overflow-hidden"
                >
                  {/* Top Bar of Card */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                        <FaBox />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-base">
                          Order #{order.orderId || order._id?.slice(-8)}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <FaCalendarAlt className="text-[10px]" /> Placed on {formatDate(order.orderDate || order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wider ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status || "Pending"}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowModal(true);
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition"
                      >
                        <FaEye /> View Details
                      </button>
                    </div>
                  </div>

                  {/* Summary & Thumbnails Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Item Thumbnails */}
                    <div className="md:col-span-8 flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                      {order.items?.slice(0, 4).map((item, idx) => {
                        const imgUrl = getValidImageUrl(item);
                        return (
                          <div
                            key={idx}
                            className="relative w-16 h-16 bg-gray-50 rounded-xl border border-gray-200 flex-shrink-0 overflow-hidden p-1 flex items-center justify-center"
                          >
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={item.name || "Product"}
                                className="w-full h-full object-contain p-1 rounded-lg"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = "flex";
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className="w-full h-full flex items-center justify-center text-gray-400"
                              style={{ display: imgUrl ? "none" : "flex" }}
                            >
                              <FaBox className="text-gray-400 text-lg" />
                            </div>
                          </div>
                        );
                      })}
                      {order.items?.length > 4 && (
                        <div className="w-16 h-16 bg-gray-100 rounded-xl border border-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-600">
                          +{order.items.length - 4} more
                        </div>
                      )}
                    </div>

                    {/* Order Total & Info */}
                    <div className="md:col-span-4 flex flex-col md:items-end justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                      <span className="text-xs text-gray-400 font-medium">Total Amount</span>
                      <span className="text-xl font-extrabold text-gray-900 mt-0.5">
                        ₹{order.orderSummary?.total || order.totalAmount || 0}
                      </span>
                      <span className="text-[11px] text-gray-500 mt-1 capitalize">
                        {order.paymentMethod === "cash_on_delivery" ? "Cash on Delivery" : "Online Payment"} • {order.items?.length || 0} items
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {showModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gray-900 text-white p-6 flex items-center justify-between sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    <FaBox className="text-blue-400" /> Order #{selectedOrder.orderId || selectedOrder._id?.slice(-8)}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Placed on {formatDate(selectedOrder.orderDate || selectedOrder.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Status & Estimated Delivery */}
                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-200/80">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Status</span>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold border mt-1 uppercase ${getStatusColor(
                        selectedOrder.status
                      )}`}
                    >
                      {selectedOrder.status || "Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Estimated Delivery</span>
                    <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mt-1">
                      <FaTruck className="text-blue-600" />
                      {formatDate(selectedOrder.estimatedDelivery)}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-3">
                    Purchased Items ({selectedOrder.items?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, idx) => {
                      const imgUrl = getValidImageUrl(item);
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-4 bg-white border border-gray-200/80 rounded-2xl p-3 shadow-xs"
                        >
                          <div className="relative w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 p-1 flex items-center justify-center">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={item.name || "Product"}
                                className="w-full h-full object-contain p-1 rounded-lg"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = "flex";
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className="w-full h-full flex items-center justify-center text-gray-400"
                              style={{ display: imgUrl ? "none" : "flex" }}
                            >
                              <FaBox className="text-gray-400 text-lg" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Qty: <span className="font-bold">{item.quantity}</span>
                              {item.size ? ` • Size: ${item.size}` : ""}
                              {item.color ? ` • Color: ${item.color}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-gray-900 text-sm">
                              ₹{item.price * item.quantity}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Shipping & Payment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shipping Address */}
                  {selectedOrder.shippingAddress && (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
                      <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <FaMapMarkerAlt className="text-red-500" /> Shipping Address
                      </h4>
                      <p className="text-sm font-bold text-gray-900">{selectedOrder.shippingAddress.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {selectedOrder.shippingAddress.addressLine1 || selectedOrder.shippingAddress.address}
                        {selectedOrder.shippingAddress.addressLine2 ? `, ${selectedOrder.shippingAddress.addressLine2}` : ""}
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.zipCode || selectedOrder.shippingAddress.pincode}
                      </p>
                      <p className="text-xs text-gray-600 font-medium mt-1">
                        Phone: {selectedOrder.shippingAddress.phone}
                      </p>
                    </div>
                  )}

                  {/* Payment Details */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <FaCreditCard className="text-indigo-600" /> Payment Info
                    </h4>
                    <p className="text-sm font-bold text-gray-900 capitalize">
                      {selectedOrder.paymentMethod === "cash_on_delivery" ? "Cash on Delivery" : "Online Payment"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Status: <span className="font-semibold text-emerald-600">Verified</span>
                    </p>
                  </div>
                </div>

                {/* Summary Breakdown */}
                {selectedOrder.orderSummary && (
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Subtotal</span>
                      <span>₹{selectedOrder.orderSummary.subtotal || 0}</span>
                    </div>
                    {selectedOrder.orderSummary.couponDiscount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                        <span>Discount ({selectedOrder.orderSummary.couponCode})</span>
                        <span>-₹{selectedOrder.orderSummary.couponDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Tax / GST</span>
                      <span>₹{selectedOrder.orderSummary.tax || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Shipping Fee</span>
                      <span>{selectedOrder.orderSummary.shippingCharge === 0 ? "FREE" : `₹${selectedOrder.orderSummary.shippingCharge}`}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-gray-900 border-t border-gray-200 pt-2">
                      <span>Total Amount</span>
                      <span>₹{selectedOrder.orderSummary.total}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
