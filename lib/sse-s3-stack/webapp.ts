import { Construct } from 'constructs';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';

export interface IProps {
  siteBucket: s3.Bucket;
  distribution: cloudfront.CloudFrontWebDistribution | cloudfront.Distribution;
}

export class WebApp extends Construct {
  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);

    const { siteBucket, distribution } = props;

    // Deploy site contents to S3 bucket
    new s3Deployment.BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [s3Deployment.Source.asset(`${__dirname}/webapp`)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
      memoryLimit: 1024,
      serverSideEncryption: s3Deployment.ServerSideEncryption.AES_256,
    });
  }
}

// reference
// https://github.com/aws-samples/aws-cdk-examples/blob/master/typescript/static-site/static-site.ts
