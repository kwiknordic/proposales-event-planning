// Landing page (/): why I built this, what it does, what I would add, and the way to the demo.
// The copy lives in the section components in components/landing/.
import { AiUse } from "@/components/landing/AiUse";
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
      <AiUse />
      <Wishlist />
      <CallToAction />
    </main>
  );
}
