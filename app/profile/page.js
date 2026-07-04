"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEdit,
  FaSave,
  FaTimes,
  FaShoppingBag,
  FaCalendarAlt,
  FaEye,
  FaBox,
  FaMapMarkerAlt,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "../../config";

export default function ProfilePage() {
  const {
    user,
    updateProfile,
    fetchCurrentUser,
    isLoading: authLoading,
  } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const [activeTab, setActiveTab] = useState("profile");

  // Address states
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: false,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  // Redirect to signin if not logged in (but only after auth loading is complete)
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("❌ Profile page: User not found, redirecting to signin", {
        authLoading,
        user,
      });
      router.push("/signin");
    } else {
      console.log("✅ Profile page: Auth state", { authLoading, user: !!user });
    }
  }, [user, router, authLoading]);

  // Fetch addresses when user is available
  useEffect(() => {
    if (!user?._id || activeTab !== "addresses") return;
    
    const fetchAddresses = async () => {
      setAddressLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/addresses`, {
          method: "GET",
          credentials: "include",
        });
        
        // Handle 404 specifically (API not deployed yet)
        if (response.status === 404) {
          setMessage("Address management is coming soon! Please check back later.");
          setAddresses([]);
          return;
        }
        
        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response");
        }
        
        const data = await response.json();
        if (data.success) {
          setAddresses(data.data || []);
        } else {
          console.error("Failed to fetch addresses:", data.message);
          setMessage(`Failed to fetch addresses: ${data.message}`);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
        if (error.message.includes("404")) {
          setMessage("Address management is coming soon! Please check back later.");
        } else {
          setMessage("Error fetching addresses. Please try again later.");
        }
        setAddresses([]); // Set empty array on error
      } finally {
        setAddressLoading(false);
      }
    };

    fetchAddresses();
  }, [user?._id, activeTab]);

  // Address management functions
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      isDefault: false,
    });
    setShowAddressForm(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      name: address.name || "",
      phone: address.phone || "",
      address: address.address || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      country: address.country || "India",
      isDefault: address.isDefault || false,
    });
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = editingAddress 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/users/addresses/${editingAddress._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/users/addresses`;
      
      const method = editingAddress ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(addressForm),
      });
      
      // Handle 404 specifically (API not deployed yet)
      if (response.status === 404) {
        setMessage("Address management is coming soon! Please check back later.");
        return;
      }
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }
      
      const data = await response.json();
      if (data.success) {
        setMessage(`Address ${editingAddress ? 'updated' : 'added'} successfully!`);
        setShowAddressForm(false);
        setEditingAddress(null);
        
        // Refresh addresses list
        if (activeTab === "addresses") {
          const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/addresses`, {
            method: "GET",
            credentials: "include",
          });
          const refreshData = await refreshResponse.json();
          if (refreshData.success) {
            setAddresses(refreshData.data || []);
          }
        }
      } else {
        setMessage(`Failed to ${editingAddress ? 'update' : 'add'} address: ${data.message}`);
      }
    } catch (error) {
      setMessage(`Error ${editingAddress ? 'updating' : 'adding'} address: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/addresses/${addressId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      const data = await response.json();
      if (data.success) {
        setMessage("Address deleted successfully!");
        setAddresses(addresses.filter(addr => addr._id !== addressId));
      } else {
        setMessage(`Failed to delete address: ${data.message}`);
      }
    } catch (error) {
      setMessage(`Error deleting address: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/addresses/${addressId}/default`, {
        method: "PUT",
        credentials: "include",
      });
      
      const data = await response.json();
      if (data.success) {
        setMessage("Default address updated successfully!");
        setAddresses(addresses.map(addr => ({
          ...addr,
          isDefault: addr._id === addressId
        })));
      } else {
        setMessage(`Failed to set default address: ${data.message}`);
      }
    } catch (error) {
      setMessage(`Error setting default address: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Debug function to test authentication
  const testAuthentication = async () => {
    console.log("🧪 Testing authentication...");
    console.log("🍪 Document cookies:", document.cookie);
    console.log("👤 User from localStorage:", JSON.parse(localStorage.getItem("user") || "null"));
    
    try {
      // Test the /me endpoint first
      const meResponse = await fetch(`${API_ENDPOINTS.USERS_ME}`, {
        method: "GET",
        credentials: "include",
      });
      console.log("📥 /me response status:", meResponse.status);
      const meData = await meResponse.json();
      console.log("📥 /me response data:", meData);

      if (meResponse.ok) {
        console.log("✅ Authentication working for /me endpoint");
        // Now test orders endpoint
        const ordersResponse = await fetch(API_ENDPOINTS.ORDERS_USER, {
          method: "GET",
          credentials: "include",
        });
        console.log("📥 Orders response status:", ordersResponse.status);
        const ordersData = await ordersResponse.json();
        console.log("📥 Orders response data:", ordersData);
      }
    } catch (error) {
      console.error("🚨 Authentication test error:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validation
    if (!formData.name.trim()) {
      setMessage("Name is required");
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setMessage("Email is required");
      setLoading(false);
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setMessage("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
      };

      // Only include password if it's being changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      const result = await updateProfile(
        updateData.name,
        updateData.email,
        updateData.password
      );

      if (result.success) {
        setMessage("Profile updated successfully!");
        setIsEditing(false);
        setFormData({
          ...formData,
          password: "",
          confirmPassword: "",
        });
      } else {
        setMessage(result.message || "Failed to update profile");
      }
    } catch (error) {
      setMessage("An error occurred while updating profile");
    }

    setLoading(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
      });
    }
    setMessage("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // This will trigger redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white shadow-xl rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <FaUser className="text-gray-600 text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">My Account</h1>
                  <p className="text-gray-200">
                    Manage your profile and order history
                  </p>
                </div>
              </div>
              {!isEditing && activeTab === "profile" && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <FaEdit />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="mt-6 flex space-x-4">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === "profile"
                    ? "bg-white text-gray-700"
                    : "bg-transparent text-gray-200 hover:text-white"
                }`}
              >
                <FaUser />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === "addresses"
                    ? "bg-white text-gray-700"
                    : "bg-transparent text-gray-200 hover:text-white"
                }`}
              >
                <FaMapMarkerAlt />
                <span>Addresses</span>
              </button>
              <button
                onClick={() => router.push("/orders")}
                className="bg-transparent text-gray-200 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <FaShoppingBag />
                <span>My Orders</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-6 p-4 rounded-lg ${
                      message.includes("successfully")
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {message}
                  </motion.div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      isEditing
                        ? "border-gray-300 bg-white"
                        : "border-gray-200 bg-gray-50"
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      isEditing
                        ? "border-gray-300 bg-white"
                        : "border-gray-200 bg-gray-50"
                    }`}
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              {/* Password Fields (only shown when editing) */}
              {isEditing && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password (optional)
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter new password (leave blank to keep current)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex space-x-4 pt-6">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <FaSave />
                        <span>Save Changes</span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <FaTimes />
                    <span>Cancel</span>
                  </motion.button>
                </div>
              )}
            </form>

                {/* Account Info */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Account Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Member Since</p>
                      <p className="font-semibold text-gray-800">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Items in Cart</p>
                      <p className="font-semibold text-gray-800">
                        {user.cartData ? Object.keys(user.cartData).length : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">My Addresses</h2>
                  <button
                    onClick={handleAddAddress}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center space-x-2"
                  >
                    <FaPlus />
                    <span>Add Address</span>
                  </button>
                </div>

                {addressLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <FaMapMarkerAlt className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
                    <p className="text-gray-600 mb-6">Add your first address to make checkout easier!</p>
                    <button
                      onClick={handleAddAddress}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-opacity"
                    >
                      Add Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.map((address) => (
                      <motion.div
                        key={address._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white rounded-xl shadow-md p-6 border-2 ${
                          address.isDefault ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <FaMapMarkerAlt className={`text-lg ${address.isDefault ? 'text-indigo-600' : 'text-gray-400'}`} />
                            <h3 className="font-semibold text-gray-900">{address.name}</h3>
                            {address.isDefault && (
                              <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="text-gray-400 hover:text-indigo-600 transition-colors"
                              title="Edit Address"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address._id)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete Address"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-gray-600 mb-4">
                          <p className="font-medium">{address.address}</p>
                          <p>{address.city}, {address.state} {address.pincode}</p>
                          <p>{address.country}</p>
                          <p className="font-medium">Phone: {address.phone}</p>
                        </div>
                        
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(address._id)}
                            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                          >
                            Set as Default
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Address Form Modal */}
        <AnimatePresence>
          {showAddressForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddressForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h2>
                    <button
                      onClick={() => setShowAddressForm(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <form onSubmit={handleSaveAddress} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={addressForm.name}
                          onChange={handleAddressChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={addressForm.phone}
                          onChange={handleAddressChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <textarea
                        name="address"
                        value={addressForm.address}
                        onChange={handleAddressChange}
                        required
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter complete address"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={addressForm.city}
                          onChange={handleAddressChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={addressForm.state}
                          onChange={handleAddressChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter state"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          value={addressForm.pincode}
                          onChange={handleAddressChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter pincode"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country *
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={addressForm.country}
                        onChange={handleAddressChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter country"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isDefault"
                        checked={addressForm.isDefault}
                        onChange={handleAddressChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Set as default address
                      </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                          loading
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90'
                        }`}
                      >
                        {loading ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
