import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';

export interface IProps {
  siteBucket: s3.Bucket;
}

export class Distribution extends Construct {
  public readonly distribution: cloudfront.CloudFrontWebDistribution | cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);

    const { siteBucket } = props;

    const myOriginRequestHandler = new cloudfront.experimental.EdgeFunction(this, 'EdgeFn', {
      code: lambda.Code.fromAsset(`${__dirname}/lambda/`),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      role: new iam.Role(this, 'EdgeLambdaServiceRole', {
        assumedBy: new iam.CompositePrincipal(
          new iam.ServicePrincipal('lambda.amazonaws.com'),
          new iam.ServicePrincipal('edgelambda.amazonaws.com')
        ),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
        ],
      }),
      // logRetention: logs.RetentionDays.ONE_MONTH, // turns out the EdgeFunction object does the log stuff for us, and is set to never expire
      // will look like: /aws/lambda/us-east-1.CfSseKms-BackendStack-DistroEdgeFn17833B94-FTFBGbCnymnI
    });
    myOriginRequestHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:*'],
        resources: [siteBucket.bucketArn, siteBucket.arnForObjects('*')],
      })
    );
    myOriginRequestHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt'],
        resources: ['*'],
      })
    );

    const s3Origin = new origins.HttpOrigin(siteBucket.bucketRegionalDomainName);

    this.distribution = new cloudfront.Distribution(this, 'CloudFront', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        compress: true,
        origin: s3Origin,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        edgeLambdas: [
          {
            functionVersion: myOriginRequestHandler,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
          },
        ],
      },
      enableLogging: true,
      logIncludesCookies: true,
    });
  }
}

// reference
// https://github.com/aws-samples/aws-cdk-examples/blob/master/typescript/static-site/static-site.ts
// https://dev.to/evnz/single-cloudfront-distribution-for-s3-web-app-and-api-gateway-15c3
