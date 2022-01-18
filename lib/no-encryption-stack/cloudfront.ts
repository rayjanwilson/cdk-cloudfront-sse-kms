import { Duration } from 'aws-cdk-lib';

import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

import * as s3 from 'aws-cdk-lib/aws-s3';

import { Construct } from 'constructs';

export interface IProps {
  siteBucket: s3.Bucket;
}

export class Distribution extends Construct {
  public readonly distribution: cloudfront.CloudFrontWebDistribution | cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);

    const { siteBucket } = props;

    // Grant access to cloudfront
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI', { comment: 'Created by CDK' });
    siteBucket.grantRead(oai);

    this.distribution = new cloudfront.CloudFrontWebDistribution(this, 'CloudFrontWebDist', {
      defaultRootObject: 'index.html',
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteBucket,
            originAccessIdentity: oai,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              defaultTtl: Duration.seconds(0),
              minTtl: Duration.seconds(0),
              maxTtl: Duration.seconds(0),
            },
          ],
        },
      ],
    });
  }
}

// reference
// https://github.com/aws-samples/aws-cdk-examples/blob/master/typescript/static-site/static-site.ts
// https://dev.to/evnz/single-cloudfront-distribution-for-s3-web-app-and-api-gateway-15c3
