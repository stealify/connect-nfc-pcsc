const cluster = require('cluster');
//const util = require('util');
const makeDebug = require('debug');
const config = require('./config');

const WEBSOCKET_SERVER_ADDRESS = config.server;
const io = require('socket.io-client');
const socket = io(WEBSOCKET_SERVER_ADDRESS);

const feathers = require('feathers-client');
const socketio = require('feathers-socketio/client');

//,  {  transports: ['websocket'] }

const feathersClient = feathers()
  .configure(socketio(socket, { timeout: 2000 }));
  //.configure(hooks())

var nfcStatusService = feathersClient.service('nfcStatus');

var MESSAGE = {
  status: 'reader-ready',
  tag: false,
  date: new Date().toISOString(),
  from: 'cardreader-master'
};

function createStatus({from,tag,error}) {
  var STATUS = { date: new Date().toISOString(), status: false, tag, from};
  if (!!error && !!error.stack) {
    if(error.stack.split('\n')[0].indexOf('unable open NFC')> -1) {
      STATUS.error = {};
      STATUS.error.stack = error.stack.split('\n');
      STATUS.error.name = 'CAN_NOT_OPEN';
    } else {
      STATUS.error = error;
    }
    STATUS.status = false;
    STATUS.tag = false;
  } else if (tag !== false) {
    STATUS.status = 'inserted';
    STATUS.tag = tag;
  }
  makeDebug('DRIVER::NFC::STATUS')(STATUS);
  return STATUS;
}


function logCreate(MSG) {
  makeDebug('DRIVER::NFC::STATUS::CHANGE')(MSG);
  return nfcStatusService.create(MSG);
}


//TODO: Write algorithm to Compact Messages if they are Same By Hour?
function applyHandler(){
  for (const id in cluster.workers) {
    cluster.workers[id].on('message', function messageHandler(msg) {
      makeDebug('DRIVER::NFC::ALL')(msg.msg);
      if (msg.cmd && msg.cmd === 'EVENT') {
        var MSG = msg.msg;
        //socket.emit('nfcTag',msg.tag.buffer)
        makeDebug('DRIVER::NFC')(MESSAGE);
        // When MESSAGE is not Updated
        if (MESSAGE.from !== MSG.from || MESSAGE.status !== MSG.status ) {
          logCreate(MSG);
        }
        MESSAGE = MSG;
      }
    });
  }
}

//TODO: Write Function to check for the no Card Error and ignore that but post other errors
if(cluster.isMaster) {
  cluster.on('exit', function(worker, code, signal) {
    makeDebug('CLUSTER')('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
    //setTimeout(()=>
    cluster.fork();
    //,5000)
    applyHandler();
  });

  cluster.fork();
  logCreate(MESSAGE);

} else {
  const nfc = require('nfc').nfc;
  const device = new nfc.NFC();
  var STATUS;
  try {
    device.on('read', function(tag) {
    // { deviceID: '...', name: '...', uid: '...', type: 0x04 (Mifare Classic) or 0x44 (Mifare Ultralight) }
      if ((!!tag.data) && (!!tag.offset)) {
        // Scheduling the Reads because they happen in 100 MS or Faster
        //debug(util.inspect(nfc.parse(tag.data.slice(tag.offset)), { depth: null }));
        //debug(tag);
        // TODO: Verify time on server and client
        STATUS={ cmd: 'EVENT', msg: createStatus({tag: tag, from: 'cardreader-worker' })};
        process.send(STATUS);
      } else {

      }
    })
      .on('error', function(err) {
      // handle background error;
        STATUS={ cmd: 'EVENT', msg: createStatus({ from: 'cardreader-worker-error', error: err})};
        process.send(STATUS);
        throw err;

      })
      .start();
  } catch(e) {
    STATUS = { cmd: 'EVENT', msg: createStatus({ from: 'cardreader-worker-exit', error: e })};

    //var STATUS = { cmd: 'EVENT', msg: createStatus({tag: { buffer: new Buffer(10) }, from: 'cardreader-worker' })};
    //console.log(STATUS);
    process.send(STATUS);
    process.exit(0);
  }
  // optionally the start function may include the deviceID (e.g., 'pn53x_usb:160:012')
}
