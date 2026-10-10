// Tests sendEmail with fetch and console mocked: no real Resend calls, no real API key needed.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendEmail } from "./sendEmail";

const message = {
  subject: "New event plan: Acme Sales Kickoff",
  html: "<p>Plan</p>",
  text: "Plan",
  attendeesCsv: "name,diet\r\nÉmilie,vegan\r\n",
};

function mockFetchResponse(status: number) {
  const fetchMock = vi.fn(async () => new Response("{}", { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sentBody(fetchMock: ReturnType<typeof mockFetchResponse>) {
  const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return JSON.parse(init.body as string);
}

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
  vi.stubEnv("HOTEL_NOTIFY_EMAIL", "hotel@example.com");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("sendEmail with Resend configured", () => {
  it("POSTs to the Resend emails endpoint with the Bearer header and JSON body", async () => {
    const fetchMock = mockFetchResponse(200);

    await sendEmail({ ...message, attendeesCsv: null });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer re_test_key");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({
      from: "Event planning <onboarding@resend.dev>",
      to: ["hotel@example.com"],
      subject: "New event plan: Acme Sales Kickoff",
      html: "<p>Plan</p>",
      text: "Plan",
    });
  });

  it("attaches attendees.csv as base64 with a UTF-8 BOM so Excel shows accents", async () => {
    const fetchMock = mockFetchResponse(200);

    await sendEmail(message);

    const body = sentBody(fetchMock);
    expect(body.attachments).toHaveLength(1);
    expect(body.attachments[0].filename).toBe("attendees.csv");
    const decoded = Buffer.from(body.attachments[0].content, "base64").toString("utf8");
    expect(decoded.startsWith("﻿")).toBe(true);
    expect(decoded.slice(1)).toBe(message.attendeesCsv);
  });

  it("sends no attachments when there are no attendees", async () => {
    const fetchMock = mockFetchResponse(200);

    await sendEmail({ ...message, attendeesCsv: null });

    expect(sentBody(fetchMock)).not.toHaveProperty("attachments");
  });

  it("logs an error with the status only and resolves when Resend answers 500", async () => {
    mockFetchResponse(500);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendEmail(message)).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const logged = String(errorSpy.mock.calls[0]?.[0]);
    expect(logged).toContain("500");
    expect(logged).not.toContain("re_test_key");
  });

  it("logs an error and resolves when the network request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("fetch failed");
    }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendEmail(message)).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

describe("sendEmail without Resend configuration", () => {
  it("prints the email to the log and does not call fetch when the API key is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchMock = mockFetchResponse(200);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await sendEmail(message);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
    const logged = logSpy.mock.calls.flat().join("\n");
    expect(logged).toContain(message.subject);
    expect(logged).toContain(message.text);
    expect(logged).toContain("attendees.csv");
  });

  it("prints the email to the log when the notify address is missing", async () => {
    vi.stubEnv("HOTEL_NOTIFY_EMAIL", "");
    const fetchMock = mockFetchResponse(200);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await sendEmail({ ...message, attendeesCsv: null });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
    expect(logSpy.mock.calls.flat().join("\n")).not.toContain("attendees.csv");
  });
});
