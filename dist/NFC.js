"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _pcsclite = _interopRequireDefault(require("@pokusew/pcsclite"));

var _events = _interopRequireDefault(require("events"));

var _Reader = _interopRequireDefault(require("./Reader"));

var _ACR122Reader = _interopRequireDefault(require("./ACR122Reader"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class NFC extends _events.default {
  constructor(logger) {
    super();
    this.pcsc = (0, _pcsclite.default)();

    if (logger) {
      this.logger = logger;
    } else {
      this.logger = {
        log: function () {},
        debug: function () {},
        info: function () {},
        warn: function () {},
        error: function () {}
      };
    }

    this.pcsc.on('reader', reader => {
      this.logger.info('New reader detected', reader.name); // create special object for ARC122U reader with commands specific to this reader

      if (reader.name.toLowerCase().indexOf('acr122') !== -1) {
        const device = new _ACR122Reader.default(reader, this.logger);
        this.emit('reader', device);
        return;
      }

      const device = new _Reader.default(reader, this.logger);
      this.emit('reader', device);
    });
    this.pcsc.on('error', err => {
      this.logger.info('PCSC error', err.message);
      this.emit('error', err);
    });
  }

  close() {
    this.pcsc.close();
  }

}

var _default = NFC;
exports.default = _default;