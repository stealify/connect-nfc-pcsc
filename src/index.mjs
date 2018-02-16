// Loading Config
import importJson from '@stealify/import-json';

let MESSAGE;
const CONFIG = importJson('/etc/connect.json') || importJson('/etc/connect-nfc-pcsc') || {
  data:{
    WEBSOCKET_SERVER_ADDRESS: process.env.WEBSOCKET_SERVER_ADDRESS,
    CHANNEL: process.env.CHANNEL
  },
  path:'ENVIRONMENT'
};

let WEBSOCKET_SERVER_ADDRESS, CHANNEL;
if (CONFIG) {
  MESSAGE = 'Using config '+CONFIG.path;
  WEBSOCKET_SERVER_ADDRESS = CONFIG.data.WEBSOCKET_SERVER_ADDRESS;
  CHANNEL= CONFIG.data.CHANNEL;
} else {
  console.log('Create a config read the README.md');
  process.exit(1);
}

console.log(MESSAGE);
console.log(`Starting at ${WEBSOCKET_SERVER_ADDRESS} on ${CHANNEL}`);

// Rest Code
import makeDebug from 'debug';
import NFC from './NFC';
import Reader, {
  TAG_ISO_14443_3,
  TAG_ISO_14443_4,
  KEY_TYPE_A,
  KEY_TYPE_B,
  CONNECT_MODE_CARD,
  CONNECT_MODE_DIRECT
} from './Reader';
import ACR122Reader from './ACR122Reader';
import {
  UNKNOWN_ERROR,
  FAILURE,
  CARD_NOT_CONNECTED,
  OPERATION_FAILED,
  BaseError,
  TransmitError,
  ControlError,
  ReadError,
  WriteError,
  LoadAuthenticationKeyError,
  AuthenticationError,
  ConnectError,
  DisconnectError,
  GetUIDError
} from './errors';

import io from 'socket.io-client';
const socket = io(WEBSOCKET_SERVER_ADDRESS);

import socketio from '@feathersjs/socketio-client';
const connection = socketio(socket, { timeout: 2000 });

import feathers from '@feathersjs/feathers';
const client = feathers()
  .configure(connection);

const cardService = client.service('cards');


const nfc = new NFC(); // optionally you can pass logger
nfc.on('reader', (reader) => {

  makeDebug('connect-nfc-pcsc')(reader.reader.name, 'device connected');
    
  // needed for reading tags emulated with Android HCE
  // custom AID, change according to your Android for tag emulation
  // see https://developer.android.com/guide/topics/connectivity/nfc/hce.html
  reader.aid = 'F222222222';
  
  reader.on('card', toggleCard);
  
  reader.on('card.off', toggleCard);
  
  reader.on('error', err => {
    makeDebug('connect-nfc-pcsc')(reader.reader.name,'error =>',err);
    process.exit(err);
  });
  
  reader.on('end', () => {    
    makeDebug('connect-nfc-pcsc')(reader.reader.name, 'device disconnected');
  });
  
});
  
nfc.on('error', err => {
  makeDebug('connect-nfc-pcsc')('error =>',err);
  process.exit(err);
});
  
function toggleCard(card) {
  // card is object containing following data
  // [always] String type: TAG_ISO_14443_3 (standard nfc tags like Mifare) or TAG_ISO_14443_4 (Android HCE and others)
  // [always] String standard: same as type
  // [only TAG_ISO_14443_3] String uid: tag uid
  // [only TAG_ISO_14443_4] Buffer data: raw data from select APDU response
  cardService.get(card.uid)
  // Automatic Register the Card for Usage.  
    .then((existingCard)=>{
      if (!existingCard) {
        existingCard = cardService.create(card)
          .then(()=>{
            return cardService.get(card.uid);
          });
      } 
      return existingCard;
    })
  // Update the card to reflect Channel
    .then((existingCard)=>{
      if (existingCard.channel === CHANNEL) {
        existingCard.channel = '';
      } else {
        existingCard.channel = CHANNEL;
      }
      cardService.update(existingCard);
    });
}  





export {
  NFC,
  Reader,
  TAG_ISO_14443_3,
  TAG_ISO_14443_4,
  KEY_TYPE_A,
  KEY_TYPE_B,
  CONNECT_MODE_CARD,
  CONNECT_MODE_DIRECT,
  ACR122Reader,
  UNKNOWN_ERROR,
  FAILURE,
  CARD_NOT_CONNECTED,
  OPERATION_FAILED,
  BaseError,
  TransmitError,
  ControlError,
  ReadError,
  WriteError,
  LoadAuthenticationKeyError,
  AuthenticationError,
  ConnectError,
  DisconnectError,
  GetUIDError
};
