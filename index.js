//const io = require('socket.io-client/dist/socket.io.js');
const WEBSOCKET_SERVER_ADDRESS = 'http://master.peep:3000'
const io = require('socket.io-client');
const wsClient = io(WEBSOCKET_SERVER_ADDRESS);
const debug = require('debug')('NFC_DRIVER:')

wsClient.on('connect', function(){
  console.log(new Date(),'nfcDriver: successful Connected to:', WEBSOCKET_SERVER_ADDRESS)
});

wsClient.on('disconnect', function(){
  console.log(new Date(),'nfcDriver: Disconnected from:', WEBSOCKET_SERVER_ADDRESS)
});

const nfc = require('nfc').nfc
const util = require('util');
const device = new nfc.NFC();

var HOW_OFTEN_READED = 0
var SCHEDULE_EMIT_BY_READS = 10

try {
  device.on('read', function(tag) {
    // { deviceID: '...', name: '...', uid: '...', type: 0x04 (Mifare Classic) or 0x44 (Mifare Ultralight) }
    if ((!!tag.data) && (!!tag.offset)) {
        // Scheduling the Reads because they happen in 100 MS or Faster
        if (HOW_OFTEN_READED >= SCHEDULE_EMIT_BY_READS) {
          console.log(util.inspect(nfc.parse(tag.data.slice(tag.offset)), { depth: null }));
          console.log(new Date(),tag)
          HOW_OFTEN_READED = 0
          // TODO: Verify time on server and client
          wsClient.emit('nfcTag',tag.uid)
        } else {
          HOW_OFTEN_READED++
        }
    } else {
      HOW_OFTEN_READED = 0
    }
  })
  .on('error', function(err) {
      // handle background error;
      console.error(new Date(),err)
      wsClient.emit('nfcError',err)
  })
  .start(); // optionally the start function may include the deviceID (e.g., 'pn53x_usb:160:012')
} catch(e) {
  wsClient.emit('nfcError',e)
  console.error(new Date(),e)
}
