import * as path from "path";
import * as fsx from "fs-extra";
import {Renderer} from "./Renderer";
import {markdownPlugins} from './plugins';
import {pageFormats} from "./formats";
import {PDFFormat} from "puppeteer";

export class CommandParser {
    public projectFiles: string[];
    public pageFormat: PDFFormat;
    public loadedPlugins: string[];
    public stylesheets: string[];

    private resolvePath: {path: string, lines: number}[];

    constructor() {
        this.projectFiles = [];
        this.loadedPlugins = [];
        this.resolvePath = [];
        this.stylesheets = [];
    }

    async processCommands(doc: string, docpath: string, renderer: Renderer) {
        if (process.platform === 'darwin') {
            doc = doc.replace(/\r/g, '\n'); // mac uses \r as linebreak
        } else {
            doc = doc.replace(/\r/g, '');   // linux uses \n, windows \r\n
        }
        const inputLines: string[] = doc.split('\n');
        let outputLines: string[] = [];
        let mainDir: string = path.dirname(docpath);
        this.projectFiles = [];
        this.projectFiles.push(docpath);
        this.resolvePath.push({path: docpath, lines: inputLines.length});

        while (inputLines.length > 0) {
            let inputLine = inputLines.shift();
            let currentFile = this.resolvePath[this.resolvePath.length - 1]; // keeping track of the current file
            if (currentFile.lines > 0) {
                currentFile.lines--;
            } else {
                while (currentFile.lines === 0 && this.resolvePath.length > 0) {
                    this.resolvePath.pop();
                    currentFile = this.resolvePath[this.resolvePath.length - 1];
                }
            }
            let match: RegExpExecArray = /\[ *!(\w+) *\]:? *(.*)/gu.exec(inputLine.replace(/\s/, ''));

            if (match && match[0]) { // TODO: stylesheets
                switch(match[1]) {
                    case 'use':
                        let plugins = match[2].split(',');
                        console.log(`Using plugins: ${match[2]}`);
                        for (let mdPlugin of plugins) {
                            this.addMarkdownPlugin(mdPlugin.replace(/^ *| *$/g, ''), renderer);
                        }
                        break;
                    case 'include':
                        try {
                            if (!this.resolvePath.find(x => x.path === match[2])) { // if the include is in the path, it is a circular reference
                                let included = await this.getInclude(match[2], mainDir);
                                inputLines.unshift(...included);
                                this.resolvePath.push({path: match[2], lines: included.length});
                            } else {
                                console.error(`Circular reference detected. Skipping include ${match[2]}`);
                            }
                        } catch (err) {
                            console.error(err.message);
                            outputLines.push(inputLine);
                        }
                        break;
                    case 'format':
                        if (!this.pageFormat && Object.values(pageFormats).includes(match[2]))
                            // @ts-ignore
                            this.pageFormat = match[2];
                        else
                            console.log('Invalid page format or format already set: ' + match[2]);
                        break;
                    case 'newpage':
                        if (!this.loadedPlugins.includes(markdownPlugins.div))
                            this.addMarkdownPlugin('div', renderer);
                        outputLines.push('::: .newpage \n:::');
                        break;
                    case 'stylesheet':
                        await this.addStylesheet(match[2], mainDir);
                        break;
                    default:
                        outputLines.push(inputLine);
                }
            } else {
                outputLines.push(inputLine);
            }
        }

        return outputLines.join('\n');
    }

    /**
     * Adds a markdown-it plugin to the renderer
     * @param pluginName
     * @param renderer
     */
    private addMarkdownPlugin(pluginName: string, renderer: Renderer): void {
        try {
            // @ts-ignore
            let moduleName = markdownPlugins[pluginName];
            if (moduleName) {
                let plugin: any = require(moduleName);
                if (plugin && !this.loadedPlugins.includes(plugin)) {
                    renderer.addPlugin(plugin);
                    this.loadedPlugins.push(plugin);
                }
            } else {
                console.error(`Plugin "${pluginName}" not found.`);
            }
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Imports a file into the markdown.
     * @param filepath
     * @param mainDir
     */
    private async getInclude(filepath: string, mainDir: string): Promise<string[]> {
        let importPath: string;

        if (path.isAbsolute(filepath)) {
            importPath = filepath;
        } else {
            importPath = path.join(mainDir, filepath);
        }
        this.projectFiles.push(importPath);
        if ((await fsx.pathExists(importPath))) {
            let importDoc = await fsx.readFile(importPath, 'utf-8');
            importDoc = importDoc.replace(/\r\n/g, '\n');
            return importDoc.split('\n');
        } else {
            throw new Error(`The file ${filepath} can not be included (not found).`);
        }
    }

    /**
     * Adds a stylesheet to the result markdown.
     * @param filepath
     * @param mainDir
     */
    private async addStylesheet(filepath: string, mainDir: string) {
        let stylepath: string;
        if (path.isAbsolute(filepath)) {
            stylepath = path.normalize(filepath);
        } else {
            stylepath = path.join(mainDir, filepath);
        }
        if ((await fsx.pathExists(stylepath)))
            this.stylesheets.push(stylepath);
    }
}
