import * as cdk from 'aws-cdk-lib';
import * as api from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
// import * as lambdaNodejs from '@aws-cdk/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';

// Note: To ensure CDKv2 compatibility, keep the import statement for Construct separate
import { Construct } from 'constructs';

export interface IProps {
  projectName: string;
  stagename: string;
  api: api.IRestApi;
}
export class CloudfrontConstruct extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly siteBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);
    const { region } = cdk.Stack.of(this);
    const { projectName, stagename, api } = props;

    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI', {});

    const encryptionKey = kms.Alias.fromAliasName(this, 's3Key', `${projectName}_${stagename}_S3`);

    this.siteBucket = new s3.Bucket(this, 'Bucket', {
      //   bucketName: siteDomain,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      /**
       * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
       */
      removalPolicy: stagename === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY, // NOT recommended for production code

      /**
       * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
       * setting will enable full cleanup of the demo.
       */
      autoDeleteObjects: stagename === 'prod' ? false : true, // NOT recommended for production code
    });
    // Grant access to cloudfront
    this.siteBucket.grantRead(oai);

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

    const s3Origin = new origins.HttpOrigin(`${this.siteBucket.bucketName}.s3.${region}.amazonaws.com`);
    
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
