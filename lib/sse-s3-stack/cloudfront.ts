import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
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

    const s3Origin = new origins.HttpOrigin(siteBucket.bucketRegionalDomainName);

    this.distribution = new cloudfront.Distribution(this, 'CloudFront', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        compress: true,
        origin: s3Origin,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      enableLogging: true,
      logIncludesCookies: true,
    });
  }
}

// reference
// https://github.com/aws-samples/aws-cdk-examples/blob/master/typescript/static-site/static-site.ts
// https://dev.to/evnz/single-cloudfront-distribution-for-s3-web-app-and-api-gateway-15c3
