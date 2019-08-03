#!/usr/bin/env node
import {Renderer} from "./lib/Renderer";
import {writeFile} from 'fs-extra';
import {extname, dirname} from 'path';
import {ArgumentParser} from "argparse";
import {MarkdownConfig} from "./lib/MarkdownConfig";
import {logger} from "./lib/logger";
import {markdownPlugins} from "./lib/plugins";

/**
 * Returns the filename without the extension.
 * @param file
 */
function noExt(file: string): string {
    return file.replace(extname(file), '');
}

async function main() {
    let start = process.hrtime();
    const parser = new ArgumentParser({
        addHelp: true
    });
    parser.addArgument('file',{
        help: 'The file to render',
        required: false
    });
    parser.addArgument(
        ['-w', '--watch'],
        {
            help: 'Watch files for changes',
            required: false,
            action: 'storeTrue'
        }
    );
    parser.addArgument(
        ['--pdf'],
        {
            help: 'Output as pdf',
            required: false,
            action: 'storeTrue'
        }
    );
    parser.addArgument(
        ['--bundle'],
        {
            help: 'bundles the html to a standalone file',
            required: false,
            action: 'storeTrue'
        }
    );
    parser.addArgument(
        ['--plugins'],
        {
            help: 'prints out the plugins, that can be used.',
            required: false,
            action: 'storeTrue'
        }
    );
    let args = parser.parseArgs();

    if (args.plugins) {
        console.log('Plugin Name      |  Markdown-it plugin');
        console.log('-----------------|---------------------');
        console.log(Object.entries(markdownPlugins).map((x:any) => x[0]
            .padEnd(16, ' ') + ' | ' + x[1].module).join('\n'));
        process.exit(0);
    }

    let config = new MarkdownConfig(dirname(args.file));
    config.bundle = args.bundle || args.pdf;
    let renderer = new Renderer(config);

    if (args.watch) {

        let outputFile = noExt(args.file) + '.html';
        renderer.on('rendered', async (html) => {
            await writeFile(outputFile, html);
            console.log(`File stored as ${outputFile}`);
        });
        renderer.watch(args.file);

    } else if (args.pdf) {

        let outputFile = noExt(args.file) + '.pdf';
        try {
            await renderer.renderPdf(args.file, outputFile);
            console.log(`File stored as ${outputFile}`);
        } catch (err) {
            logger.error(err);
            console.error('Failed to render pdf.');
        }

    } else {

        let outputFile = noExt(args.file) + '.html';
        let html = await renderer.render(args.file);
        await writeFile(outputFile, html);
        console.log(`File stored as ${outputFile}`);
    }
    let diff = process.hrtime(start);
    logger.info(`Total:  ${(diff[0]*1e9 + diff[1])/1e6} ms`);
}
4
main();
