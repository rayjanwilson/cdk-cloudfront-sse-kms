#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { NoEncryptionStack } from '../lib/no-encryption-stack/no-enc-stack';
import { SseS3Stack } from '../lib/sse-s3-stack/sse-s3-stack';

const projectName = 'CfSseKms';
const env = {
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const app = new App();

new NoEncryptionStack(app, 'NoEnc', { env });
new SseS3Stack(app, 'SSES3', { env });
