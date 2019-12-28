#!/usr/bin/env node
const fs = require('fs').promises;
const fm = require('front-matter');
const pinyin = require('chinese-to-pinyin');
const slugify = require('@sindresorhus/slugify');
const R = require('ramda');

async function get_attrs(src) {
  const content = await fs.readFile(src, 'utf8');
  const {title, keywords} = fm(content).attributes;
  const slug = slugify(pinyin(title, {keepRest: true}));
  return {src, title, slug, keywords};
}

function transform(data) {
  const group = item => item.keywords[1];
  const to_toc = item =>
      R.compose(R.join('\n'), R.map(v => `- [${v.title}](#${v.slug})`))(item);
  const do_filter = R.compose(
      R.join('\n\n'),
      R.map(item => `## ${item[0]}\n\n${item[1]}`),
      R.toPairs(),
      R.map(to_toc),
      R.groupBy(group),
  )
  return do_filter(data);
}

async function do_process(srcs, dst) {
  const data = await Promise.all(srcs.map(get_attrs));
  const result = transform(data);
  const prelude = `---\ntitle: '目录'\n---\n\n# 目录`;
  const content = `${prelude}\n\n${result}\n\n`;
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
