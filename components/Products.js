"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const products = [
  {
    id: 1,
    name: "Round",
    title: "Round Frame",
    detail: "Classic round eyeglasses for a retro look",
    image: "/products/shape1.png",
  },
  {
    id: 2,
    name: "Square",
    title: "Square Frame",
    detail: "Bold square frames for confident style",
    image: "/products/shape2.png",
  },
  {
    id: 3,
    name: "Cat Eye",
    title: "Cat Eye",
    detail: "Feminine cat eye shape for vintage vibes",
    image: "/products/shape3.png",
  },
  {
    id: 4,
    name: "Aviator",
    title: "Aviator",
    detail: "Timeless aviator style with sleek metal",
    image: "/products/shape4.png",
  },
  {
    id: 5,
    name: "Rectangle",
    title: "Rectangle",
    detail: "Sleek rectangular frames for sharp looks",
    image: "/products/shape5.png",
  },
  {
    id: 6,
    name: "Oval",
    title: "Oval",
    detail: "Soft oval frames for everyday elegance",
    image: "/products/shape6.png",
  },
];

export default function Products() {
  return (
    <section className="my-12 px-6 md:px-20">
      {/* Heading */}
      <h1 className="text-4xl font-bold mb-4 text-center text-black">
        Bestselling Eyeglasses Shapes
      </h1>

      {/* Paragraph */}
      <p className="text-center text-lg max-w-xl mx-auto mb-12 text-black font-bold">
        Set new trends around with these eyemazing Eyeglasses Shapes!
      </p>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {products.map((product, index) => (
          <Link
            key={product.id}
            href={`/eyeglasses?shape=${encodeURIComponent(product.name)}`}
            className="block cursor-pointer group"
          >
            <motion.div
              className="bg-white rounded-lg shadow-md hover:shadow-xl p-6 flex flex-col items-center border border-gray-100 transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="relative w-70 h-40 mb-4 transition-transform duration-300 group-hover:scale-110">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h2 className="text-xl font-semibold mb-1 text-gray-900 group-hover:text-orange-600 transition-colors">
                {product.title}
              </h2>
              <p className="text-orange-600 text-center font-medium text-sm">
                {product.detail}
              </p>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}
