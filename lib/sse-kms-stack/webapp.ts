import { Construct } from 'constructs';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';

export interface IProps {
  s3key: kms.Key;
  siteBucket: s3.Bucket;
  distribution: cloudfront.CloudFrontWebDistribution | cloudfront.Distribution;
}

export class WebApp extends Construct {
  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);

    const { s3key, siteBucket, distribution } = props;

    const bucketDeploymentRole = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
    });
    bucketDeploymentRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['cloudfront:GetInvalidation', 'cloudfront:CreateInvalidation'],
        effect: iam.Effect.ALLOW,
        resources: ['*'],
      })
    );
    siteBucket.grantReadWrite(bucketDeploymentRole);

    bucketDeploymentRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        effect: iam.Effect.ALLOW,
        resources: ['*'],
      })
    );

    // Deploy site contents to S3 bucket

    new s3Deployment.BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [s3Deployment.Source.asset(`${__dirname}/webapp`)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
      memoryLimit: 1024,
      serverSideEncryption: s3Deployment.ServerSideEncryption.AWS_KMS,
      serverSideEncryptionAwsKmsKeyId: s3key.keyId,
      role: bucketDeploymentRole,
    });
  }
}

// reference
// https://github.com/aws-samples/aws-cdk-examples/blob/master/typescript/static-site/static-site.ts
