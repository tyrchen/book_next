#!/usr/bin/env node
const fs = require("fs").promises;
const path = require("path");

const pipes = [replaceImage];

async function process(src, dst) {
  const content = await fs.readFile(src, "utf8");
  const result = pipes.reduce(
    (acc, fn) => fn.call(null, acc, { filename: src }),
    content
  );
  await fs.writeFile(dst, result);
}

function replaceImage(content, context) {
  const dir = path.dirname(context.filename).replace("src/", "");
  return content.replace(/assets\//g, `${dir}/assets/`);
}

function addPageBreak(content, _context) {
  return `${content}\n\\newpage\n`;
}

async function main() {
  const argv = require("yargs")
    .option("input", {
      alias: "i",
      describe: "input file"
    })
    .option("output", {
      alias: "o",
      describe: "output file"
    })
    .demandOption(
      ["input", "output"],
      "Please provide both input and output files"
    )
    .help().argv;

  await process(argv.i, argv.o);
}

main();
