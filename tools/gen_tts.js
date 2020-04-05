#!/usr/bin/env node

const existsSync = require('fs').existsSync;
const fs = require('fs').promises;
const fm = require('front-matter');
const path = require('path')
const audioconcat = require('audioconcat');

const { TTS } = require('@tyrchen/xftts');
const env = process.env;
const app = env.APP || '1';
const appId = env[`XF_TTS_ID${app}`];
const apiSecret = env[`XF_TTS_SECRET${app}`];
const apiKey = env[`XF_TTS_KEY${app}`];

console.log(`Using app${app}: id ${appId}`);

async function gen_mp3(text, filename) {
  if (existsSync(filename)) return console.log('already exists: ', filename);

  text = text.replace(/”|「|」|"|_|《|》|>/g, '');
  // console.log(text);
  try {
    const tts = new TTS(appId, apiKey, apiSecret, { vcn: 'x2_xiaoyuan', speed: 70 });
    await tts.generate(text, filename);
    console.log('generated: ', filename);
  } catch (error) {
    console.error(error);
  }
}

async function extract(src) {
  const content = await fs.readFile(src, 'utf8');
  const { body, attributes } = fm(content);
  const data = body
    .replace(/#+/g, '')
    .replace(/!\[[^\]]*\]\([^\)]+\)/g, '')
    .replace(/\s*(\d+)\s*/g, '$1');
  return data.split(/\<!--\s*split\s*--\>/g);
}

async function main() {
  const argv =
    require('yargs')
      .option('input', { alias: 'i', describe: 'input file containing text' })
      .demandOption(['input'], 'Please provide input file')
      .help()
      .argv;

  const outPath = path.join(path.dirname(argv.i), 'assets');
  const outName = path.basename(argv.i).split('-')[0];
  const data = await extract(argv.i);
  const output = path.join(outPath, `${outName}.mp3`);

  if (data.length == 1) {
    await gen_mp3(data[0], output);
    console.error('Audio created in:', output);
    process.exit(0);
  } else {
    let files = [];
    for (const [i, item] of data.entries()) {
      let outFile = path.join(outPath, `${outName}-${i}.mp3`);
      await gen_mp3(item, outFile);
      files.push(outFile);
    }

    setTimeout(() =>
      audioconcat(files)
        .concat(output)
        .on('start', function (command) {
          console.log('ffmpeg process started:', command);

        })
        .on('error', function (err, _stdout, stderr) {
          console.error('Error:', err);
          console.error('ffmpeg stderr:', stderr);
          process.exit(-1);
        })
        .on('end', async function () {
          for (var f of files) {
            await fs.unlink(f);
          }
          console.error('Audio created in:', output);
          process.exit(0);
        })
      , 1000);
  }
}

main()
