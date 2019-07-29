import {Renderer} from "./lib/Renderer";
import {writeFile} from 'fs-extra';
import {extname, dirname} from 'path';
import {ArgumentParser} from "argparse";
import {MarkdownConfig} from "./lib/MarkdownConfig";
import {logger} from "./lib/logger";

/**
 * Returns the filename without the extension.
 * @param file
 */
function noExt(file: string): string {
    return file.replace(extname(file), '');
}

async function main() {
    logger.profile('processing');
    const parser = new ArgumentParser({
        addHelp: true
    });
    parser.addArgument('file',{
        help: 'The file to render'
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
    let args = parser.parseArgs();
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
        await renderer.renderPdf(args.file, outputFile);
        console.log(`File stored as ${outputFile}`);

    } else {

        let outputFile = noExt(args.file) + '.html';
        let html = await renderer.render(args.file);
        await writeFile(outputFile, html);
        console.log(`File stored as ${outputFile}`);
    }
    logger.profile('processing');
}
4
main();
