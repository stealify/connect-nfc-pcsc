//https://github.com/stealify/connect-nfc-pcsc
const WEBSOCKET_SERVER_ADDRESS = process.env.WEBSOCKET_SERVER_ADDRESS;
const CHANNEL = process.env.channel;

import io from 'socket.io-client';
const socket = io(WEBSOCKET_SERVER_ADDRESS);
import socketio from '@feathersjs/socketio-client';
const connection = socketio(socket, { timeout: 2000 });

import feathers from '@feathersjs/feathers';
const client = feathers()
  .configure(connection);

const cardService = client.service('cards');

import { CONNECT } from './dist/index';
const nfc = CONNECT(cardService,CHANNEL);

export default nfc;