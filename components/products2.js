"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const staticFallback = [
  {
    _id: "static-1",
    name: "MIRAR",
    price: 999,
    image: "/products1/trending1.png",
    imageHover: "/products1/trending1-hover.png",
    link: "/eyeglasses",
  },
  {
    _id: "static-2",
    name: "RAY-BAN",
    price: 12999,
    image: "/products1/trending2.png",
    imageHover: "/products1/trending2-hover.png",
    link: "/eyeglasses",
  },
  {
    _id: "static-3",
    name: "TOMMY HILFIGER",
    price: 1899,
    image: "/products1/trending3.png",
    imageHover: "/products1/trending3-hover.png",
    link: "/eyeglasses",
  },
];

export default function Products2() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/products?trendingEyeglasses=true&limit=6`);
        if (!res.ok) throw new Error("Failed to fetch trending eyeglasses");
        const data = await res.json();
        
        if (data.products && data.products.length > 0) {
          const formatted = data.products.map((p) => {
            const primaryImg =
              p.images?.[0]?.url ||
              (typeof p.images?.[0] === "string" ? p.images[0] : "/placeholder.png");
            const secondaryImg =
              p.images?.[1]?.url ||
              (typeof p.images?.[1] === "string" ? p.images[1] : primaryImg);

            const catSlug = (p.category || "eyeglasses").toLowerCase().replace(/\s+/g, "-");
            return {
              _id: p._id,
              name: p.name,
              price: p.price,
              image: primaryImg,
              imageHover: secondaryImg,
              link: `/${catSlug}/${p._id}`,
            };
          });
          setProducts(formatted);
        } else {
          setProducts(staticFallback);
        }
      } catch (err) {
        console.error("Error loading Trending Eyeglasses:", err);
        setProducts(staticFallback);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingProducts();
  }, []);

  return (
    <section className="my-12 px-4 sm:px-6 md:px-12 lg:px-20">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-8 text-center text-gray-900">
        Trending Eyeglasses
      </h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="w-full h-80 sm:h-96 rounded-lg bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => {
            const isHovered = hoveredId === product._id;
            const currentImg = isHovered ? product.imageHover : product.image;

            return (
              <Link key={product._id} href={product.link} className="block">
                <div
                  className="relative w-full h-80 sm:h-96 rounded-lg overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-shadow border border-gray-100 flex flex-col justify-between p-4"
                  onMouseEnter={() => setHoveredId(product._id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="relative w-full h-64 flex items-center justify-center overflow-hidden">
                    <img
                      src={currentImg}
                      alt={product.name}
                      className="object-contain max-h-full max-w-full transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = "/placeholder.png";
                      }}
                    />
                  </div>

                  <div className="bg-white/95 backdrop-blur-sm w-full p-3 text-center border-t border-gray-100 rounded-b-lg">
                    <p className="text-base sm:text-lg font-medium text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                      {product.name}
                    </p>
                    <p className="text-orange-600 font-semibold mt-1 text-sm sm:text-base">
                      ₹{product.price}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Link href="/eyeglasses">
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-md font-semibold transition shadow-md hover:shadow-lg">
            View More
          </button>
        </Link>
      </div>
    </section>
  );
}
