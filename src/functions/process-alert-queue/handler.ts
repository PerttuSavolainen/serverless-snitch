import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import * as ddb from "@libs/dynamodb";

const processQueue: any = async (event) => {
  console.log("event", event);
  try {
    const messages = event.Records;

    Promise.all(
      messages.map(async ({ messageId, body }) => {
        console.log(`Processing message with id: ${messageId}`);
        const { id } = JSON.parse(body);

        const snitch = await ddb.getSnitch(id);

        // TODO: get user information from Cognito and send message via SES
        console.log(snitch.owner);

        // message sent, update db object
        snitch.alertSentAt = Date.now();
        await snitch.save();
      })
    );

    // const message = JSON.parse()
  } catch (error) {
    return {
      ...formatJSONResponse({
        message: "Queue processing failed",
      }),
      statusCode: 500,
    };
  }
  return formatJSONResponse({
    message: "Queue processed",
  });
};

export const main = middyfy(processQueue);
