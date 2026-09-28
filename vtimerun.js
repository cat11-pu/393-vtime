// vtimerun.js：按处理预算处理事件，用尽后压在账上，收尾把账做完
import { lowestOf } from "./vtime.js";

function failure(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function cloneState(state) {
  return {
    queues: (state.queues || []).map(function (row) { return [row[0], row[1], row[2]]; }),
    pops: (state.pops || []).slice(),
    ledger: (state.ledger || []).map(function (row) { return row.slice(); }),
    applied: (state.applied || []).slice()
  };
}

function codesOf(spec) {
  return {
    badName: spec.bad_name_code || "E_BAD_NAME",
    badWeight: spec.bad_weight_code || "E_BAD_WEIGHT",
    dup: spec.dup_code || "E_DUP_NAME",
    empty: spec.empty_code || "E_EMPTY",
    badEvent: spec.event_error_code || "E_BAD_EVENT"
  };
}

function checkShape(event, codes) {
  if (!event || typeof event !== "object") {
    throw failure(codes.badEvent, "事件必须是对象");
  }
  if (event.kind !== "add" && event.kind !== "pick") {
    throw failure(codes.badEvent, "事件 kind 只能是 add 或 pick");
  }
  if (event.kind === "add") {
    if (typeof event.name !== "string" || event.name.length === 0) {
      throw failure(codes.badName, "名字必须是非空字符串");
    }
    if (typeof event.weight !== "number" || !Number.isInteger(event.weight) || event.weight <= 0) {
      throw failure(codes.badWeight, "权重必须是正整数");
    }
  }
}

function insertQueue(queues, name, weight) {
  let at = queues.length;
  for (let i = 0; i < queues.length; i++) {
    if (name < queues[i][0]) { at = i; break; }
  }
  queues.splice(at, 0, [name, weight, 0]);
}

function applyEvent(state, event, codes) {
  if (event.kind === "add") {
    if (state.queues.some(function (row) { return row[0] === event.name; })) {
      throw failure(codes.dup, "名字已登记：" + event.name);
    }
    insertQueue(state.queues, event.name, event.weight);
  } else {
    if (state.queues.length === 0) {
      throw failure(codes.empty, "队列表为空，不能出队");
    }
    const index = lowestOf(state.queues);
    state.queues[index][2] += 1;
    state.pops.push(state.queues[index][0]);
  }
}

function applyRequest(state, request, codes) {
  if (request[0] === "add") {
    const name = request[1];
    if (state.queues.some(function (row) { return row[0] === name; })) {
      throw failure(codes.dup, "名字已登记：" + name);
    }
    insertQueue(state.queues, name, request[2]);
  } else {
    if (state.queues.length === 0) {
      throw failure(codes.empty, "队列表为空，不能出队");
    }
    const index = lowestOf(state.queues);
    state.queues[index][2] += 1;
    state.pops.push(state.queues[index][0]);
  }
}

function toRequest(event) {
  if (event.kind === "add") {
    return ["add", event.name, event.weight];
  }
  return ["pick"];
}

export function step(spec) {
  const codes = codesOf(spec);
  const state = cloneState(spec.state || {});
  const events = spec.events || [];
  let remaining = spec.budget || 0;
  let served = 0;

  for (const event of events) {
    if (event && Object.prototype.hasOwnProperty.call(event, "id")
        && state.applied.indexOf(event.id) !== -1) {
      continue;
    }
    checkShape(event, codes);
    if (remaining <= 0) {
      state.ledger.push(toRequest(event));
    } else {
      applyEvent(state, event, codes);
      remaining -= 1;
      served += 1;
    }
    if (event && Object.prototype.hasOwnProperty.call(event, "id")) {
      state.applied.push(event.id);
    }
  }

  return {
    state: state,
    served: served,
    ledger_before: state.ledger.length,
    ledger: state.ledger.map(function (row) { return row.slice(); }),
    judged: served,
    judged_bound: events.length
  };
}

export function close(spec) {
  const codes = codesOf(spec);
  const state = cloneState(spec.state || {});
  let catchup = 0;

  while (state.ledger.length > 0) {
    const request = state.ledger.shift();
    applyRequest(state, request, codes);
    catchup += 1;
  }

  return { state: state, catchup: catchup };
}
