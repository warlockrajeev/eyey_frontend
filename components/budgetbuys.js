"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";

export default function BudgetBuys() {
  const slides = [
    { id: 1, image: "/bb1.jpg", link: "/budget-buys" },
    { id: 2, image: "/bb2.jpg", link: "/eyeglasses" },
    { id: 3, image: "/bb3.jpg", link: "/computer-glasses" },
    { id: 4, image: "/bb4.jpg", link: "/sunglasses" },
    { id: 5, image: "/bb5.jpg", link: "/zero-dollar" },
    { id: 6, image: "/bb6.jpg", link: "/kids" },
    { id: 7, image: "/bb7.jpg", link: "/men" },
    { id: 8, image: "/bb8.jpg", link: "/women" },
  ];

  const [current, setCurrent] = useState(0);

  const prevSlide = () => {
    setCurrent((prev) =>
      prev === 0 ? Math.max(0, slides.length - 4) : prev - 1
    );
  };

  const nextSlide = () => {
    setCurrent((prev) =>
      prev >= slides.length - 4 ? 0 : prev + 1
    );
  };

  return (
    <section className="w-full py-6 px-4 md:px-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Link href="/budget-buys" className="group">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors flex items-center gap-2">
            Budget Buys
            <span className="text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
              Explore All
            </span>
          </h2>
        </Link>
        <Link
          href="/budget-buys"
          className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors underline"
        >
          View All →
        </Link>
      </div>

      {/* Slider */}
      <div className="relative w-full overflow-hidden">
        {/* Left Arrow */}
        <button
          onClick={prevSlide}
          className="absolute top-1/2 left-2 z-10 -translate-y-1/2 p-3 bg-gray-200/90 hover:bg-gray-300 rounded-full shadow-md transition-colors"
          aria-label="Previous slide"
        >
          <FaChevronLeft className="text-gray-700 text-lg" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={nextSlide}
          className="absolute top-1/2 right-2 z-10 -translate-y-1/2 p-3 bg-gray-200/90 hover:bg-gray-300 rounded-full shadow-md transition-colors"
          aria-label="Next slide"
        >
          <FaChevronRight className="text-gray-700 text-lg" />
        </button>

        {/* Motion Slider */}
        <motion.div
          className="flex gap-4"
          animate={{ x: `-${current * 25}%` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="min-w-[25%] h-48 md:h-64 relative rounded-xl overflow-hidden shadow-md group cursor-pointer"
            >
              <Link href={slide.link} className="block w-full h-full relative">
                <Image
                  src={slide.image}
                  alt={`Slide ${slide.id}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
              </Link>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
