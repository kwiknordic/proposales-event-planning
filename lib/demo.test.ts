// Tests for demo proposal lookup: which proposal UUIDs count as demo proposals.
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDemoProposalIds, isDemoProposal } from "./demo";

const ACCEPTED = "11111111-1111-4111-8111-111111111111";
const PENDING = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isDemoProposal", () => {
  it("is true for both configured demo ids", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_ACCEPTED_UUID", ACCEPTED);
    vi.stubEnv("NEXT_PUBLIC_DEMO_PENDING_UUID", PENDING);
    expect(isDemoProposal(ACCEPTED)).toBe(true);
    expect(isDemoProposal(PENDING)).toBe(true);
  });

  it("is false for an id that is not a demo", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_ACCEPTED_UUID", ACCEPTED);
    vi.stubEnv("NEXT_PUBLIC_DEMO_PENDING_UUID", PENDING);
    expect(isDemoProposal(OTHER)).toBe(false);
  });

  it("is false when no demo is configured, even for an empty uuid", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_ACCEPTED_UUID", "");
    vi.stubEnv("NEXT_PUBLIC_DEMO_PENDING_UUID", "");
    expect(isDemoProposal("")).toBe(false);
    expect(isDemoProposal(ACCEPTED)).toBe(false);
  });
});

describe("getDemoProposalIds", () => {
  it("returns both ids when set", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_ACCEPTED_UUID", ACCEPTED);
    vi.stubEnv("NEXT_PUBLIC_DEMO_PENDING_UUID", PENDING);
    expect(getDemoProposalIds()).toEqual({ accepted: ACCEPTED, pending: PENDING });
  });

  it("treats empty strings as unset", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_ACCEPTED_UUID", "");
    vi.stubEnv("NEXT_PUBLIC_DEMO_PENDING_UUID", PENDING);
    expect(getDemoProposalIds()).toEqual({ accepted: null, pending: PENDING });
  });
});
