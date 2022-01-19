import { NestedStack, NestedStackProps } from 'aws-cdk-lib';

import { CloudFrontWebDistribution, Distribution } from 'aws-cdk-lib/aws-cloudfront';

import { Distribution as myDistribution } from './cloudfront';
import { SiteBucket } from './bucket';
import { WebApp } from './webapp';

import { Construct } from 'constructs';

export class SseS3Stack extends NestedStack {
  public readonly distribution: CloudFrontWebDistribution | Distribution;

  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    // s3 hosting
    const { siteBucket } = new SiteBucket(this, 'SiteBucket');

    // cloudfront
    this.distribution = new myDistribution(this, 'Distro', { siteBucket }).distribution;

    // webapp distribution
    const webapp = new WebApp(this, 'WebApp', { siteBucket, distribution: this.distribution });
  }
}
