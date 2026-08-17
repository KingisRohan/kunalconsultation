"use client";

// components/RoomsScrollReveal.tsx
//
// Replaces the static Rooms grid with a scroll-driven reveal: a single
// image panel stays pinned (sticky) on desktop while the text list
// scrolls past it, crossfading to whichever room's text is currently
// centered in the viewport. On mobile, sticky-pin doesn't translate
// well to a single narrow column, so each room's image sits inline
// above its own text instead, no pinning, no JS-driven crossfade needed
// there.
//
// This is a presentational component only, it takes the same room data
// the static grid was already using (title, description, optional
// image + imageAlt) and doesn't duplicate or redefine that content.
// Rooms with no photo yet show a calm typographic panel (room name on
// an ink background) instead of a placeholder image or a borrowed
// unrelated photo, so nothing implies a photo exists when it doesn't.
//
// No animation library dependency, IntersectionObserver plus a CSS
// opacity transition, kept deliberately simple and fast.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export type Room = {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
};

export default function RoomsScrollReveal({ rooms }: { rooms: Room[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sectionRefs.current.forEach((el, i) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveIndex(i);
            }
          });
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [rooms.length]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
      {/* Sticky image panel, desktop only */}
      <div className="hidden md:block relative">
        <div className="sticky top-24 h-[70vh] rounded-md overflow-hidden bg-ink">
          {rooms.map((room, i) => (
            <div
              key={room.title}
              aria-hidden={i !== activeIndex}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                i === activeIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              {room.image ? (
                <Image
                  src={room.image}
                  alt={room.imageAlt || room.title}
                  fill
                  className="object-cover"
                  sizes="50vw"
                  priority={i === 0}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-ink">
                  <span className="font-display uppercase text-paper/70 text-2xl tracking-wide text-center px-8">
                    {room.title}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scrolling text list */}
      <div className="flex flex-col gap-24 md:gap-40 py-8">
        {rooms.map((room, i) => (
          <div
            key={room.title}
            ref={(el) => {
              sectionRefs.current[i] = el;
            }}
            className={`transition-opacity duration-500 ${
              i === activeIndex ? "opacity-100" : "opacity-40"
            }`}
          >
            {/* Mobile-only inline image, no pinning, no JS crossfade */}
            {room.image && (
              <div className="md:hidden relative aspect-[4/3] rounded-md overflow-hidden mb-6 bg-ink">
                <Image
                  src={room.image}
                  alt={room.imageAlt || room.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            )}
            <h3 className="font-editorial text-2xl md:text-3xl text-ink mb-3">
              {room.title}
            </h3>
            <p className="font-body text-base md:text-lg text-ink/70 max-w-md">
              {room.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
