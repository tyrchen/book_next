#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const pipes = [replaceImage, addPageBreak];

async function process(src, dst) {
  console.log(`process ${src}`);
  const content = await fs.readFile(src, 'utf8');
  const result = pipes.reduce((acc, fn) => fn.call(null, acc, { filename: src }), content);
  await fs.writeFile(dst, result);
}

function replaceImage(content, context) {
  const dir = path.dirname(context.filename).replace('src/', '');
  return content.replace('assets/', `${dir}/assets/`);
}

function addPageBreak(content, _context) {
  return `${content}\\newpage`;
}

async function main() {
  const argv = require('yargs')
    .option('input', {
      alias: 'i',
      describe: 'input file'
    })
    .option('output', {
      alias: 'o',
      describe: 'output file'
    })
    .demandOption(['input', 'output'], 'Please provide both input and output files')
    .help().argv;

  await process(argv.i, argv.o);
}

main();
