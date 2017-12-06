'use strict';
//https://github.com/direktspeed/nfc-pcsc

const makeDebug = require('debug');
const config = require('./config');

const WEBSOCKET_SERVER_ADDRESS = config.server;
const io = require('socket.io-client');
const socket = io(WEBSOCKET_SERVER_ADDRESS);

const feathers = require('feathers-client');
const socketio = require('feathers-socketio/client');

//,  {  transports: ['websocket'] }
socket.on('connect',()=>socket.emit('channel',config.channel));

const feathersClient = feathers()
  .configure(socketio(socket, { timeout: 2000 }));
  //.configure(hooks())

var nfcService = feathersClient.service('cardreaders');


// #############
// Basic usage
// - see "Basic usage" section in README for an explanation
// #############

// without Babel in ES2015
const { NFC } = require('./dist/index');

const nfc = new NFC(); // optionally you can pass logger

var MSG;

function makeMsg({from,status,card}) {
  MSG = {
    channel: config.channel,
    status,
    card,
    date: new Date().toISOString(),
    from
  };
  makeDebug('DRIVER::NFC::'+MSG.from+'::error')(MSG);
  nfcService.create(MSG);
}



nfc.on('reader', reader => {

  //console.log(`${reader.reader.name}  device attached`);
  MSG = {
    status: 'device::attached',
    from: reader.reader.name
  };
  makeMsg(MSG);
  // needed for reading tags emulated with Android HCE
  // custom AID, change according to your Android for tag emulation
  // see https://developer.android.com/guide/topics/connectivity/nfc/hce.html
  reader.aid = 'F222222222';

  reader.on('card', card => {
    // card is object containing following data
    // [always] String type: TAG_ISO_14443_3 (standard nfc tags like Mifare) or TAG_ISO_14443_4 (Android HCE and others)
    // [always] String standard: same as type
    // [only TAG_ISO_14443_3] String uid: tag uid
    // [only TAG_ISO_14443_4] Buffer data: raw data from select APDU response
    MSG = { status: 'inserted', card, from: reader.reader.name  };
    makeMsg(MSG);
  });

  reader.on('card.off', (card) => {
    //console.log(`${reader.reader.name}  card removed`, card);
    MSG = { status: 'removed', card: card, from: reader.reader.name  };
    makeMsg(MSG);
  });

  reader.on('error', err => {
    makeDebug(`DRIVER::NFC::${reader.reader.name}::error`)(err);
  });

  reader.on('end', () => {
    MSG = { status: 'device::removed',from: reader.reader.name };
    makeMsg(MSG);
  });

});

nfc.on('error', err => {
  makeDebug('DRIVER::NFC::error')(err);
});
