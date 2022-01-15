import { Construct } from 'constructs';
import { Aws, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface IProps extends StackProps {
  projectName: string;
}
export class KeyStack extends Stack {
  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);
    const { projectName } = props;

    const stageName: string = this.node.tryGetContext('stageName') ?? 'dev';

    const keyAdminRole = new iam.Role(this, 'Role', {
      assumedBy: new iam.AccountPrincipal(Aws.ACCOUNT_ID),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AWSKeyManagementServicePowerUser')],
    });

    const s3Key = new kms.Key(this, 'S3', {
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY,
      alias: `${projectName}_${stageName}_S3`,
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

    this.exportValue(s3Key.keyId, { name: `${projectName}S3KeyID${stageName}` });
  }
}
