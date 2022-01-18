import { Stack, StackProps } from 'aws-cdk-lib';
import { NoEncryptionStack } from '../lib/no-encryption-stack/no-enc-stack';
import { SseS3Stack } from '../lib/sse-s3-stack/sse-s3-stack';
import { SseKMSStack } from '../lib/sse-kms-stack/sse-kms-stack';

import { Construct } from 'constructs';

export class MainStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    new NoEncryptionStack(this, 'NoEnc');
    new SseS3Stack(this, 'SSES3');
    new SseKMSStack(this, 'SseKMS');
  }
}
