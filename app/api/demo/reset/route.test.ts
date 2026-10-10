// Tests for POST /api/demo/reset: only demo proposals can be reset. Client and demo ids are mocked.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/proposales/client", () => ({ getProposal: vi.fn(), resetPlanningData: vi.fn() }));
vi.mock("@/lib/demo", () => ({ isDemoProposal: (uuid: string) => uuid === DEMO_UUID }));

import { getProposal, resetPlanningData } from "@/lib/proposales/client";
import { POST } from "./route";

const DEMO_UUID = "67c008dd-7ee6-4687-bc60-1647fdf46a9a";
const OTHER_UUID = "11111111-2222-4333-8444-555555555555";

function postReset(body: unknown) {
  return POST(new Request("http://localhost/api/demo/reset", { method: "POST", body: JSON.stringify(body) }));
}

beforeEach(() => {
  vi.mocked(getProposal).mockReset();
  vi.mocked(resetPlanningData).mockReset();
});

describe("POST /api/demo/reset", () => {
  it("400 without a uuid", async () => {
    expect((await postReset({})).status).toBe(400);
  });

  it("403 for a proposal that is not a demo proposal, without touching it", async () => {
    const response = await postReset({ uuid: OTHER_UUID });
    expect(response.status).toBe(403);
    expect(getProposal).not.toHaveBeenCalled();
    expect(resetPlanningData).not.toHaveBeenCalled();
  });

  it("404 when the demo proposal is missing", async () => {
    vi.mocked(getProposal).mockResolvedValue(null);
    expect((await postReset({ uuid: DEMO_UUID })).status).toBe(404);
  });

  it("200 resets the demo proposal and returns the empty plan", async () => {
    vi.mocked(getProposal).mockResolvedValue({ uuid: DEMO_UUID, title: "Demo", status: "accepted", data: {} });
    const response = await postReset({ uuid: DEMO_UUID });
    expect(response.status).toBe(200);
    expect(resetPlanningData).toHaveBeenCalledWith(DEMO_UUID);
    expect((await response.json()).plan.attendees).toEqual([]);
  });

  it("502 when Proposales refuses the write", async () => {
    vi.mocked(getProposal).mockResolvedValue({ uuid: DEMO_UUID, title: "Demo", status: "accepted", data: {} });
    vi.mocked(resetPlanningData).mockRejectedValue(new Error("status 500"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await postReset({ uuid: DEMO_UUID })).status).toBe(502);
  });
});
