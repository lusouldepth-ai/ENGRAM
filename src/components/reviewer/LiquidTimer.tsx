"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

export function LiquidTimer({ duration = 60 }: { duration?: number }) {
  // Total duration in seconds. 
  // The droplet will separate and drop over this period or cycle.
  
  return (
    <div className="relative w-24 h-40">
      {/* 
        SVG Filter for the Gooey Effect 
        Defined with absolute positioning and pointer-events-none to not interfere with layout
      */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="goo">
            {/* Blur the input image */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            {/* Increase contrast of alpha channel to sharpen edges */}
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            {/* Draw original image over goo (optional, but usually just the goo result is used for the liquid look) */}
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Container with the filter applied */}
      <div 
        className="w-full h-full relative flex justify-center filter-[url(#goo)]"
        style={{ filter: "url(#goo)" }}
      >
        {/* Source Blob (Attached to top) */}
        <div className="absolute top-0 w-16 h-12 bg-black rounded-b-[50%] z-10" />

        {/* Droplet Blob (Animating down) */}
        <motion.div
          className="absolute top-4 w-8 h-8 bg-black rounded-full z-0"
          animate={{
            y: [0, 120], // Drop distance
            scale: [1, 0.8, 1.1, 0.9], // Organic shape change
            opacity: [1, 1, 0] // Fade out at the bottom
          }}
          transition={{
            duration: 10, // Slow drip
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1
          }}
        />
      </div>
    </div>
  );
}

