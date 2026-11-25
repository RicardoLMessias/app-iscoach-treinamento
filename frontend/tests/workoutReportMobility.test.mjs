import assert from "node:assert/strict";
import test from "node:test";
import { categorizeWorkoutMovements } from "../src/shared/reports/workoutReportSections.js";

test("workout PDF separates mobility from ordinary exercises", () => {
  const regular = { id: 1, category: "exercise" };
  const mobility = { id: 2, category: "mobility" };
  const legacy = { id: 3, exercise: { category: "mobility" } };
  const uncategorized = { id: 4 };
  const groups = categorizeWorkoutMovements([regular, mobility, legacy, uncategorized]);

  assert.deepEqual(groups.exercises, [regular, uncategorized]);
  assert.deepEqual(groups.mobilities, [mobility, legacy]);
  assert.deepEqual(categorizeWorkoutMovements([]), { exercises: [], mobilities: [] });
});
