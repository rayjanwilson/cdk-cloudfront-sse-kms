import { Stack, StackProps } from 'aws-cdk-lib';

import { Distribution } from './cloudfront';
import { SiteBucket } from './bucket';
import { WebApp } from './webapp';

import { Construct } from 'constructs';

export class NoEncryptionStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // s3 hosting
    const { siteBucket } = new SiteBucket(this, 'SiteBucket');

    // cloudfront
    const { distribution } = new Distribution(this, 'Distro', { siteBucket });

    // webapp distribution
    const webapp = new WebApp(this, 'WebApp', { siteBucket, distribution });

    this.exportValue(`https://${distribution.distributionDomainName}`, { name: 'no-enc-url' });
  }
}
