import * as MarkdownIt from 'markdown-it';
import * as fsx from 'fs-extra';
import * as path from 'path';
import * as chokidar from 'chokidar';
import {CommandParser} from "./CommandParser";
import {EventEmitter} from "events";

export class Renderer extends EventEmitter {
    private md: MarkdownIt;
    private beforeRendering: Function[];
    private afterRendering: Function[];
    private commandParser: CommandParser;

    constructor() {
        super();
        this.md = new MarkdownIt();
        this.beforeRendering = [];
        this.afterRendering = [];
        this.commandParser = new CommandParser();
        this.configure();
    }

    /**
     * Assign a function that should be used before rendering.
     * @param func
     */
    public useBefore(func: Function) {
        this.beforeRendering.push(func);
    }

    /**
     * Assign a function that shold be applied after rendering.
     * @param func
     */
    public useAfter(func: Function) {
        this.afterRendering.push(func);
    }

    /**
     * Adds a plugin to markdown-it
     * @param mdPlugin
     */
    public addPlugin(mdPlugin: any) {
        this.md.use(mdPlugin);
    }

    /**
     * Applies all before rendering functions, then renders using markdown-it, then applies all after rendering functions.
     * @param filename
     */
    public async render(filename: string) {
        filename = path.resolve(filename);
        let document = await fsx.readFile(filename, 'utf-8');
        document = document.replace(/\r\n/g, '\n');
        for (let func of this.beforeRendering) {
            document = await func(document, filename, this);
        }
        let result: string = this.md.render(document);

        for (let func of this.afterRendering) {
            result = await func(result, filename, this);
        }
        this.emit('rendered', result);
        return result;
    }

    /**
     * Watches for changes.
     * @param filename
     */
    public watch(filename: string) {
        const watcher = chokidar.watch(filename);
        watcher.on('change', async () => {
            console.log('Change detected. Rerendering');
            let start = Date.now();
            this.md = new MarkdownIt();
            await this.render(filename);
            console.log(`Rendering took ${Date.now() - start} ms.`);
        });
        this.on('rendered', () => {
            watcher.add(this.commandParser.projectFiles);
        });
        this.render(filename);
        return watcher;
    }

    /**
     * Default pre and post rendering modules to use.
     */
    private configure() {
        this.useBefore((a: string, b: string, c: Renderer) => this.commandParser.processCommands(a, b, c));
    }
}
