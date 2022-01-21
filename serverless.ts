import type { AWS } from "@serverless/typescript";
import * as functions from "@functions/index";

const serverlessConfiguration: AWS = {
  service: "serverless-snitch",
  frameworkVersion: "2",
  plugins: ["serverless-esbuild", "serverless-offline"],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    region: "eu-north-1",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      DYNAMODB_TABLE_NAME: "${self:service}",
      SQS_NAME: "${self:service}-breached-snitches",
    },
    lambdaHashingVersion: "20201221",
    iamRoleStatements: [
      // dynamodb
      {
        Effect: "Allow",
        Action: [
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DescribeTable",
          "dynamodb:UpdateItem",
        ],
        Resource: { "Fn::GetAtt": ["DynamoTable", "Arn"] },
      },
      // sqs
      {
        Effect: "Allow",
        Action: ["sqs:SendMessage", "sqs:GetQueueUrl"],
        Resource: [{ "Fn::GetAtt": ["BreachedSnitchesQueue", "Arn"] }],
      },
    ],
  },
  functions,
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
  },
  resources: {
    Resources: {
      DynamoTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "${self:provider.environment.DYNAMODB_TABLE_NAME}",
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
          AttributeDefinitions: [
            {
              AttributeName: "pk",
              AttributeType: "S",
            },
            {
              AttributeName: "sk",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "pk",
              KeyType: "HASH",
            },
            {
              AttributeName: "sk",
              KeyType: "RANGE",
            },
          ],
        },
      },
      // SQS
      BreachedSnitchesQueue: {
        Type: "AWS::SQS::Queue",
        Properties: {
          QueueName: "${self:service}-breached-snitches",
          RedrivePolicy: {
            deadLetterTargetArn: {
              "Fn::GetAtt": ["DLQ", "Arn"],
            },
            maxReceiveCount: 3,
          },
        },
      },
      DLQ: {
        Type: "AWS::SQS::Queue",
        Properties: {
          QueueName: "${self:service}-breached-snitches-dlq",
        },
      },
      // Cognito
      UserCognitoPool: {
        Type: "AWS::Cognito::UserPool",
        Properties: {
          UserPoolName: "${self:service}-pool",
          Schema: [
            // {
            //   Name: "email",
            //   Required: true,
            //   Mutable: true,
            // },
          ],
          Policies: {
            PasswordPolicy: {
              MinimumLength: 12,
            },
          },
          AutoVerifiedAttributes: ["email"],
        },
      },
      UserCognitoPoolClient: {
        Type: "AWS::Cognito::UserPoolClient",
        Properties: {
          ClientName: "${self:service}-pool-client",
          GenerateSecret: false,
          UserPoolId: { Ref: "UserCognitoPool" },
          AccessTokenValidity: 1, // hours
          IdTokenValidity: 1, // hours
          ExplicitAuthFlows: ["ALLOW_REFRESH_TOKEN_AUTH"],
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
