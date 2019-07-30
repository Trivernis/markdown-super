import * as fsx from 'fs-extra';
import * as path from 'path';
import {getMarkdownPlugin} from "./utils";
import {logger} from "./logger";

const confName = 'mdconfig.json';
const confDir = `${__dirname}../../configs`;

/**
 * Configs that can be extended
 */
const configs: any = {
    "full": `${confDir}/full-${confName}`
};

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

        if (configData.extends && configs[configData.extends]) { // assign the base config to the config data
            logger.info(`Extending config with ${configData.extends}`);
            Object.assign(configData, fsx.readJsonSync(configs[configData.extends]));
        }
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
        logger.info(`Config file saved as ${filename}.`);
    }
}
