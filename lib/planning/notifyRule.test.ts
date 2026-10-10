// Tests for the notify rule: which email to send and what planning_status to store after a save or submit.
import { describe, expect, it } from "vitest";
import { decideNotification } from "./notifyRule";
import type { Change } from "./changes";

const oneChange: Change = { section: "agenda", kind: "added", line: "Agenda added: Lunch" };

describe("decideNotification", () => {
  it("saves before the first submit without an email and keeps the status absent", () => {
    expect(decideNotification({ status: null, action: "save", changes: [oneChange] })).toEqual({ email: null, status: null });
  });

  it("treats a missing status like a not-submitted one", () => {
    expect(decideNotification({ status: undefined, action: "save", changes: [] })).toEqual({ email: null, status: null });
  });

  it("treats any status other than submitted as not submitted", () => {
    expect(decideNotification({ status: "draft", action: "save", changes: [oneChange] })).toEqual({ email: null, status: null });
  });

  it("always emails on the first submit, even with zero changes", () => {
    expect(decideNotification({ status: null, action: "submit", changes: [] })).toEqual({
      email: "submitted",
      status: "submitted",
    });
  });

  it("emails an update after submit when at least one real change exists", () => {
    expect(decideNotification({ status: "submitted", action: "save", changes: [oneChange] })).toEqual({
      email: "updated",
      status: "submitted",
    });
  });

  it("sends no email after submit when nothing changed", () => {
    expect(decideNotification({ status: "submitted", action: "save", changes: [] })).toEqual({
      email: null,
      status: "submitted",
    });
  });

  it("treats submit after submit like save after submit with changes", () => {
    expect(decideNotification({ status: "submitted", action: "submit", changes: [oneChange] })).toEqual({
      email: "updated",
      status: "submitted",
    });
  });

  it("treats submit after submit like save after submit without changes", () => {
    expect(decideNotification({ status: "submitted", action: "submit", changes: [] })).toEqual({
      email: null,
      status: "submitted",
    });
  });
});
