#!/usr/bin/env node
const fs = require('fs').promises;
const fm = require('front-matter');
const R = require('ramda');

async function get_keywords(src) {
  const content = await fs.readFile(src, 'utf8');
  return {src, keywords: fm(content).attributes.keywords};
}

function filter_keywords(data, keyword) {
  const f = item => item.keywords && item.keywords[0] == keyword;
  const g = item => item.keywords[1];
  const do_filter = R.compose(
      R.replace(/src/g, 'output'), R.join(' '), R.map(R.prop('src')), R.flatten,
      R.values, R.groupBy(g), R.filter(f));
  return do_filter(data);
}

async function do_process(srcs, keyword) {
  const data = await Promise.all(srcs.map(get_keywords));

  let result = srcs;
  if (keyword != '') {
    result = filter_keywords(data, keyword);
  }

  process.stdout.write(`${result}\n`);
}

async function main() {
  const argv = require('yargs')
                   .help()
                   .option('filter', {
                     alias: 'f',
                     describe: 'filter by 1st keyword',
                     type: 'string',
                     default: ''
                   })
                   .demandOption(['filter'], 'Please provide filter')
                   .argv;

  await do_process(argv._, argv.filter);
}

main();
