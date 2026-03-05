/**
 * Wraps async route handlers so rejections are passed to Express error middleware.
 * Use for any handler that returns a Promise (e.g. async (req, res) => { ... }).
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
