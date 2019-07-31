import * as path from "path";
import * as fsx from "fs-extra";
import {Renderer} from "./Renderer";
import {markdownPlugins} from './plugins';
import {pageFormats} from "./formats";
import {PDFFormat} from "puppeteer";
import {getMarkdownPlugin} from "./utils";
import {logger} from "./logger";
import {globalVariables} from "./globvars";

export class PreFormatter {
    public projectFiles: string[];
    public pageFormat: PDFFormat;
    public stylesheets: string[];
    public variables: any;

    private readonly resolvePath: {path: string, lines: number}[];

    constructor() {
        this.projectFiles = [];
        this.resolvePath = [];
        this.stylesheets = [];
        this.variables = Object.assign({}, globalVariables);
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
            let commandMatch: RegExpExecArray = /\[ *!(\w+) *\]:? *(.*)/g.exec(inputLine);
            let variableMatch: RegExpExecArray = /\$(\w+) *= *(.*?) *$/g.exec(inputLine);

            if (commandMatch && commandMatch[0]) {
                switch(commandMatch[1]) {
                    case 'use':
                        let plugins = commandMatch[2].split(',');
                        logger.verbose(`Adding plugins: ${commandMatch[2]}`);
                        for (let mdPlugin of plugins) {
                            renderer.addPlugin(getMarkdownPlugin(mdPlugin.replace(/^ *| *$/g, '')));
                        }
                        break;
                    case 'include':
                        try {
                            if (!this.resolvePath.find(x => x.path === commandMatch[2])) { // if the include is in the path, it is a circular reference
                                let included = await this.getInclude(commandMatch[2], mainDir);
                                inputLines.unshift(...included);
                                this.resolvePath.push({path: commandMatch[2], lines: included.length});
                            } else {
                                logger.warning(`Circular reference detected. Skipping include ${commandMatch[2]}`);
                            }
                        } catch (err) {
                            logger.error(err.message);
                            outputLines.push(inputLine);
                        }
                        break;
                    case 'format':
                        if (!this.pageFormat && Object.values(pageFormats).includes(commandMatch[2]))
                            // @ts-ignore
                            this.pageFormat = commandMatch[2];
                        else
                            logger.warning('Invalid page format or format already set: ' + commandMatch[2]);
                        break;
                    case 'newpage':
                        renderer.addPlugin(getMarkdownPlugin(markdownPlugins.div));
                        outputLines.push('::: .newpage \n:::');
                        break;
                    case 'stylesheet':
                        await this.addStylesheet(commandMatch[2], mainDir);
                        break;
                    default:
                        outputLines.push(inputLine);
                }
            } else if (variableMatch) {
                this.variables[variableMatch[1]] = variableMatch[2];
                logger.debug(`Added variable: "${variableMatch[1]}": "${variableMatch[2]}"`);
            } else {
                outputLines.push(inputLine);
            }
        }

        let documentContent = outputLines.join('\n');
        // replacing all variables with their values.
        for (let [key, value] of Object.entries(this.variables)) {
            let varReplacer: RegExp = new RegExp(`\\$${key}`, "gi");
            if (typeof  value === "function")
                value = await value();
            // @ts-ignore
            documentContent = documentContent.replace(varReplacer, value);
        }
        return documentContent;
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
