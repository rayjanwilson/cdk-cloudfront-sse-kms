import { RemovalPolicy, Stack } from 'aws-cdk-lib';

import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';

import { Construct } from 'constructs';

export interface IProps {
  siteBucket: s3.Bucket;
}
export class CloudfrontConstruct extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);
    const { region } = Stack.of(this);
    const { siteBucket } = props;

    // Grant access to cloudfront
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI', {});
    siteBucket.grantRead(oai);

    const myOriginRequestHandler = new cloudfront.experimental.EdgeFunction(this, 'EdgeFn', {
      code: lambda.Code.fromAsset(`${__dirname}/lambda/`),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
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
      logRetention: logs.RetentionDays.ONE_MONTH,
    });
    myOriginRequestHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
      })
    );

    const s3Origin = new origins.HttpOrigin(`${siteBucket.bucketName}.s3.${region}.amazonaws.com`);

    this.distribution = new cloudfront.Distribution(this, 'CloudFront', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        compress: true,
        origin: s3Origin,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
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
