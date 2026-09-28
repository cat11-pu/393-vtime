import assert from "node:assert";
import { weightedOf, lowestOf, snapshotOf } from "../vtime.js";
import { step, close } from "../vtimerun.js";
import { render } from "../app.js";

const base = {
  budget: 1,
  state: { queues: [], pops: [], ledger: [], applied: [] },
  events: [{ id: 1, kind: "add", name: "a", weight: 2 }],
  bad_name_code: "E_BAD_NAME", bad_weight_code: "E_BAD_WEIGHT",
  dup_code: "E_DUP_NAME", empty_code: "E_EMPTY",
  event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("weightedOf returns a number", () => {
  assert.strictEqual(typeof weightedOf(2, 2), "number");
});

check("lowestOf returns a number", () => {
  assert.strictEqual(typeof lowestOf([["a", 2, 1]]), "number");
});

check("snapshotOf returns a list", () => {
  assert.ok(Array.isArray(snapshotOf([["a", 2, 1]])));
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count_events, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
