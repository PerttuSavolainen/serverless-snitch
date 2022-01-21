import * as crypto from "crypto";

import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import * as ddb from "@libs/dynamodb";
import { isAvailableThreshold, wait } from "@libs/misc";

const generateUniqueSnitchId = async () => {
  const generated = crypto.randomBytes(6).toString("hex");

  if (await ddb.getSnitch(generated)) {
    console.log("Generated id matches with existing one!");
    await wait(100);
    return generateUniqueSnitchId();
  }

  console.log("Generated id is unique!");
  return generated;
};

const createSnitch: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  try {
    // TODO: sanitize
    const {
      queryStringParameters: { threshold },
    } = event;

    const thresholdInMinutes = +threshold;

    if (!isAvailableThreshold(thresholdInMinutes)) {
      throw new Error(`Invalid threshold: ${threshold}`);
    }

    const newSnitchId = await generateUniqueSnitchId();

    console.log("generated", newSnitchId);

    await ddb.storeSnitch(newSnitchId, thresholdInMinutes);

    return formatJSONResponse({
      message: "Snitch created",
      id: newSnitchId,
    });
  } catch (error) {
    console.error(error);

    return {
      ...formatJSONResponse({
        message: "Snitch creation failed",
      }),
      statusCode: 500,
    };
  }
};

export const main = middyfy(createSnitch);
