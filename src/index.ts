import {Renderer} from "./Renderer";
import {writeFile} from 'fs-extra';
import {extname} from 'path';

async function main() {
    const args = process.argv.slice(2);
    let renderer = new Renderer();

    if (args[1] && args[1] === '--watch') {
        renderer.on('rendered', async (html) => {
            await writeFile(args[0].replace(extname(args[0]), '') + '.html', html);
        });
        renderer.watch(args[0]);
    } else {
        let html = await renderer.render(args[0]);
        await writeFile(args[0].replace(extname(args[0]), '') + '.html', html);
    }
}

main()
