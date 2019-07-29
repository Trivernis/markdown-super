import * as MarkdownIt from 'markdown-it';
import * as fsx from 'fs-extra';
import * as path from 'path';
import * as chokidar from 'chokidar';
import * as puppeteer from 'puppeteer';
import {JSDOM} from 'jsdom';
import {CommandParser} from "./CommandParser";
import {EventEmitter} from "events";
import {PDFFormat} from "puppeteer";
import {MarkdownConfig} from "./MarkdownConfig";
import {bundleImages, delay, includeMathJax} from "./utils";
import {logger} from "./logger";

export class Renderer extends EventEmitter {
    private md: MarkdownIt;
    private readonly beforeRendering: Function[];
    private readonly afterRendering: Function[];
    private commandParser: CommandParser;
    private config: MarkdownConfig;

    constructor(config?: MarkdownConfig) {
        super();
        this.config = config || new MarkdownConfig();
        this.md = new MarkdownIt();
        this.beforeRendering = [];
        this.afterRendering = [];
        this.commandParser = new CommandParser();
        this.configure();
    }

    /**
     * Returns the current config.
     */
    public get mdConfig() {
        return this.config;
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
        this.config.plugins.add(mdPlugin);
    }

    /**
     * Adds a stylesheet to the config.
     * The stylesheets will be included after the md-it render.
     * @param filepath
     */
    public addStylesheet(filepath: string) {
        this.config.stylesheets.add(filepath)
    }

    /**
     * Applies all before rendering functions, then renders using markdown-it, then applies all after rendering functions.
     * @param filename
     */
    public async render(filename: string) {
        filename = path.resolve(filename);
        let document = await fsx.readFile(filename, 'utf-8');
        document = document.replace(/\r\n/g, '\n');
        logger.verbose(`Applying ${this.beforeRendering.length} beforeRendering functions...`);
        for (let func of this.beforeRendering) {
            document = await func(document, filename, this);
        }
        this.addConfigPlugins();
        logger.verbose(`Rendering with markdown-it and ${this.config.plugins.size} plugins`);
        let result: string = this.md.render(document);

        logger.verbose(`Applying ${this.afterRendering.length} afterRendering functions...`);
        for (let func of this.afterRendering) {
            result = await func(result, filename, this);
        }
        logger.verbose('HTML rendered');
        this.emit('rendered', result);
        return result;
    }

    /**
     * Renders the file to pdf by rendering the html and printing it to pdf with puppeteer
     * @param filename
     * @param output
     * @param format
     */
    public async renderPdf(filename: string, output: string, format: PDFFormat = 'A4') {
        let html = await this.render(filename);
        if (this.commandParser.pageFormat)
            format = this.commandParser.pageFormat;
        logger.info('Launching puppeteer');
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        logger.info('Setting and evaluating content');
        await page.setContent(html);
        await page.waitForFunction('window.MathJax.isReady === true');
        await delay(1000);
        logger.info(`Starting PDF export (format: ${format}) to ${output}`);
        await page.pdf({
            path: output,
            format: format,
            printBackground: true,
            margin: {
                top: '1.5cm',
                bottom: '1.5cm',
                left: '1.5cm',
                right: '1.5cm'
            }
        });
        await browser.close();
    }

    /**
     * Watches for changes.
     * @param filename
     */
    public watch(filename: string) {
        const watcher = chokidar.watch(filename);
        watcher.on('change', async () => {
            logger.info('Change detected. Rerendering');
            let start = Date.now();
            this.md = new MarkdownIt();
            await this.render(filename);
            logger.info(`Rendering took ${Date.now() - start} ms.`);
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
        this.useAfter((doc: string) => new JSDOM(doc));
        // include default style
        this.useAfter(async (dom: JSDOM) => {
            logger.debug('Including default style');
            let stylePath = path.join(__dirname, '../styles/default.css');
            let document = dom.window.document;

            if (this.config.bundle) {
                let styleTag = document.createElement('style');
                styleTag.innerHTML = await fsx.readFile(stylePath, 'utf-8');
                document.head.appendChild(styleTag);
            } else {
                let linkTag = document.createElement('link');
                linkTag.rel = 'stylesheet';
                linkTag.href = stylePath;
                document.head.appendChild(linkTag);
            }
            return dom;
        });
        // include user defined styles
        this.useAfter(async (dom: JSDOM) => {
            logger.debug(`Including ${this.config.stylesheets.size} user styles.`);
            let userStyles = dom.window.document.createElement('style');
            userStyles.setAttribute('id', 'user-style');
            for (let stylesheet of this.config.stylesheets) {
                logger.debug(`Including ${stylesheet}`);
                userStyles.innerHTML  += await fsx.readFile(stylesheet, 'utf-8');
            }
            dom.window.document.head.appendChild(userStyles);
            return dom;
        });
        this.useAfter(includeMathJax);
        // include all images as base64
        if (this.config.bundle)
            this.useAfter(bundleImages);
        this.useAfter((dom: JSDOM) => dom.serialize());
    }

    /**
     * Adds all plugins from the config to markdown-it.
     */
    private addConfigPlugins() {
        for (let plugin of this.config.plugins) {
            try {
                this.md.use(plugin);
            } catch (err) {
                logger.error(err);
            }
        }
    }
}
