import { Stack, StackProps } from 'aws-cdk-lib';
import { CloudfrontConstruct } from './cloudfront';
import { SiteBucket } from './bucket';
import { WebApp } from './webapp';

import { Construct } from 'constructs';

export interface IProps extends StackProps {
  projectName: string;
}

export class CdkCloudfrontSseKmsStack extends Stack {
  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id, props);

    const { projectName } = props;
    const { siteBucket } = new SiteBucket(this, 'Bucket', { projectName });
    const { distribution } = new CloudfrontConstruct(this, 'Distro', { siteBucket });
    const webapp = new WebApp(this, 'WebApp', {
      projectName,
      siteBucket,
      distribution: distribution,
    });

    this.exportValue(`https://${distribution.distributionDomainName}`, { name: 'url' });
  }
}
