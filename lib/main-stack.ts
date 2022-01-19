import { Stack, StackProps } from 'aws-cdk-lib';
import { NoEncryptionStack } from '../lib/no-encryption-stack/no-enc-stack';
import { SseS3Stack } from '../lib/sse-s3-stack/sse-s3-stack';
import { SseKMSStack } from '../lib/sse-kms-stack/sse-kms-stack';
import { SseKMSTSStack } from '../lib/sse-kms-typescript-stack/sse-kms-ts-stack';

import { Construct } from 'constructs';

export class MainStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const no_enc = new NoEncryptionStack(this, 'NoEnc');
    const sse_s3 = new SseS3Stack(this, 'SseS3');
    const sse_kms = new SseKMSStack(this, 'SseKMS');
    // const sse_kms_ts = new SseKMSStack(this, 'SseKMSTs');

    this.exportValue(`https://${no_enc.distribution.distributionDomainName}`, { name: 'no-enc-url' });
    this.exportValue(`https://${sse_s3.distribution.distributionDomainName}`, { name: 'sse-s3-url' });
    this.exportValue(`https://${sse_kms.distribution.distributionDomainName}`, { name: 'sse-kms-url' });
    // this.exportValue(`https://${sse_kms_ts.distribution.distributionDomainName}`, { name: 'sse-kms-ts-url' });
  }
}
