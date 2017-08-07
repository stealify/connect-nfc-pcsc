//const io = require('socket.io-client/dist/socket.io.js');

const cluster = require('cluster');
const util = require('util');
const debug = require('debug')('DRIVER::NFC::')

if(cluster.isMaster) {
  const WEBSOCKET_SERVER_ADDRESS = 'http://master.peep:3030'
  const io = require('socket.io-client');
  const socket = io(WEBSOCKET_SERVER_ADDRESS);

  var NFC_MESSAGE
  var HOW_OFTEN_READED = 0
  var SCHEDULE_EMIT_BY_READS = 10

  function messageHandler(msg) {
    if (msg.cmd && msg.cmd === 'NFC_INSERTED' && !!msg.tag) {
      //socket.emit('nfcTag',msg.tag.buffer)
     debug('NFC_IN:', msg.tag)
   } else {
     debug('NFC_OUT:', msg.tag)
   }
    // When NFC_MESSAGE is not Updated
    if (NFC_MESSAGE !== msg.tag) {
      NFC_MESSAGE = msg.tag
      debug('SET NFC_MESSAGE:', msg.tag)
      socket.emit(msg.cmd,{ from: 'cardreader-acr122u', tag: msg.tag })
      //console.log('ALLAH', msg)
    }
  }

  function applyHandler(){
    for (const id in cluster.workers) {
      cluster.workers[id].on('message', messageHandler);
    }
  }

  socket.on('connect', ()=>{
    debug(' nfcDriver: successful Connected to:', WEBSOCKET_SERVER_ADDRESS + ' '+new Date())
    // Log Connected to Server
    socket.emit('NFC_INSERTED',NFC_MESSAGE)
  });

  socket.on('TEST',()=>{
    NFC_MESSAGE = { from: 'cardreader-acr122u-test', CLIENT_IP: '192.168.0.33', tag: { buffer: new Buffer('HAHAHA') } };
    socket.emit('NFC_INSERTED',NFC_MESSAGE)
  })

  socket.on('NFC_STATUS',()=>{
    socket.emit('NFC_INSERTED',NFC_MESSAGE)
  })

  socket.on('disconnect', function(){
    debug(new Date(),'nfcDriver: Disconnected from:', WEBSOCKET_SERVER_ADDRESS)
    // Log Connected to Server
  });

  cluster.on('online', function(worker) {
    //console.log('Worker ' + worker.process.pid + ' is online');
  });

  cluster.on('exit', function(worker, code, signal) {
      //console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
      //console.log('Starting a new worker');
      //setTimeout(()=>
      cluster.fork()
      //,5000)
      applyHandler()
  });
  cluster.fork();
  // NFC messageHandler



} else {
  const nfc = require('nfc').nfc
  const device = new nfc.NFC();

  try {
  device.on('read', function(tag) {
    // { deviceID: '...', name: '...', uid: '...', type: 0x04 (Mifare Classic) or 0x44 (Mifare Ultralight) }
    if ((!!tag.data) && (!!tag.offset)) {
        // Scheduling the Reads because they happen in 100 MS or Faster
          debug(util.inspect(nfc.parse(tag.data.slice(tag.offset)), { depth: null }));
          debug(new Date(),tag)
          // TODO: Verify time on server and client
          process.send({ cmd: 'NFC_INSERTED', tag });
    }
  })
  .on('error', function(err) {
      // handle background error;
      process.send({ cmd: 'NFC_INSERTED', tag: false });
      throw err;
      //console.error(new Date(),err)
      //socket.emit('nfcError',err)
  })
  .start();
} catch(e) {
   process.send({ cmd: 'NFC_INSERTED', tag: false });
   process.exit(0)
  }
   // optionally the start function may include the deviceID (e.g., 'pn53x_usb:160:012')
  //socket.emit('nfcError',e)
  //console.error(new Date(),e)
}
