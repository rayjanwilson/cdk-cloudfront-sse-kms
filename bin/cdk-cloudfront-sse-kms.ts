#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { MainStack } from '../lib/main-stack';

const projectName = 'CfSseKms';
const env = {
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const app = new App();
new MainStack(app, 'Scenarios', { env });
