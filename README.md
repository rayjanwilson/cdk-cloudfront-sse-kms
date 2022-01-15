# CloudFront with S3 SSE-KMS

Normally with a regular configuration of S3 with amazon provided encryption (SSE-S3), CloudFront has no problem reading the hosted files from the bucket.
However, when you introduce a customer generated key via KMS (SSE-KMS), well now that throws a wrench into things.

For now, you need to provide a Lambda@Edge function that handles this for you. smh i know.

To further complicate things, this [blog post by AWS](https://aws.amazon.com/blogs/networking-and-content-delivery/serving-sse-kms-encrypted-content-from-s3-using-cloudfront/) explains everything well, but then uses a custom signing function, rather than using `SignatureV4` provided by the aws sdk.

So the intent of this is to not only demonstrate how to wire this up with cdk v2, but to also do it using the aws-sdk provided signing functions