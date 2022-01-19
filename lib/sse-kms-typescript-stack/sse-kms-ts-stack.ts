import { NestedStack, NestedStackProps } from 'aws-cdk-lib';

import { CloudFrontWebDistribution, Distribution } from 'aws-cdk-lib/aws-cloudfront';

import { Distribution as myDistribution } from './cloudfront';
import { SiteBucket } from './bucket';
import { WebApp } from './webapp';

import { Construct } from 'constructs';
import { S3Key } from './kms-keys';

export class SseKMSTSStack extends NestedStack {
  public readonly distribution: CloudFrontWebDistribution | Distribution;

  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    // kms keys
    const { s3key } = new S3Key(this, 'Key');

    // s3 hosting
    const { siteBucket } = new SiteBucket(this, 'SiteBucket', { s3key });

    // cloudfront
    this.distribution = new myDistribution(this, 'Distro', { siteBucket }).distribution;

    // webapp distribution
    const webapp = new WebApp(this, 'WebApp', { s3key, siteBucket, distribution: this.distribution });
  }
}
