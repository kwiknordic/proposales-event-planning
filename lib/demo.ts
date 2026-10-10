// Demo proposal ids from public env vars. Used by app/demo/page.tsx and the planning page demo banner.
// Read via literal process.env.NEXT_PUBLIC_* access so Next inlines them into the client bundle.
export function getDemoProposalIds(): { accepted: string | null; pending: string | null } {
  return {
    accepted: process.env.NEXT_PUBLIC_DEMO_ACCEPTED_UUID || null,
    pending: process.env.NEXT_PUBLIC_DEMO_PENDING_UUID || null,
  };
}

// Empty strings are filtered out so an unset demo can never match an empty uuid.
export function isDemoProposal(uuid: string): boolean {
  const { accepted, pending } = getDemoProposalIds();
  return [accepted, pending].some((id) => id !== null && id === uuid);
}
