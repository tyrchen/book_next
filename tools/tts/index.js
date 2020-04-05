const CryptoJS = require('crypto-js');
const fs = require('fs');
const WebSocketClient = require('websocket').client;
const lame = require('lame');

const tts = (app_id, api_key, apiSecret, text, fileName, vcn = 'xiaoyan') => {
  const requestHost = 'tts-api.xfyun.cn';
  const host = 'ws-api.xfyun.cn';
  const url = '/v2/tts';
  const date = new Date().toUTCString();
  const signature_origin = `host: ${host}\ndate: ${date}\nGET ${url} HTTP/1.1`;
  console.log(api_key, apiSecret);
  const hash = CryptoJS.HmacSHA256(signature_origin, apiSecret);
  const signature = CryptoJS.enc.Base64.stringify(hash);
  console.log(signature_origin, signature);
  const authorization_origin = `api_key="${
      api_key}", algorithm="hmac-sha256", headers="host date request-line", signature="${
      signature}"`;
  const authorization = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(authorization_origin));
  // console.log(authorization_origin, authorization)
  const wss = `wss://${requestHost}${url}?authorization=${authorization}&date=${
      encodeURI(date)}&host=${host}`;
  // 注意⚠️ 需要设置公网IP白名单
  let fileInit = true;
  const pcmFile = `${fileName}`;
  const common = {app_id};
  const business = {
    aue: 'lame',
    sfl: 1,
    auf: 'audio/L16;rate=16000',
    vcn,
    speed: 65,
    volume: 50,
    // bgs: 1,//合成音频的背景音 0/1
    tte: 'utf8'
  };
  const data = {
    status: 2,
    text: CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text))
  };
  const params = JSON.stringify({common, business, data});
  const client = new WebSocketClient();
  return new Promise((resolve, reject) => {
    client.on('connectFailed', function(error) {
      console.log('Connect Error: ' + error.toString());
      reject(error);
    });

    client.on('connect', function(connection) {
      console.log('WebSocket client connected');
      connection.send(params);
      connection.on('error', function(error) {
        console.log('Connection Error: ' + error.toString());
        reject(error);
      });
      connection.on('close', function() {
        console.log('Connection Closed');
        resolve({code: 0, msg: 'Connection Closed'});
      });
      connection.on('message', function(message) {
        const res = JSON.parse(message.utf8Data);
        if (res.code != 0) {
          console.log(res.toString());
          return resolve(res);
        }
        const {status, ced} = res.data;
        // base64 => buffer
        const buffer = new Buffer(res.data.audio, 'base64');
        // 需要添加完成标志，否则会一直追加
        fs.writeFile(pcmFile, buffer, {flag: fileInit ? 'w' : 'a'}, err => {
          fileInit = res.data.status == 2;
          if (err) {
            throw err;
          }
          console.log(status, ced, fileInit);
          if (fileInit) {
            resolve({code: 0, data: {status, pcmFile, fileName}});
            // pcm2mp3(pcmFile, fileName);
          }
        });
      });
    });
    client.connect(wss);
  });
};


const pcm2mp3 = (pcmFile, fileName) => {
  // create the Encoder instance
  var encoder = new lame.Encoder({
    // input
    channels: 1,        // 2 channels (left and right)
    bitDepth: 16,       // 16-bit samples
    sampleRate: 16000,  // 44,100 Hz sample rate

    // output
    bitRate: 128,
    outSampleRate: 16000,
    mode: lame.STEREO  // STEREO (default), JOINTSTEREO, DUALCHANNEL or MONO
  });

  fs.createReadStream(pcmFile)
      .pipe(encoder)
      .pipe(fs.createWriteStream(fileName))
      .on('close', function() {
        console.error('done!');
        fs.unlink(pcmFile, function(error) {
          if (error) {
            console.log(error);
            return false;
          }
          console.log('删除文件成功');
        });
      });
};

module.exports = {tts};
