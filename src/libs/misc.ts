export const wait = async (ms: number): Promise<void> => {
  return new Promise((resolve: Function) => {
    setTimeout(() => resolve(), ms);
  });
};

export const thresholds = [15, 30, 60, 60 * 12, 60 * 24];

export const isAvailableThreshold = (threshold: number) =>
  thresholds.includes(threshold);
