"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Footer() {
  const footerSections = [
    {
      title: "LET'S GET SOCIAL",
      links: [
        { name: "Facebook", url: "https://www.facebook.com/eyeyoptics" },
        { name: "Instagram", url: "https://www.instagram.com/eyeyoptics" },
        { name: "Twitter", url: "https://twitter.com" },
        { name: "LinkedIn", url: "https://linkedin.com" },
      ],
    },
    {
      title: "EXPLORE",
      links: [
        { name: "Home", url: "/" },
        { name: "EyeGlasses", url: "/eyeglasses" },
        { name: "About Us", url: "/about" },
        { name: "Contact", url: "/contact" },
      ],
    },
    {
      title: "INFORMATION",
      links: [
        { name: "Delivery & Shipping Terms", url: "/delivery-page" },
        { name: "Refund Policy", url: "/refund-policy" },
        { name: "Privacy Policy", url: "/privacy-policy" },
        { name: "Terms And Conditions", url: "/terms-conditions" },
      ],
    },
    {
      title: "EXPLORE",
      links: [{ name: "FAQ", url: "/faq" }],
    },
    {
      title: "EYEY",
      content: (
        <p className="text-[13px] text-gray-500 leading-relaxed max-w-xs">
          Your one-stop destination for stylish, affordable eyewear. Quality you can trust, style you'll love.
        </p>
      ),
    },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="bg-[#222222] text-gray-300 py-12 px-6 md:px-10"
    >
      <div className="max-w-[95%] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
        {footerSections.map((section, index) => (
          <div key={index}>
            <h3 className="text-white font-bold text-[14px] mb-6 tracking-wider uppercase">
              {section.title}
            </h3>

            {section.links ? (
              <ul className="space-y-3">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.url}
                      className="text-[13px] hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              section.content
            )}
          </div>
        ))}
      </div>

      {/* Copyright */}
      <div className="max-w-[95%] mx-auto mt-12 pt-8 border-t border-gray-800 text-center">
        <p className="text-[12px] text-gray-400">
          © 2026 Eyey Optics. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
}
