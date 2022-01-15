#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { CdkCloudfrontSseKmsStack } from '../lib/cdk-cloudfront-sse-kms-stack';
import { KeyStack } from '../lib/kms-keys';

const projectName = 'CfSseKms';
const env = {
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const app = new App();

const keyStack = new KeyStack(app, `${projectName}-KeyStack`, { projectName, env });
const backend = new CdkCloudfrontSseKmsStack(app, `${projectName}-BackendStack`, {
  projectName,
  env,
});
backend.addDependency(keyStack, 'need the keys to be available first');
