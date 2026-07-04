"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Banner() {
  return (
    <section className="my-12 px-0">
      <Link href="/new-arrivals" className="block cursor-pointer group">
        <motion.div
          className="relative w-full h-40 md:h-60 rounded-md overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          whileHover={{ scale: 1.01 }}
        >
          <Image
            src="/ban.svg"
            alt="Promotional Banner"
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-105"
            priority
          />
        </motion.div>
      </Link>
    </section>
  );
}
