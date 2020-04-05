const CryptoJS = require('crypto-js');
const fs = require('fs');
const WebSocketClient = require('websocket').client;

class TTS {
  constructor(appId, apiKey, apiSecret, opts = {} ) {
    this.appId = appId;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.vcn = opts.vcn || 'xiaoyan';
    this.speed = opts.speed || 65;
    this.volume = opts.volume || 60;
  }

  generate(text, filename) {
    const common = { app_id: this.appId };
    // see: https://www.xfyun.cn/doc/tts/online_tts/API.html
    const business = {
      aue: 'lame',
      sfl: 1,
      auf: 'audio/L16;rate=16000',
      vcn: this.vcn,
      speed: this.speed,
      volume: this.volume,
      tte: 'utf8'
    };
    console.log(business);
    const data = {
      status: 2,
      text: CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text))
    };
    const params = JSON.stringify({ common, business, data });
    const client = new WebSocketClient();
    return new Promise((resolve, reject) => {
      client.on('connectFailed', function (error) {
        console.log('Connect Failed: ' + error.toString());
        reject(error);
      });

      client.on('connect', function (connection) {
        console.log('WebSocket client connected');
        connection.send(params);
        connection.on('error', function (error) {
          console.log('Connection Error: ' + error.toString());
          reject(error);
        });
        connection.on('close', function () {
          console.log('Connection Closed');
          // resolve({ code: 0, msg: 'Connection Closed' });
        });
        connection.on('message', async function (message) {
          const res = JSON.parse(message.utf8Data);
          if (res.code != 0) {
            console.log(res.toString());
            return resolve(res);
          }
          const { status, ced, audio } = res.data;
          const buffer = new Buffer(audio, 'base64');
          process.stdout.write(`${ced} `);
          fs.writeFileSync(filename, buffer, {flag: 'a'});
          if (status == 2) {
            return resolve({code: 0, data: {status, fileName: filename}});
          }
        });
      });
      client.connect(this._getConnUrl());
    });
  }

  _getConnUrl() {
    const requestHost = 'tts-api.xfyun.cn';
    const host = 'ws-api.xfyun.cn';
    const url = '/v2/tts';
    const date = new Date().toUTCString();
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${url} HTTP/1.1`;
    console.log(this.apiKey, this.apiSecret);
    const hash = CryptoJS.HmacSHA256(signatureOrigin, this.apiSecret);
    const signature = CryptoJS.enc.Base64.stringify(hash);
    console.log(signatureOrigin, signature);
    const authorizationOrigin = `api_key="${
      this.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${
      signature}"`;
    const authorization = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(authorizationOrigin));
    // console.log(authorization_origin, authorization)
    return `wss://${requestHost}${url}?authorization=${authorization}&date=${
      encodeURI(date)}&host=${host}`;
  }
}

module.exports = { TTS };
