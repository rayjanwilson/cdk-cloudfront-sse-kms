#!/usr/bin/env node
import { CloudFrontResponseResult, CloudFrontRequestEvent } from 'aws-lambda';
import { Credentials, HeaderBag } from '@aws-sdk/types';
import { Sha256 } from '@aws-crypto/sha256-js';
import { SignatureV4, SignatureV4Init } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';

import * as crypto from 'crypto';

const emptyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const signedHeaders = 'host;x-amz-cf-id;x-amz-content-sha256;x-amz-date;x-amz-security-token';
// Retrieve the temporary IAM credentials of the function that were granted by
// the Lambda@Edge service based on the function permissions. In this solution, the function
// is given permissions to read from S3.
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN } = process.env;

export const handler = (event: CloudFrontRequestEvent) => {
  console.log('\nevent');
  console.log(JSON.stringify(event));
  const { request, config } = event.Records[0].cf;
  const credentials: Credentials = {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
    sessionToken: AWS_SESSION_TOKEN,
  };
  // console.log(JSON.stringify(credentials));

  // new way using aws sdk libs
  // const transformedHeaders: HeaderBag = convertToHeaderBag(request.headers);

  // const signerInit = {
  //   service: 's3',
  //   region: 'us-east-1',
  //   sha256: Sha256,
  //   credentials,
  // };
  // const signer = new SignatureV4(signerInit);
  // const aws_styled_request = new HttpRequest({
  //   method: request.method,
  //   protocol: request.origin?.custom?.protocol,
  //   path: request.origin?.custom?.path,
  //   headers: transformedHeaders,
  // });
  // console.log('aws_styled_request');
  // console.log(JSON.stringify(aws_styled_request));

  // const transformed = signer.sign(aws_styled_request);
  // console.log('transformed');
  // console.log(JSON.stringify(transformed));

  // original way
  const sigv4Options = {
    method: request.method,
    path: `${request.origin!.custom!.path}/${request.uri}`,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      sessionToken: AWS_SESSION_TOKEN,
    },
    host: request.headers['host'][0].value,
    xAmzCfId: config.requestId,
  };

  const signature: Record<string, string> = signV4(sigv4Options);
  console.log('\nsignature');
  console.log(JSON.stringify(signature));

  // Finally, add the signature headers to the request before it is sent to S3
  for (let header in signature) {
    request.headers[header.toLowerCase()] = [
      {
        key: header,
        value: signature[header], //.toString(),
      },
    ];
  }
  console.log('\nfinal custom request');
  console.log(JSON.stringify(request));
  return request;
};

// Helper functions to sign the request using AWS Signature Version 4
// This helper only works for S3, using GET/HEAD requests, without query strings
// https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html
const signV4 = (options: any) => {
  // Infer the region from the host header
  const region = options.host.split('.')[2];
  // Create the canonical request
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const canonicalHeaders = [
    'host:' + options.host,
    'x-amz-cf-id:' + options.xAmzCfId,
    'x-amz-content-sha256:' + emptyHash,
    'x-amz-date:' + date,
    'x-amz-security-token:' + options.credentials.sessionToken,
  ].join('\n');
  const canonicalURI = encodeRfc3986(
    encodeURIComponent(decodeURIComponent(options.path).replace(/\+/g, ' ')).replace(/%2F/g, '/')
  );
  const canonicalRequest = [options.method, canonicalURI, '', canonicalHeaders + '\n', signedHeaders, emptyHash].join(
    '\n'
  );
  // Create string to sign
  const credentialScope = [date.slice(0, 8), region, 's3/aws4_request'].join('/');
  const stringToSign = ['AWS4-HMAC-SHA256', date, credentialScope, hash(canonicalRequest, 'hex')].join('\n');
  // Calculate the signature
  const signature = hmac(
    hmac(
      hmac(hmac(hmac('AWS4' + options.credentials.secretAccessKey, date.slice(0, 8)), region), 's3'),
      'aws4_request'
    ),
    stringToSign,
    'hex'
  );
  // Form the authorization header
  const authorizationHeader = [
    'AWS4-HMAC-SHA256 Credential=' + options.credentials.accessKeyId + '/' + credentialScope,
    'SignedHeaders=' + signedHeaders,
    'Signature=' + signature,
  ].join(', ');
  // return required headers for Sigv4 to be added to the request to S3
  return {
    Authorization: authorizationHeader,
    'X-Amz-Content-Sha256': emptyHash,
    'X-Amz-Date': date,
    'X-Amz-Security-Token': options.credentials.sessionToken,
  };
};

const encodeRfc3986 = (urlEncodedStr: string): string => {
  return urlEncodedStr.replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
};

const hash = (string: any, encoding: crypto.BinaryToTextEncoding): string => {
  return crypto.createHash('sha256').update(string, 'utf8').digest(encoding);
};

const hmac = (
  key: crypto.BinaryLike | crypto.KeyObject,
  data: string,
  encoding?: crypto.BinaryToTextEncoding
): string | Buffer => {
  if (encoding) {
    return crypto.createHmac('sha256', key).update(data, 'utf8').digest(encoding);
  } else {
    return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
  }
};

const convertToHeaderBag = (headers: any): HeaderBag => {
  let transformedHeaders: HeaderBag = {};
  Object.keys(headers).forEach((itemArray: any) => {
    const { key, value } = itemArray[0];
    transformedHeaders[key] = value;
  });
  return transformedHeaders;
};
