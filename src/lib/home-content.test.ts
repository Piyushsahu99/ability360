import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { selectPwdHighlights } from "@/lib/home-content";
import type { Opportunity } from "@/lib/opportunities";
import type { ResourceRow } from "@/lib/resources";

const baseOpportunity = {
  id: "opportunity",
  is_published: true,
  is_inclusive_employer: true,
  deadline: null,
} as Opportunity;

const baseResource = {
  id: "resource",
  is_published: true,
  category: "divyangjan",
  expires_at: null,
} as ResourceRow;

describe("selectPwdHighlights", () => {
  test("excludes expired listings", () => {
    const results = selectPwdHighlights(
      [{ ...baseOpportunity, id: "expired", deadline: "2026-01-01" }],
      [{ ...baseResource, id: "active", expires_at: "2026-06-01T00:00:00Z" }],
      new Date("2026-04-01T00:00:00Z"),
    );
    assert.deepEqual(results.map(({ item }) => item.id), ["active"]);
  });

  test("orders dated listings by nearest deadline before rolling listings", () => {
    const results = selectPwdHighlights(
      [
        { ...baseOpportunity, id: "rolling" },
        { ...baseOpportunity, id: "later", deadline: "2026-05-20" },
      ],
      [{ ...baseResource, id: "soon", expires_at: "2026-04-10T00:00:00Z" }],
      new Date("2026-04-01T00:00:00Z"),
    );
    assert.deepEqual(results.map(({ item }) => item.id), ["soon", "later", "rolling"]);
  });
});