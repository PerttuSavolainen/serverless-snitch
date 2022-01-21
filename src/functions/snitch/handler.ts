import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';

import * as ddb from '@libs/dynamodb';

const snitch: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  // TODO: sanitize
  const snitchId = event.pathParameters?.id;

  const details = await ddb.getSnitch(snitchId);

  if (!details) {
    console.log(`Not found with ${snitchId}`);
    return {
      ...formatJSONResponse({
        message: 'Not Found',
      }),
      statusCode: 404,
    };
  }

  // found, update updateAt field
  await details.save();

  return formatJSONResponse({
    message: 'Snitch triggered',
  });
}

export const main = middyfy(snitch);
