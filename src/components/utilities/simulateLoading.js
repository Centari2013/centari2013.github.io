// simulateLoading.js

/**
 * Simple loader utility for manual checkpoints.
 *
 * Usage:
 * const loader = createLoader(totalSteps, onProgress);
 * // ... your code ...
 * loader.checkpoint(); // call each time a step completes
 * // after all checkpoints, loader.done resolves
 * loader.done.then(() => console.log('All steps completed'));
 *
 * @param {number} totalSteps - total number of checkpoints
 * @param {function(number):void} [onProgress] - callback receiving progress fraction (0 to 1)
 * @returns {{ checkpoint: function(): void, done: Promise<void> }}
 */
export function createLoader(totalSteps, onProgress) {
  let done = 0;
  let resolveComplete;
  const donePromise = new Promise(resolve => {
    resolveComplete = resolve;
  });

  function checkpoint() {
    if (done >= totalSteps) return;
    done += 1;
    if (typeof onProgress === 'function') {
      onProgress(done / totalSteps);
    }
    if (done === totalSteps) {
      resolveComplete();
    }
  }

  return {
    checkpoint,
    done: donePromise
  };
}
