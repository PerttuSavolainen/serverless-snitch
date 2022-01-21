import * as dynamoose from "dynamoose";
import * as crypto from "crypto";

import { Document } from "dynamoose/dist/Document";
import { thresholds, wait } from "./misc";

const { DYNAMODB_TABLE_NAME } = process.env;

export class DynamoModel extends Document {
  pk: string;
  sk: string;
  snitchActive: boolean;
  threshold: number;
  owner: string;
  alertSentAt: number;
  createdAt: number;
  updatedAt: number;
}

const schema = new dynamoose.Schema(
  {
    pk: {
      type: String,
      hashKey: true,
    },
    sk: {
      type: String,
      rangeKey: true,
    },
    snitchActive: {
      type: Boolean,
    },
    threshold: {
      type: Number,
    },
    // cognito id, String?
    owner: {
      type: String,
    },
    alertSentAt: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const Model = dynamoose.model<DynamoModel>(DYNAMODB_TABLE_NAME, schema, {
  create: false,
});

export const getSnitch = async (id: string) => {
  return Model.get({
    pk: "snitch",
    sk: id,
  });
};

export const storeSnitch = async (id: string, thresholdInMinutes: number) => {
  const newSnitch = new Model({
    pk: "snitch",
    sk: id,
    snitchActive: true,
    threshold: thresholdInMinutes,
  });
  await newSnitch.save();
};

// export const getSnitchMuteLink = async (id: string) => {
//   return Model.get({
//     pk: "snitch-mute-link",
//     sk: id,
//   });
// };

// export const storeSnitchMuteLink = async (id: string) => {
//   const newSnitch = new Model({
//     pk: "snitch-mute-link",
//     sk: id,
//     muteLinkId: crypto.randomUUID(),
//   });
//   await newSnitch.save();
// };

// TODO: use Model.transaction ? -> query not supported? https://dynamoosejs.com/guide/Model/#modeltransaction
export const getAllBreachedSnitches = async (): Promise<DynamoModel[]> => {
  const breaches = await Promise.all(
    thresholds.map(async (timeLimit, index) => {
      await wait(100 * index);
      return getBreachesWithinTimelimit(timeLimit);
    })
  );

  return breaches.flat();
};

// Get all active snitches that breach their threshold
export const getBreachesWithinTimelimit = async (
  timeLimitInMinutes: number
): Promise<DynamoModel[]> => {
  const timeLimitInMs = timeLimitInMinutes * 60 * 1000;
  const threshold = Date.now() - timeLimitInMs;

  return Model.query("pk")
    .eq("snitch")
    .and()
    .where("snitchActive")
    .eq(true)
    .and()
    .where("threshold")
    .eq(timeLimitInMinutes)
    .and()
    .where("updatedAt")
    .lt(threshold)
    .all(100)
    .exec();
};
