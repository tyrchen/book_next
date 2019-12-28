#!/usr/bin/env node
const fs = require('fs').promises;
const fm = require('front-matter');

async function extract(src) {
  const content = await fs.readFile(src, 'utf8');
  const title = fm(content).attributes.title;
  return `- [${title}](${src.replace('src/', '').replace('.md', '.html')})`;
}

async function do_process(srcs, dst) {
  const results = await Promise.all(srcs.map(extract));
  const prelude = `---\ntitle: '目录'\n---\n\n# 目录`;
  const content = `${prelude}\n\n${results.join('\n')}\n\n`;
  await fs.writeFile(dst, content);
}

async function main() {
  const argv = require('yargs')
                   .help()
                   .option('output', {alias: 'o', describe: 'output file'})
                   .demandOption(['output'], 'Please provide output file')
                   .argv;

  await do_process(argv._, argv.o);
}

main();
