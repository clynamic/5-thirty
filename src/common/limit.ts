export const rateLimit = async <T>(
  promise: Promise<T>,
  minTimeMs: number = 1000,
): Promise<T> => {
  const delay = new Promise<void>((resolve) => setTimeout(resolve, minTimeMs));
  const [result] = await Promise.all([promise, delay]);
  return result;
};
