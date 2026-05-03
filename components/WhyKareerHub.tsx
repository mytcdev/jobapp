"use client";

import { useState, useEffect } from "react";

const slides = [
  { src: "/lifestyle-team-cheering.jpg", alt: "Team celebrating success" },
  { src: "/lifestyle-team-meeting.jpg", alt: "Team collaborating" },
];

export default function WhyKareerHub() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-10">
      {/* Carousel */}
      <div
        className="order-2 lg:order-1 relative rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.13)]"
        style={{ aspectRatio: "4/5" }}
      >
        {slides.map((slide, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: i === current ? 1 : 0,
              transform: i === current ? "scale(1)" : "scale(1.08)",
              transition: "opacity 1s ease, transform 5s ease",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="order-1 lg:order-2 flex flex-col gap-5">
        <span className="self-start text-xs font-bold uppercase tracking-wider text-emerald-700">
          Why KareerHub
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0F4A2E] leading-tight">
          Built around{" "}
          <span style={{ color: "#E53935" }}>your skills,</span> not your keywords.
        </h2>
        <p className="text-gray-500 leading-relaxed">
          We connect talent with opportunities and empower you to build a better future.
          Every job you see comes with a transparent match score, so you know where you
          fit before you apply.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-[0_4px_20px_rgba(15,74,46,0.04)]">
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center mb-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-emerald-900 mb-1">Find Opportunities</h3>
            <p className="text-sm text-gray-500">Discover jobs that match your skills and ambitions.</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-[0_4px_20px_rgba(15,74,46,0.04)]">
            <div className="w-10 h-10 rounded-full text-white flex items-center justify-center mb-3" style={{ background: "#E53935" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-bold text-emerald-900 mb-1">Grow Your Career</h3>
            <p className="text-sm text-gray-500">Get expert guidance and resources to level up.</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-[0_4px_20px_rgba(15,74,46,0.04)]">
            <div className="w-10 h-10 rounded-full text-white flex items-center justify-center mb-3" style={{ background: "#F57C00" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-emerald-900 mb-1">Build Connections</h3>
            <p className="text-sm text-gray-500">Connect with professionals and expand your network.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
