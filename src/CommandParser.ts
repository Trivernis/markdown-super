import * as path from "path";
import * as fsx from "fs-extra";
import {Renderer} from "./Renderer";
import {markdownPlugins} from './plugins';

namespace Matchers {
    export const commandMatcher: RegExp = /\[ *!(\w+) *]: *(.*)/g;
}

export class CommandParser {
    public projectFiles: string[];

    constructor() {
        this.projectFiles = [];
    }

    async processCommands(doc: string, docpath: string, renderer: Renderer) {
        const inputLines: string[] = doc.split('\n');
        let outputLines: string[] = [];
        let mainDir: string = path.dirname(docpath);
        this.projectFiles = [];
        this.projectFiles.push(docpath);

        while (inputLines.length > 0) {
            let inputLine = inputLines.shift();
            let match: RegExpExecArray = Matchers.commandMatcher.exec(inputLine);

            if (match != null && match[0]) {
                switch(match[1]) {
                    case 'use':
                        let plugins = match[2].split(',');
                        for (let mdPlugin of plugins) {
                            this.addMarkdownPlugin(mdPlugin.replace(/^ *| *$/g, ''), renderer);
                        }
                        break;
                    case 'include':
                        try {
                            let included = await this.getInclude(match[2], mainDir);
                            inputLines.unshift(...included);
                        } catch (err) {
                            console.error(err.message);
                            outputLines.push(inputLine);
                        }
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
                if (plugin) {
                    renderer.addPlugin(plugin);
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
}
