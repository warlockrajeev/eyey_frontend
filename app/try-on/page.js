"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Camera, Video, VideoOff, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../components/Toast";
import { API_BASE_URL } from "../../config";

export default function TryOnPage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [frameColor, setFrameColor] = useState("#1a1a1a"); // Default color

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);
  const loadedImageRef = useRef(null);
  const loadedImageUrlRef = useRef("");

  const { addToCart } = useCart();
  const { user } = useAuth();

  // Load MediaPipe scripts sequentially
  useEffect(() => {
    let active = true;
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        // Prevent duplicate script loading
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initScripts = async () => {
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");
        if (active) {
          setScriptsLoaded(true);
          console.log("MediaPipe scripts loaded successfully.");
        }
      } catch (err) {
        console.error("Failed to load VTO scripts:", err);
      }
    };

    initScripts();
    return () => {
      active = false;
      stopCamera();
    };
  }, []);

  // Fetch catalog products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch(`${API_BASE_URL}/api/products`);
        if (res.ok) {
          const data = await res.json();
          // Filter to items that represent glasses
          const glassesOnly = (data.products || []).filter((p) => {
            const cat = p.category?.toLowerCase() || "";
            return cat.includes("glass") || cat.includes("lens") || cat.includes("sunglass");
          });
          setProducts(glassesOnly);
          if (glassesOnly.length > 0) {
            setSelectedProduct(glassesOnly[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching try-on products:", err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Pre-load current product's custom try-on PNG frame image
  useEffect(() => {
    const url = selectedProduct?.tryOnImage?.url;
    if (url) {
      if (loadedImageUrlRef.current !== url) {
        const img = new window.Image();
        img.src = url;
        img.crossOrigin = "anonymous";
        img.onload = () => {
          loadedImageRef.current = img;
          loadedImageUrlRef.current = url;
        };
        img.onerror = () => {
          console.error("Failed to load custom try-on frame:", url);
          loadedImageRef.current = null;
          loadedImageUrlRef.current = "";
        };
      }
    } else {
      loadedImageRef.current = null;
      loadedImageUrlRef.current = "";
    }
  }, [selectedProduct]);

  // Dynamic vector drawing frame style functions
  const drawRoundFrame = (ctx, w, h, color) => {
    ctx.lineWidth = w * 0.08;
    ctx.strokeStyle = color;
    ctx.fillStyle = "rgba(135, 206, 250, 0.2)"; // Ice blue glare

    const eyeRad = w * 0.22;
    const eyeDist = w * 0.25;

    // Left Frame & Lens
    ctx.beginPath();
    ctx.arc(-eyeDist, 0, eyeRad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    // Right Frame & Lens
    ctx.beginPath();
    ctx.arc(eyeDist, 0, eyeRad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    // Lens glare reflection lines
    ctx.lineWidth = w * 0.02;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(-eyeDist, 0, eyeRad * 0.8, -Math.PI * 0.4, -Math.PI * 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(eyeDist, 0, eyeRad * 0.8, -Math.PI * 0.4, -Math.PI * 0.15);
    ctx.stroke();

    // Restoring frame thickness for bridge
    ctx.lineWidth = w * 0.08;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(0, -eyeRad * 0.1, eyeDist - eyeRad + 2, Math.PI, 0, true);
    ctx.stroke();

    // Temples (Sides)
    ctx.beginPath();
    ctx.moveTo(-eyeDist - eyeRad, 0);
    ctx.quadraticCurveTo(-eyeDist - eyeRad - w * 0.1, -h * 0.1, -eyeDist - eyeRad - w * 0.25, -h * 0.15);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(eyeDist + eyeRad, 0);
    ctx.quadraticCurveTo(eyeDist + eyeRad + w * 0.1, -h * 0.1, eyeDist + eyeRad + w * 0.25, -h * 0.15);
    ctx.stroke();
  };

  const drawRectangleFrame = (ctx, w, h, color) => {
    ctx.lineWidth = w * 0.09;
    ctx.strokeStyle = color;
    ctx.fillStyle = "rgba(135, 206, 250, 0.15)";

    const rw = w * 0.38;
    const rh = h * 0.55;
    const gap = w * 0.12;
    const r = 8; // Border radius

    const roundedRect = (x, y, width, height, rad) => {
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + width - rad, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + rad);
      ctx.lineTo(x + width, y + height - rad);
      ctx.quadraticCurveTo(x + width, y + height, x + width - rad, y + height);
      ctx.lineTo(x + rad, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - rad);
      ctx.lineTo(x, y + rad);
      ctx.quadraticCurveTo(x, y, x + rad, y);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    };

    // Left Lens
    roundedRect(-rw - gap / 2, -rh / 2, rw, rh, r);
    // Right Lens
    roundedRect(gap / 2, -rh / 2, rw, rh, r);

    // Lens glare lines
    ctx.lineWidth = w * 0.02;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.moveTo(-rw - gap / 2 + 10, -rh / 2 + 10);
    ctx.lineTo(-rw - gap / 2 + rw - 10, -rh / 2 + rh - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gap / 2 + 10, -rh / 2 + 10);
    ctx.lineTo(gap / 2 + rw - 10, -rh / 2 + rh - 10);
    ctx.stroke();

    // Bridge
    ctx.lineWidth = w * 0.09;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(-gap / 2, -rh * 0.15);
    ctx.quadraticCurveTo(0, -rh * 0.22, gap / 2, -rh * 0.15);
    ctx.stroke();

    // Sides
    ctx.beginPath();
    ctx.moveTo(-rw - gap / 2, -rh * 0.05);
    ctx.quadraticCurveTo(-rw - gap / 2 - w * 0.1, -rh * 0.15, -rw - gap / 2 - w * 0.25, -rh * 0.2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rw + gap / 2, -rh * 0.05);
    ctx.quadraticCurveTo(rw + gap / 2 + w * 0.1, -rh * 0.15, rw + gap / 2 + w * 0.25, -rh * 0.2);
    ctx.stroke();
  };

  const drawAviatorFrame = (ctx, w, h, color) => {
    ctx.lineWidth = w * 0.045;
    ctx.strokeStyle = color; // Gold or Gunmetal
    ctx.fillStyle = "rgba(135, 206, 250, 0.2)";

    const rw = w * 0.39;
    const rh = h * 0.65;
    const gap = w * 0.09;

    const teardrop = (isLeft) => {
      const cx = isLeft ? -rw / 2 - gap / 2 : rw / 2 + gap / 2;
      const cy = 0;

      ctx.beginPath();
      ctx.moveTo(cx + (isLeft ? rw / 2 : -rw / 2), cy - rh / 2);
      ctx.quadraticCurveTo(cx, cy - rh / 2, cx + (isLeft ? -rw / 2 : rw / 2), cy - rh / 4);
      ctx.quadraticCurveTo(cx + (isLeft ? -rw / 2 : rw / 2), cy + rh / 4, cx + (isLeft ? -rw / 3 : rw / 3), cy + rh / 2);
      ctx.quadraticCurveTo(cx, cy + rh * 0.6, cx + (isLeft ? rw / 2 : -rw / 2), cy + rh / 4);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    };

    teardrop(true);
    teardrop(false);

    // Top double bar bridge
    ctx.beginPath();
    ctx.moveTo(-gap, -rh * 0.45);
    ctx.lineTo(gap, -rh * 0.45);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-gap * 0.8, -rh * 0.1);
    ctx.quadraticCurveTo(0, -rh * 0.18, gap * 0.8, -rh * 0.1);
    ctx.stroke();

    // Sides
    ctx.beginPath();
    ctx.moveTo(-rw - gap / 2, -rh * 0.2);
    ctx.lineTo(-rw - gap / 2 - w * 0.25, -rh * 0.25);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rw + gap / 2, -rh * 0.2);
    ctx.lineTo(rw + gap / 2 + w * 0.25, -rh * 0.25);
    ctx.stroke();
  };

  const drawCatEyeFrame = (ctx, w, h, color) => {
    ctx.lineWidth = w * 0.085;
    ctx.strokeStyle = color;
    ctx.fillStyle = "rgba(135, 206, 250, 0.18)";

    const rw = w * 0.38;
    const rh = h * 0.58;
    const gap = w * 0.12;

    const slantEye = (isLeft) => {
      const cx = isLeft ? -rw / 2 - gap / 2 : rw / 2 + gap / 2;
      const cy = 0;

      ctx.beginPath();
      ctx.moveTo(cx + (isLeft ? rw / 2 : -rw / 2), cy + rh / 4);
      ctx.quadraticCurveTo(cx, cy - rh / 2, cx + (isLeft ? -rw / 2 : rw / 2) - (isLeft ? rw * 0.12 : -rw * 0.12), cy - rh * 0.58);
      ctx.quadraticCurveTo(cx + (isLeft ? -rw / 2 : rw / 2), cy + rh / 4, cx + (isLeft ? -rw / 4 : rw / 4), cy + rh / 2);
      ctx.quadraticCurveTo(cx + (isLeft ? rw / 4 : -rw / 4), cy + rh / 2, cx + (isLeft ? rw / 2 : -rw / 2), cy + rh / 4);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    };

    slantEye(true);
    slantEye(false);

    // Bridge
    ctx.beginPath();
    ctx.moveTo(-gap / 2, -rh * 0.1);
    ctx.quadraticCurveTo(0, -rh * 0.2, gap / 2, -rh * 0.1);
    ctx.stroke();

    // Wing Sides
    ctx.beginPath();
    ctx.moveTo(-rw - gap / 2 - rw * 0.12, -rh * 0.58);
    ctx.lineTo(-rw - gap / 2 - w * 0.3, -h * 0.2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rw + gap / 2 + rw * 0.12, -rh * 0.58);
    ctx.lineTo(rw + gap / 2 + w * 0.3, -h * 0.2);
    ctx.stroke();
  };

  // Main logic handler to calculate transformations and draw VTO glasses
  const onResults = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame mirrored
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      setFaceDetected(true);
      const landmarks = results.multiFaceLandmarks[0];

      // Grab eye corners and nose bridge landmarks
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const nose = landmarks[168];

      // Convert coordinates
      const leftX = leftEye.x * canvas.width;
      const leftY = leftEye.y * canvas.height;
      const rightX = rightEye.x * canvas.width;
      const rightY = rightEye.y * canvas.height;
      const noseX = nose.x * canvas.width;
      const noseY = nose.y * canvas.height;

      // Distance and angles
      const dx = rightX - leftX;
      const dy = rightY - leftY;
      const eyeDistance = Math.sqrt(dx * dx + dy * dy);

      // Glasses size scaling mapping
      const glassesWidth = eyeDistance * 2.22;
      const glassesHeight = glassesWidth * 0.45;
      const rollAngle = Math.atan2(dy, dx);

      // Transform context to place glasses
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1); // mirror coordinates matching the flipped video
      
      ctx.translate(noseX, noseY);
      ctx.rotate(rollAngle);

      // Draw active frame style (prefer custom transparent PNG, fallback to vector frames)
      if (loadedImageRef.current) {
        const yOffset = glassesHeight * 0.05;
        ctx.drawImage(loadedImageRef.current, -glassesWidth / 2, -glassesHeight / 2 + yOffset, glassesWidth, glassesHeight);
      } else {
        const shape = selectedProduct?.shape?.toLowerCase() || "rectangle";
        const frameColorHex = frameColor;

        if (shape.includes("aviator") || selectedProduct?.name?.toLowerCase().includes("aviator")) {
          drawAviatorFrame(ctx, glassesWidth, glassesHeight, frameColorHex);
        } else if (shape.includes("round") || shape.includes("circle") || selectedProduct?.name?.toLowerCase().includes("round")) {
          drawRoundFrame(ctx, glassesWidth, glassesHeight, frameColorHex);
        } else if (shape.includes("cat") || selectedProduct?.name?.toLowerCase().includes("cat")) {
          drawCatEyeFrame(ctx, glassesWidth, glassesHeight, frameColorHex);
        } else {
          // Default to rectangle style
          drawRectangleFrame(ctx, glassesWidth, glassesHeight, frameColorHex);
        }
      }

      ctx.restore();
    } else {
      setFaceDetected(false);
    }
  };

  // Start webcam feed and load FaceMesh AI models
  const startCamera = async () => {
    if (!scriptsLoaded || cameraActive) return;

    try {
      setModelLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Initialize FaceMesh model if not already initialized
      if (!faceMeshRef.current && window.FaceMesh) {
        const faceMesh = new window.FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults(onResults);
        faceMeshRef.current = faceMesh;
      }

      // Initialize Camera utility if not already initialized
      if (videoRef.current && faceMeshRef.current && window.Camera) {
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (faceMeshRef.current && videoRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });

        cameraRef.current = camera;
        await camera.start();
        setCameraActive(true);
      }
    } catch (err) {
      console.error("VTO Camera error:", err);
      toast.error("Failed to access camera. Please check permissions.");
    } finally {
      setModelLoading(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch (e) {
        console.warn("Error stopping camera utility:", e);
      }
      cameraRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setFaceDetected(false);

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas || !cameraActive) return;

    // Download the canvas content as image
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `eyey-optics-tryon-${selectedProduct?.name?.replace(/\s+/g, "-") || "glasses"}.png`;
    link.click();
    toast.success("Snapshot downloaded successfully!");
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }

    const success = await addToCart(product._id, 1);
    if (success) {
      toast.success(`${product.name} added to cart!`);
    } else {
      toast.error("Failed to add to cart");
    }
  };

  // Clean-up VTO on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white font-nunito flex flex-col">
      {/* Top Banner and Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-bold text-sm">Back to Store</span>
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
          VIRTUAL 3D TRY-ON MIRROR
        </h1>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Real-time VTO</span>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Try On Camera Screen */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center justify-center group">
            {/* Mirror Canvas and Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover hidden"
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className={`w-full h-full object-cover rounded-2xl scale-x-[-1] transition-opacity duration-300 ${
                cameraActive ? "opacity-100" : "opacity-0 absolute pointer-events-none"
              }`}
            />

            {/* Offline/Placeholder overlay screen */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-md">
                  <Camera className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Start Your Virtual Camera</h3>
                  <p className="text-slate-500 text-sm max-w-md mt-1">
                    Allow webcam access to virtually try on our premium eyeglasses frames right in your browser.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  disabled={!scriptsLoaded || modelLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {modelLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Configuring camera...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      <span>Start Virtual Mirror</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Live Model HUD Stats */}
            {cameraActive && (
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                <span className="bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-slate-800">
                  {faceDetected ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-green-400">FACE DETECTED</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                      <span className="text-yellow-400">DETECTING FACE...</span>
                    </>
                  )}
                </span>

                <span className="bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-slate-300 border border-slate-800">
                  {selectedProduct?.name}
                </span>
              </div>
            )}
          </div>

          {/* VTO Screen Control Panel */}
          {cameraActive && (
            <div className="flex flex-wrap items-center justify-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl max-w-2xl mx-auto w-full">
              <button
                onClick={stopCamera}
                className="bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800/60 font-bold py-2 px-4 rounded-md transition text-sm flex items-center gap-2"
              >
                <VideoOff className="w-4 h-4" />
                Stop Mirror
              </button>

              <button
                onClick={capturePhoto}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-md shadow-md transition text-sm flex items-center gap-2 active:scale-95"
              >
                <Camera className="w-4 h-4" />
                Snapshot Photo
              </button>

              {/* Color Changer Picker */}
              <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Frame Color:</span>
                <div className="flex items-center gap-1.5">
                  {["#1a1a1a", "#d4af37", "#991b1b", "#1e3a8a", "#047857"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setFrameColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-5 h-5 rounded-full border transition ${
                        frameColor === color ? "border-white scale-125" : "border-slate-800 hover:scale-110"
                      }`}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Glassmorphic Try On Product Selector */}
        <div className="lg:col-span-4 flex flex-col bg-slate-900/40 border border-slate-800 p-5 rounded-2xl h-[calc(100vh-120px)] overflow-y-auto max-h-[600px] lg:max-h-none">
          <h2 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-800 pb-2">
            Try On Frames Catalog
          </h2>

          {loadingProducts ? (
            <div className="flex flex-col items-center justify-center flex-1 py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-400"></div>
              <p className="text-slate-500 text-sm mt-3">Loading frames list...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No eyeglasses frames found.
            </div>
          ) : (
            <div className="flex flex-col gap-4 flex-1">
              {products.map((product) => {
                const isSelected = selectedProduct?._id === product._id;
                return (
                  <div
                    key={product._id}
                    onClick={() => setSelectedProduct(product)}
                    className={`p-3 rounded-xl border transition duration-200 cursor-pointer flex gap-3 items-center ${
                      isSelected
                        ? "bg-slate-800/80 border-blue-500/60 shadow-lg shadow-blue-500/5 text-white"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300"
                    }`}
                  >
                    <div className="relative w-16 h-12 bg-slate-950 rounded-lg p-1.5 overflow-hidden flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-600">
                          N/A
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-400 font-bold uppercase tracking-wider leading-none">
                        {product.brand || product.category}
                      </p>
                      <h4 className="text-sm font-bold truncate mt-1 leading-snug">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-extrabold text-slate-100">₹{product.price}</span>
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-medium text-slate-400 uppercase tracking-widest">
                          {product.shape || "Classic"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-sm active:scale-95 transition-transform flex items-center justify-center flex-shrink-0"
                      title="Add to Cart"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
