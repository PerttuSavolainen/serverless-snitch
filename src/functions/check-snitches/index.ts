import { handlerPath } from "@libs/handlerResolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    process.env.IS_OFFLINE
      ? {
          httpApi: "GET /checkSnitches",
        }
      : {
          // 12 times an hour
          // -> 12 * 24 * 30 -> 8640 (every minute would be 8640 * 5 -> 43200)
          // use 5 minute rate for the sake of PoC
          // schedule: "rate(5 minutes)",
          httpApi: "GET /checkSnitches",
        },
  ],
};
