import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';

import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';

import { Construct } from 'constructs';

export interface IProps {
  siteBucket: s3.Bucket;
}
export class CloudfrontConstruct extends Construct {
  public readonly distribution: cloudfront.CloudFrontWebDistribution | cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);
    const { region } = Stack.of(this);
    const { siteBucket } = props;

    // Grant access to cloudfront
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI', { comment: 'Created by CDK' });
    siteBucket.grantRead(oai);

    // edge by hand
    // const myOriginRequestHandler = new lambdaNode.NodejsFunction(this, 'EdgeFnRaw', {
    //   entry: `${__dirname}/lambda/sig4style.ts`,
    //   handler: 'handler',
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   logRetention: logs.RetentionDays.ONE_MONTH,
    // });
    // siteBucket.grantRead(myOriginRequestHandler);
    // const myOriginRequestHandlerVersion = new lambda.Version(this, 'EdgeFnVersion', {
    //   lambda: myOriginRequestHandler,
    // });
    // siteBucket.grantRead(myOriginRequestHandlerVersion);

    // const myOriginRequestHandler = new cloudfront.experimental.EdgeFunction(this, 'EdgeFn', {
    //   code: lambda.Code.fromAsset(`${__dirname}/lambda/`),
    //   handler: 'sig4style.handler',
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   // role: new iam.Role(this, 'EdgeLambdaServiceRole', {
    //   //   assumedBy: new iam.CompositePrincipal(
    //   //     new iam.ServicePrincipal('lambda.amazonaws.com'),
    //   //     new iam.ServicePrincipal('edgelambda.amazonaws.com')
    //   //   ),
    //   //   managedPolicies: [
    //   //     iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    //   //     iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
    //   //   ],
    //   // }),
    //   // logRetention: logs.RetentionDays.ONE_MONTH, // turns out the EdgeFunction object does the log stuff for us, and is set to never expire
    //   // will look like: /aws/lambda/us-east-1.CfSseKms-BackendStack-DistroEdgeFn17833B94-FTFBGbCnymnI
    // });
    // myOriginRequestHandler.addToRolePolicy(
    //   new iam.PolicyStatement({
    //     effect: iam.Effect.ALLOW,
    //     actions: ['s3:*'],
    //     resources: [siteBucket.bucketArn, siteBucket.arnForObjects('*')],
    //   })
    // );

    // const myOriginRequestHandler = new lambdaNode.NodejsFunction(this, 'NodeEdgeFn', {
    //   entry: `${__dirname}/lambda/sig4style.ts`,
    //   handler: 'handler',
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   logRetention: logs.RetentionDays(Duration.)
    // });

    // myOriginRequestHandler.addToRolePolicy(
    //   new iam.PolicyStatement({
    //     actions: ['kms:Decrypt'],
    //     resources: ['*'],
    //   })
    // );

    // const s3Origin = new origins.HttpOrigin(`${siteBucket.bucketName}.s3.${region}.amazonaws.com`);
    // const s3Origin = new origins.HttpOrigin(siteBucket.bucketRegionalDomainName);
    // const s3Origin = new origins.S3Origin(siteBucket);

    // this.distribution = new cloudfront.Distribution(this, 'CloudFront', {
    //   defaultRootObject: 'index.html',
    //   defaultBehavior: {
    //     origin: s3Origin,
    //     // originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
    //     // viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //     cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
    //     edgeLambdas: [
    //       {
    //         functionVersion: myOriginRequestHandler,
    //         eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST, // cloudfront.LambdaEdgeEventType.VIEWER_REQUEST, //
    //       },
    //     ],
    //   },
    //   enableLogging: true,
    //   logIncludesCookies: true,
    // });

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
              // lambdaFunctionAssociations: [
              //   {
              //     eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
              //     lambdaFunction: myOriginRequestHandlerVersion, //myOriginRequestHandler,
              //   },
              // ],
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
