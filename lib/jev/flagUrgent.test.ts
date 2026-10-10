// Tests flagUrgent with fetch and console mocked: no real Jev calls, no real API key needed.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flagUrgent } from "./flagUrgent";

const changes = [
  "Attendee added: Hugo Berg (severe nut allergy)",
  "Extras: Coffee -> Coffee and tea",
  "Agenda: Lunch 12:00 -> 13:30",
];

function mockFetchResponse(status: number, body: unknown = {}) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const answers = {
  answers: {
    c0: { type: "noul", noul: 0.97 },
    c1: { type: "noul", noul: 0.04 },
    c2: { type: "noul", noul: 0.8 },
  },
};

beforeEach(() => {
  vi.stubEnv("JEV_API_KEY", "test-jev-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("flagUrgent", () => {
  it("returns the urgent change lines in their original order", async () => {
    mockFetchResponse(200, answers);

    expect(await flagUrgent("Acme Sales Kickoff", changes)).toEqual([
      "Attendee added: Hugo Berg (severe nut allergy)",
      "Agenda: Lunch 12:00 -> 13:30",
    ]);
  });

  it("sends the Bearer header, JSON body, and a timeout signal to the Jev endpoint", async () => {
    const fetchMock = mockFetchResponse(200, answers);

    await flagUrgent("Acme Sales Kickoff", changes);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.typesafe.ai/v1/systemone");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-jev-key");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("jev-latest");
    expect(body.state.event).toBe("Acme Sales Kickoff");
    expect(body.state.changes).toHaveLength(3);
  });

  it("returns [] without calling fetch when the API key is missing", async () => {
    vi.stubEnv("JEV_API_KEY", "");
    const fetchMock = mockFetchResponse(200, answers);

    expect(await flagUrgent("Acme Sales Kickoff", changes)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns [] without calling fetch when there are no changes", async () => {
    const fetchMock = mockFetchResponse(200, answers);

    expect(await flagUrgent("Acme Sales Kickoff", [])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns [] and logs only the status on HTTP 500", async () => {
    mockFetchResponse(500, {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await flagUrgent("Acme Sales Kickoff", changes)).toEqual([]);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const logged = errorSpy.mock.calls.flat().join(" ");
    expect(logged).toContain("500");
    expect(logged).not.toContain("test-jev-key");
    expect(logged).not.toContain("Hugo Berg");
  });

  it("returns [] when the request is aborted by the timeout", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await flagUrgent("Acme Sales Kickoff", changes)).toEqual([]);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls.flat().join(" ")).toContain("TimeoutError");
  });

  it("returns [] when fetch rejects with an AbortError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await flagUrgent("Acme Sales Kickoff", changes)).toEqual([]);
  });

  it("returns [] when the response body is not valid JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>oops</html>", { status: 200 })));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await flagUrgent("Acme Sales Kickoff", changes)).toEqual([]);
  });
});
