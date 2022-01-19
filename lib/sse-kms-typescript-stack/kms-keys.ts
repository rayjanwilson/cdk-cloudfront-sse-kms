import { Construct } from 'constructs';
import { Aws, RemovalPolicy } from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';

export class S3Key extends Construct {
  public readonly s3key: kms.Key;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const keyAdminRole = new iam.Role(this, 'Role', {
      assumedBy: new iam.AccountPrincipal(Aws.ACCOUNT_ID),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AWSKeyManagementServicePowerUser')],
    });

    this.s3key = new kms.Key(this, 'S3ts', {
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY,
      alias: 'SSE_KMS_S3_TS',
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountPrincipal(Aws.ACCOUNT_ID), new iam.ArnPrincipal(keyAdminRole.roleArn)],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:CallerAccount': Aws.ACCOUNT_ID,
                'kms:ViaService': `s3.${Aws.REGION}.amazonaws.com`,
              },
            },
          }),
        ],
      }),
    });
  }
}
