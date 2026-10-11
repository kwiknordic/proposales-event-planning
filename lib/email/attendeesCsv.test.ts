// Tests for attendeesCsv: the attendees.csv attachment of the hotel email.
import { describe, expect, it } from "vitest";
import { attendeesCsv } from "./attendeesCsv";

describe("attendeesCsv", () => {
  it("returns only the header row for no attendees", () => {
    expect(attendeesCsv([])).toBe("name,diet\r\n");
  });

  it("writes one row per attendee in the given order", () => {
    const csv = attendeesCsv([
      { name: "Ana Lopez", diet: "vegan" },
      { name: "Ben Ortiz", diet: "" },
    ]);
    expect(csv).toBe("name,diet\r\nAna Lopez,vegan\r\nBen Ortiz,\r\n");
  });

  it("quotes values with a comma", () => {
    expect(attendeesCsv([{ name: "Doe, Jane", diet: "nut allergy, severe" }])).toBe(
      'name,diet\r\n"Doe, Jane","nut allergy, severe"\r\n',
    );
  });

  it("quotes values with a double quote and doubles the inner quote", () => {
    expect(attendeesCsv([{ name: 'Say "hi"', diet: "" }])).toBe('name,diet\r\n"Say ""hi""",\r\n');
  });

  it("quotes values with a line feed or carriage return", () => {
    expect(attendeesCsv([{ name: "Line\nBreak", diet: "a\rb" }])).toBe('name,diet\r\n"Line\nBreak","a\rb"\r\n');
  });

  it("guards each formula character with a leading apostrophe", () => {
    const csv = attendeesCsv([
      { name: "=1+1", diet: "+vegan" },
      { name: "-5", diet: "@home" },
    ]);
    expect(csv).toBe("name,diet\r\n'=1+1,'+vegan\r\n'-5,'@home\r\n");
  });

  it("does not guard values that only contain a formula character inside", () => {
    expect(attendeesCsv([{ name: "Ana-Maria", diet: "x=y" }])).toBe("name,diet\r\nAna-Maria,x=y\r\n");
  });

  it("applies the guard before quoting", () => {
    expect(attendeesCsv([{ name: '=HYPERLINK("x")', diet: "" }])).toBe('name,diet\r\n"\'=HYPERLINK(""x"")",\r\n');
  });

  it("uses CRLF for every line and ends with a final CRLF", () => {
    const csv = attendeesCsv([
      { name: "A", diet: "B" },
      { name: "C", diet: "D" },
    ]);
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csv.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("does not add a UTF-8 BOM", () => {
    expect(attendeesCsv([{ name: "A", diet: "" }]).startsWith("﻿")).toBe(false);
  });

  it("keeps accented names as they are", () => {
    expect(attendeesCsv([{ name: "Chloé Martin", diet: "sin gluten" }])).toBe(
      "name,diet\r\nChloé Martin,sin gluten\r\n",
    );
  });
});
