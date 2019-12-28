#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const fm = require('front-matter');
const pinyin = require('chinese-to-pinyin');
const slugify = require('@sindresorhus/slugify');

async function extract_url(src) {
  const content = await fs.readFile(src, 'utf8');
  const title = fm(content).attributes.title;
  return `- [${title}](${src.replace('src/', '').replace('.md', '.html')})`;
}

async function extract_id(src) {
  const content = await fs.readFile(src, 'utf8');
  const title = fm(content).attributes.title;
  const slug = slugify(pinyin(title, {keepRest: true}));

  return `- [${title}](#${slug})`;
}

async function process(srcs, dst, toc) {
  let extract = extract_url;
  if (toc) {
    extract = extract_id;
  }
  const results = await Promise.all(srcs.map(extract));
  const prelude = `---\ntitle: '目录'\n---\n\n# 目录`;
  const content = `${prelude}\n\n${results.join('\n')}\n\n`;
  await fs.writeFile(dst, content);
}

async function main() {
  const argv =
      require('yargs')
          .help()
          .option('output', {alias: 'o', describe: 'output file'})
          .option(
              'toc',
              {describe: 'generate TOC', type: 'boolean', default: false})
          .demandOption(['output'], 'Please provide output file')
          .argv;

  await process(argv._, argv.o, argv.toc);
}

main();
