// Tests getProposal with fetch mocked: no real network calls, no real API key needed.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fixture from "../../fixtures/proposal-response.json";
import { getProposal, savePlanningData } from "./client";

const UUID = "67c008dd-7ee6-4687-bc60-1647fdf46a9a";

function mockFetchResponse(status: number, body: unknown = {}) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("PROPOSALES_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getProposal", () => {
  it("returns the parsed proposal and sends the Bearer header to the right URL", async () => {
    const fetchMock = mockFetchResponse(200, fixture);

    const proposal = await getProposal(UUID);

    expect(proposal?.uuid).toBe(UUID);
    expect(proposal?.data.planning_status).toBe("submitted");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://api.proposales.com/v3/proposals/${UUID}`);
    expect(init.cache).toBe("no-store");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
  });

  it("returns null on 404", async () => {
    mockFetchResponse(404, { error: "not found" });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await getProposal(UUID)).toBeNull();
  });

  it("returns null on 500 (the API also uses 500 for unknown ids)", async () => {
    mockFetchResponse(500, {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await getProposal(UUID)).toBeNull();
  });

  it("returns null for a malformed uuid without calling fetch", async () => {
    const fetchMock = mockFetchResponse(200, fixture);
    expect(await getProposal("not-a-uuid")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when fetch itself fails (network error)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("fetch failed");
    }));
    await expect(getProposal(UUID)).rejects.toThrow("fetch failed");
  });
});

describe("savePlanningData", () => {
  const planningData = {
    planning: { agenda: [], seating: { layout: "", notes: "" }, extras: [], requests: [], attendees: [] },
    planning_summary: "",
  };

  it("clears planning, then PATCHes the planning keys to the custom data endpoint", async () => {
    const fetchMock = mockFetchResponse(200, { data: {} });

    await savePlanningData(UUID, planningData);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const bodies = fetchMock.mock.calls.map((call) => {
      const [url, init] = call as unknown as [string, RequestInit];
      expect(url).toBe(`https://api.proposales.com/v3/proposals/${UUID}/data`);
      expect(init.method).toBe("PATCH");
      expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
      return JSON.parse(init.body as string);
    });
    expect(bodies).toEqual([{ data: { planning: null } }, { data: planningData }]);
  });

  it("throws when the API refuses the write", async () => {
    const fetchMock = mockFetchResponse(500);
    await expect(savePlanningData(UUID, planningData)).rejects.toThrow("500");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
