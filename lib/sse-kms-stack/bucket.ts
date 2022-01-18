import { RemovalPolicy } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';

import { Construct } from 'constructs';

export interface IProps {
  s3key: kms.Key;
}

export class SiteBucket extends Construct {
  public readonly siteBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);
    const { s3key } = props;

    this.siteBucket = new s3.Bucket(this, 'Bucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3key,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      /**
       * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
       */
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code

      /**
       * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
       * setting will enable full cleanup of the demo.
       */
      autoDeleteObjects: true, // NOT recommended for production code
    });
  }
}
