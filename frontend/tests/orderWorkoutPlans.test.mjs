import assert from "node:assert/strict";
import test from "node:test";
import { orderPlansForStudent } from "../src/features/training/orderWorkoutPlans.js";

const plans = ["A", "B", "C", "D", "E", "F"].map((name, index) => ({ id: index + 1, name: `Treino ${name}` }));
const names = (list) => list.map((plan) => plan.name.at(-1)).join("");

test("rotation starts at the next workout and follows the professor's order", () => {
  assert.equal(names(orderPlansForStudent(plans, { mode: "rotating", next_plan_id: 2, recommended_plan_id: 2 })), "BCDEFA");
  assert.equal(names(orderPlansForStudent(plans, { mode: "rotating", next_plan_id: 5, recommended_plan_id: null })), "EFABCD");
  assert.equal(names(orderPlansForStudent(plans, { mode: "rotating", next_plan_id: 2 }, 4)), "DEFABC");
  assert.equal(names(orderPlansForStudent(plans, { mode: "rotating" })), "ABCDEF");
});

test("fixed days start with today's workout and follow the coming weekdays", () => {
  const fixed = [
    { id: 1, name: "Treino A", weekdays: ["monday", "thursday"] },
    { id: 2, name: "Treino B", weekdays: ["tuesday"] },
    { id: 3, name: "Treino C", weekdays: ["wednesday"] },
    { id: 4, name: "Treino D", weekdays: [] },
  ];
  const wednesday = new Date(2026, 10, 18);
  assert.equal(names(orderPlansForStudent(fixed, { mode: "fixed" }, null, wednesday)), "CABD");
});
