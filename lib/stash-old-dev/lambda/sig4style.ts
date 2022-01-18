#!/usr/bin/env node
import {
  CloudFrontResponseResult,
  CloudFrontRequestEvent,
  CloudFrontHeaders,
  CloudFrontRequestResult,
  CloudFrontRequestCallback,
  CloudFrontRequestHandler,
  Callback,
  CloudFrontRequest,
} from 'aws-lambda';
import { HeaderBag } from '@aws-sdk/types';
import { Sha256 } from '@aws-crypto/sha256-js';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

interface CreateSignHttpRequestParams {
  body?: string;
  // headers?: CloudFrontHeaders;
  // requestid?: string;
  hostname: string;
  method?: string;
  path?: string;
  port?: number;
  protocol?: string;
  query?: Record<string, string>;
  service: string;
  region?: string;
}

export const handler: CloudFrontRequestHandler = async (
  event: CloudFrontRequestEvent,
  context: any,
  callback: Callback<CloudFrontRequestResult>
): Promise<CloudFrontRequestResult> => {
  console.log('\nevent');
  console.log(JSON.stringify(event, null, 4));

  const { request, config } = event.Records[0].cf;

  let signedRequest = await createSignedHttpRequest({
    // headers: request.headers,
    // requestid: config.requestId,
    hostname: request.origin!.custom!.domainName!,
    path: request.origin?.custom?.path,
    protocol: request.origin?.custom?.protocol,
    service: 's3',
    region: 'us-east-1',
  });

  console.log('\nsigned request');
  console.log(JSON.stringify(signedRequest, null, 4));

  const signed_headers: CloudFrontHeaders = convertHeaders(signedRequest.headers);
  const new_headers: CloudFrontHeaders = {
    ...request.headers,
    ...signed_headers,
  };

  const finalRequest: CloudFrontRequest = {
    ...request,
    headers: new_headers,
  };
  console.log('\nfinal request');
  console.log(JSON.stringify(finalRequest, null, 4));
  // callback(null, finalRequest);
  return finalRequest;
};

const convertHeaders = (headers: HeaderBag): CloudFrontHeaders => {
  let transformedHeaders: CloudFrontHeaders = {};
  Object.keys(headers).forEach((key: string) => {
    transformedHeaders[key.toLowerCase()] = [{ value: headers[key] }];
  });
  return transformedHeaders;
};

const createSignedHttpRequest = ({
  // headers,
  hostname,
  // requestid,
  method = 'GET',
  path = '/',
  protocol = 'http:',
  // query,
  service,
  region = 'us-east-1',
}: CreateSignHttpRequestParams): Promise<HttpRequest> => {
  const signerInit = {
    service,
    region,
    sha256: Sha256,
    credentials: defaultProvider(),
  };
  const signer = new SignatureV4(signerInit);

  const httpRequest = new HttpRequest({
    method,
    protocol,
    path,
    headers: {
      host: hostname,
    },
    hostname,
  });

  // console.log('\nhttpRequest');
  // console.log(JSON.stringify(httpRequest, null, 4));

  return signer.sign(httpRequest) as Promise<HttpRequest>;
};

// const sanitize = (data: HeaderBag, whitelist: string[]) => {
//   return whitelist.reduce(
//     (result, key) => (data[key] !== undefined ? Object.assign(result, { [key]: data[key] }) : result),
//     {}
//   );
// };
// const signedHeaders: string[] = 'host;x-amz-cf-id;x-amz-content-sha256;x-amz-date;x-amz-security-token'.split(';');
//   const finalHeaders = sanitize(transformedHeaders, signedHeaders);
//   // const finalHeaders = Object.fromEntries(signedHeaders.map(k => [k, transformedHeaders[k]]));

// const convertToHeaderBag = (headers: any, hostname?: string, requestid?: string): HeaderBag => {
//   let transformedHeaders: HeaderBag = {};
//   Object.keys(headers).forEach((item: any) => {
//     const thing: { key: string; value: string } = headers[item][0];
//     const { key, value } = thing;
//     // key !== 'Host' ? (transformedHeaders[key.toLowerCase()] = value) : console.log('removing Host from headers');
//     transformedHeaders[key.toLowerCase()] = value;
//   });
//   if (requestid) {
//     transformedHeaders['x-amz-cf-id'] = requestid;
//   }
//   if (hostname) {
//     transformedHeaders['host'] = hostname;
//   }
//   return transformedHeaders;
// };
