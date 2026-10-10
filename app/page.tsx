// Landing page (/): why I built this, what it does, what I would add, and the way to the demo.
// Copy lives in the section components; see docs/LANDING.md.
import { CallToAction } from "@/components/landing/CallToAction";
import { EmailPreview } from "@/components/landing/EmailPreview";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { WhatIBuilt } from "@/components/landing/WhatIBuilt";
import { Wishlist } from "@/components/landing/Wishlist";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <Problem />
      <WhatIBuilt />
      <EmailPreview />
      <Wishlist />
      <CallToAction />
    </main>
  );
}
