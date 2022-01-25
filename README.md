# CloudFront with S3 SSE-KMS

Normally with a regular configuration of S3 with amazon provided encryption (SSE-S3), CloudFront has no problem reading the hosted files from the bucket.
However, when you introduce a customer generated key via KMS (SSE-KMS), well now that throws a wrench into things.

For now, you need to provide a Lambda@Edge function that handles this for you.

This [blog post by AWS](https://aws.amazon.com/blogs/networking-and-content-delivery/serving-sse-kms-encrypted-content-from-s3-using-cloudfront/) explains everything well.

The intent of this is to not only demonstrate how to wire this up with cdk v2, but to also do it using the aws-sdk provided signing functions

demonstrate the following:
- cloudfront to s3, no encryption
- cloudfront to s3, sse-s3
- cloudfront to s3, sse-kms (from blog)
- cloudfront to s3, sse-kms, lamda@edge in typescript with @aws-sdk/signature-v4 library
  - will need to `cd lib/sse-kms-typescript-stack/lambda && npm install`

# Build and deploy

- ensure node is [installed](https://github.com/nvm-sh/nvm/blob/master/README.md)
- install dependencies
  - `npm install`
- ensure cdk is [bootstrapped](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) to your aws account
- deploy via cdk
  - `npm run deploy`
- three urls will be displayed once deployed, one for each scenario

# Excellent Links
- original blog: https://aws.amazon.com/blogs/networking-and-content-delivery/serving-sse-kms-encrypted-content-from-s3-using-cloudfront/
- cdk source:
  - https://github.com/aws/aws-cdk/blob/master/packages/%40aws-cdk/aws-cloudfront/lib/web-distribution.ts
- https://stackoverflow.com/questions/60905976/cloudfront-give-access-denied-response-created-through-aws-cdk-python-for-s3-buc
- https://www.codejam.info/2021/02/lambda-json-output-not-parsable.html
- https://stackoverflow.com/questions/49144085/bypassing-need-for-x-amz-cf-id-header-inclusion-in-s3-auth-in-cloudfront
- this was a big one for the x-amx-cf-id issue AND caching: https://advancedweb.hu/how-to-use-s3-signed-urls-with-cloudfront/
- request / response details: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/RequestAndResponseBehaviorCustomOrigin.html#request-custom-headers-behavior
- 