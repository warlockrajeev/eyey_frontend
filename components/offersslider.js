// offersslider.js
"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function OffersSlider() {
  const offers = [
    { text: "🎉 Flat 50% Off on Eyeglasses + Extra 10% with Code: EYE10", link: "/eyeglasses" },
    { text: "🕶️ Buy 1 Get 1 Free on Sunglasses!", link: "/sunglasses" },
    { text: "🚚 Free Shipping on Orders Above ₹999", link: "/hot-sellers" },
    { text: "💎 Premium Frames at Affordable Prices!", link: "/power-glasses" },
    { text: "🕶️ Limited Time Offer: 20% Off on New Arrivals", link: "/new-arrivals" },
  ];

  return (
    <div
      className="overflow-hidden py-2 md:py-3 relative"
      style={{ background: "linear-gradient(90deg, #a1c4fd 0%, #c2e9fb 100%)" }}
    >
      <motion.div
        className="flex whitespace-nowrap gap-4 md:gap-8"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
      >
        {offers.concat(offers).map((offer, index) => (
          <Link key={index} href={offer.link}>
            <motion.span
              className="px-3 md:px-6 py-1 md:py-2 bg-white/80 hover:bg-white backdrop-blur-md rounded-full shadow-md text-blue-900 font-medium text-xs sm:text-sm md:text-base cursor-pointer hover:scale-105 transition-transform inline-block"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (index % offers.length) * 0.2, duration: 0.4 }}
            >
              {offer.text}
            </motion.span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
