import { handlerPath } from "@libs/handlerResolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    process.env.IS_OFFLINE
      ? {
          httpApi: "GET /processQueue",
        }
      : {
          sqs: {
            arn: { "Fn::GetAtt": ["BreachedSnitchesQueue", "Arn"] },
          },
        },
  ],
};
