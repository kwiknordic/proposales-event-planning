// Tests parseProposal against the real API shape captured in fixtures/proposal-response.json.
import { describe, it, expect } from "vitest";
import fixture from "../../fixtures/proposal-response.json";
import { parseProposal } from "./parseProposal";

describe("parseProposal", () => {
  it("reads uuid, title and status from the proposal", () => {
    const proposal = parseProposal(fixture);
    expect(proposal.uuid).toBe("67c008dd-7ee6-4687-bc60-1647fdf46a9a");
    expect(proposal.title).toBe("Acme Sales Kickoff – 2 days, 40 people");
    expect(proposal.status).toBe("accepted");
  });

  it("reads custom data from the nested data.data level", () => {
    const proposal = parseProposal(fixture);
    expect(proposal.data.planning_status).toBe("submitted");
    expect(proposal.data.planning).toBeDefined();
    expect((proposal.data.planning as { agenda: unknown[] }).agenda).toHaveLength(1);
  });

  it("gives an empty data object when custom data is missing", () => {
    const raw = { data: { uuid: "u", title: "t", status: "draft" } };
    expect(parseProposal(raw).data).toEqual({});
  });

  it("gives an empty data object when custom data is null", () => {
    const raw = { data: { uuid: "u", title: "t", status: "draft", data: null } };
    expect(parseProposal(raw).data).toEqual({});
  });

  it("throws when the response has no proposal", () => {
    expect(() => parseProposal({})).toThrow();
    expect(() => parseProposal(null)).toThrow();
  });
});
