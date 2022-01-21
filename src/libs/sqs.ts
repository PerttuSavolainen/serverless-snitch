import { SQS } from "aws-sdk";
import * as crypto from "crypto";

const { SQS_NAME } = process.env;
const sqs = new SQS();

const getQueueUrl = async (): Promise<string> => {
  const { QueueUrl: queueUrl } = await sqs
    .getQueueUrl({
      QueueName: SQS_NAME,
    })
    .promise();
  return queueUrl;
};

interface IBreachedSnitchMessage {
  [key: string]: any;
}

// Prepare messages to max 10 message chunks
const prepareMessagesForSQS = (messages: IBreachedSnitchMessage[]) => {
  const chunks: IBreachedSnitchMessage[][] = [];

  while (messages.length > 10) {
    const chunk = messages.splice(0, 10);
    chunks.push(chunk);
  }

  return [...chunks, messages];
};

export const sendMessages = async (
  messages: IBreachedSnitchMessage[]
): Promise<void> => {
  const queueUrl = await getQueueUrl();

  const preparedMessages = prepareMessagesForSQS(messages);

  await Promise.all(
    preparedMessages.map(async (messageBatch: IBreachedSnitchMessage[]) => {
      await sqs
        .sendMessageBatch({
          QueueUrl: queueUrl,
          Entries: messageBatch.map((msg) => ({
            Id: crypto.randomUUID(),
            MessageBody: JSON.stringify(msg),
          })),
        })
        .promise();
    })
  );
};
