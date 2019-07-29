import * as fsx from 'fs-extra';
import * as path from 'path';
import {getMarkdownPlugin} from "./utils";

const confName = 'mdconfig.json';

/**
 * Markdown config class for easyer access on the configuration.
 */
export class MarkdownConfig {
    public plugins: Set<any> = new Set<any>();
    public stylesheets: Set<string> = new Set<string>();
    public format: string = 'A4';
    public bundle: boolean = false;
    private readonly filename: string;

    /**
     * Creates a new config with the given directory or the processes work directory.
     * @param dirname
     */
    constructor(dirname?: string) {
        dirname = dirname || process.cwd();
        let confFile: string = path.join(dirname, confName);

        if (fsx.pathExistsSync(confFile)) {
            this.filename = confFile;
            this.loadData();
        }
    }

    /**
     * Loads the data from a config file.
     */
    private loadData() {
        let configData = fsx.readJsonSync(this.filename);
        this.format = configData.format || this.format;
        this.bundle = configData.bundle;
        if (configData.plugins)
            this.plugins = new Set<string>(configData.plugins.map(getMarkdownPlugin));
        if (configData.stylesheets)
            this.stylesheets = new Set<string>(configData.stylesheets);
    }

    /**
     * Saves the config file to a config file.
     * @param filename
     */
    public save(filename?: string) {
        let confFile = filename || this.filename;
        fsx.writeJsonSync(confFile, this);
    }
}
