# connect-nfc-pcsc
A @stealify/connect enabled Service using pcsc bindings.

## Install

```bash
npm install -g @stealify/connect-nfc-pcsc
systemctl status connect-nfc-pcsc
```
## Config
- /etc/connect.json
- /etc/connect-nfc-pcsc.json
- Environment WEBSOCKET_SERVER_ADDRESS=http://server.url:port CHANNEL=test ..

Built-in support for auto-reading **card UIDs** and reading tags emulated with [**Android HCE**](https://developer.android.com/guide/topics/connectivity/nfc/hce.html).

> **NOTE:** Reading tag UID and methods for writing and reading tag content **depend on NFC reader commands support**.
It is tested to work with **ACR122 USB reader** but it should work with **all PC/SC compliant devices**.  
When detecting tags does not work see [Alternative usage](#alternative-usage).

This library uses pscslite native bindings [pokusew/node-pcsclite](https://github.com/pokusew/node-pcsclite) under the hood.
[pokusew/nfc-pcsc](https://github.com/pokusew/nfc-pcsc)