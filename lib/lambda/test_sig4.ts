import { handler } from './sig4style';
import { readFileSync } from 'fs';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { IncomingMessage } from 'http';
import { Context } from 'aws-lambda';

const main = async () => {
  const event_str = readFileSync(`${__dirname}/example-request.json`).toString();
  const event = JSON.parse(event_str);

  // const signedRequest = await handler(event, {callbackWaitsForEmptyEventLoop: true}, {});

  const nodeHttpHandler = new NodeHttpHandler();
  // const { response } = await nodeHttpHandler.handle(signedRequest);

  // const body = await new Promise((resolve, reject) => {
  //   const incomingMessage = response.body as IncomingMessage;
  //   let body = '';
  //   incomingMessage.on('data', chunk => {
  //     body += chunk;
  //   });
  //   incomingMessage.on('end', () => {
  //     console.log('\nbody');
  //     console.log(body);
  //     resolve(body);
  //   });
  //   incomingMessage.on('error', err => {
  //     reject(err);
  //   });
  // });
  // console.log(body);
};

main();
