// Landing page (/): why we built this, what it does, what we would add, and the way to the demo.
// Copy lives in the section components; see docs/LANDING.md.
import { CallToAction } from "@/components/landing/CallToAction";
import { Hero } from "@/components/landing/Hero";
import { Lessons } from "@/components/landing/Lessons";
import { Problem } from "@/components/landing/Problem";
import { WhatWeBuilt } from "@/components/landing/WhatWeBuilt";
import { Wishlist } from "@/components/landing/Wishlist";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <Problem />
      <WhatWeBuilt />
      <Wishlist />
      <Lessons />
      <CallToAction />
    </main>
  );
}
