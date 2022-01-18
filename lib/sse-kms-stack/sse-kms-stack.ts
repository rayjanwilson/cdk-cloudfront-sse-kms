import { NestedStack, NestedStackProps } from 'aws-cdk-lib';

import { Distribution } from './cloudfront';
import { SiteBucket } from './bucket';
import { WebApp } from './webapp';

import { Construct } from 'constructs';
import { S3Key } from './kms-keys';

export class SseKMSStack extends NestedStack {
  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    // kms keys
    const { s3key } = new S3Key(this, 'Key');

    // s3 hosting
    const { siteBucket } = new SiteBucket(this, 'SiteBucket', { s3key });

    // cloudfront
    const { distribution } = new Distribution(this, 'Distro', { siteBucket });

    // webapp distribution
    const webapp = new WebApp(this, 'WebApp', { s3key, siteBucket, distribution });

    this.exportValue(`https://${distribution.distributionDomainName}`, { name: 'sse-kms-url' });
  }
}
