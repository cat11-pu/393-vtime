// vtime.js：虚拟时刻、最小那条的下标与时刻表
export function weightedOf(served, weight) {
  return Math.floor(served * 100 / weight);
}

export function lowestOf(queues) {
  let best = -1;
  for (let i = 0; i < queues.length; i++) {
    const candidate = queues[i];
    if (best === -1) { best = i; continue; }
    const current = queues[best];
    const candidateTime = weightedOf(candidate[2], candidate[1]);
    const currentTime = weightedOf(current[2], current[1]);
    if (candidateTime < currentTime
        || (candidateTime === currentTime && candidate[0] < current[0])) {
      best = i;
    }
  }
  return best;
}

export function snapshotOf(queues) {
  return queues.map(function (row) {
    return [row[0], weightedOf(row[2], row[1])];
  });
}
