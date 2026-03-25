import type { ReactNode } from "react";

/**
 * SVG Icons for learning domains
 * Shared across DeepWork and Domain pages
 */
export const DomainIcons: Record<string, ReactNode> = {
  math: (
    <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.745 3A23.933 23.933 0 003 12c0 3.183.62 6.22 1.745 9M19.5 3c.967 2.78 1.5 5.817 1.5 9s-.533 6.22-1.5 9M8.25 8.885l1.444-.89a.75.75 0 011.105.402l2.402 7.206a.75.75 0 001.104.401l1.445-.889m-8.25.75l.213.09a1.687 1.687 0 002.062-.617l4.45-6.676a1.688 1.688 0 012.062-.618l.213.09" />
    </svg>
  ),
  reading: (
    <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  writing: (
    <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  ),
  coding: (
    <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  ),
};

/**
 * Domain color class mapping
 */
export const domainColors: Record<string, string> = {
  math: "pastel-purple",
  mathematics: "pastel-purple",
  reading: "pastel-green",
  literature: "pastel-green",
  writing: "pastel-orange",
  expression: "pastel-orange",
  coding: "pastel-pink",
  engineering: "pastel-pink",
};

/**
 * Domain descriptions
 */
export const domainDescriptions: Record<string, string> = {
  math: "The language of the universe.",
  mathematics: "The language of the universe.",
  reading: "Exploring human thought.",
  literature: "Exploring human thought.",
  writing: "Crafting your voice.",
  expression: "Crafting your voice.",
  coding: "Building the future.",
  engineering: "Building the future.",
};

/**
 * Get the icon for a domain based on its name
 */
export function getDomainIcon(name: string): ReactNode {
  const key = name.toLowerCase();
  if (key.includes("math")) return DomainIcons.math;
  if (key.includes("read") || key.includes("liter")) return DomainIcons.reading;
  if (key.includes("writ") || key.includes("express")) return DomainIcons.writing;
  if (key.includes("cod") || key.includes("engineer")) return DomainIcons.coding;
  return DomainIcons.math;
}

/**
 * Get the color class for a domain based on its name
 */
export function getDomainColorClass(name: string): string {
  const key = name.toLowerCase();
  for (const [domainKey, colorClass] of Object.entries(domainColors)) {
    if (key.includes(domainKey)) return colorClass;
  }
  return "pastel-blue";
}

/**
 * Get the description for a domain based on its name
 */
export function getDomainDescription(name: string): string {
  const key = name.toLowerCase();
  for (const [domainKey, desc] of Object.entries(domainDescriptions)) {
    if (key.includes(domainKey)) return desc;
  }
  return "Expand your knowledge.";
}
