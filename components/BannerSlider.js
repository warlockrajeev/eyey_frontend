"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function BannerSlider() {
  const slides = [
    { id: 1, image: "/6.png", link: "/eyeglasses" },
    { id: 2, image: "/ab.png", link: "/sunglasses" },
    { id: 3, image: "/clb.png", link: "/contact-lenses" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative w-full h-[90px] sm:h-[180px] md:h-[240px] lg:h-[280px] overflow-hidden mt-0">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex items-center justify-center ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          <Link href={slide.link} className="relative w-full h-full block cursor-pointer group">
            <Image
              src={slide.image}
              alt={`Slide ${index + 1}`}
              fill
              priority={index === 0}
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-3 sm:bottom-5 left-1/2 transform -translate-x-1/2 flex gap-2 sm:gap-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${
              index === currentIndex ? "bg-white scale-110" : "bg-gray-400 hover:bg-gray-200"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>
    </div>
  );
}
