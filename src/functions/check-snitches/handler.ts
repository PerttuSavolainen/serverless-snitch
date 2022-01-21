import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import * as ddb from "@libs/dynamodb";
import * as sqs from "@libs/sqs";

const checkSnitches: ValidatedEventAPIGatewayProxyEvent<any> = async () => {
  const breachedSnitches = await ddb.getAllBreachedSnitches();

  console.log("Amount of breached snitches: ", breachedSnitches.length);

  await sqs.sendMessages(
    breachedSnitches.map((snitch) => {
      return {
        id: snitch.sk,
      };
    })
  );

  // for (const snitch of breachedSnitches) {
  //   snitch.alertSentAt = Date.now();
  //   await snitch.save();
  // }

  return formatJSONResponse({
    message: "Snitches checked",
  });
};

export const main = middyfy(checkSnitches);
