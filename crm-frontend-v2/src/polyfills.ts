// Polyfill for process.nextTick
if (typeof process !== 'undefined' && !process.nextTick) {
  process.nextTick = (fn: Function, ...args: any[]) => {
    Promise.resolve().then(() => fn(...args));
  };
}