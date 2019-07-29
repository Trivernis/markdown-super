import {JSDOM} from "jsdom";
import * as path from "path";
import * as fsx from "fs-extra";
import fetch from "node-fetch";
import {logger} from "./logger";
import {markdownPlugins} from "./plugins";

const mathJaxUrl = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-MML-AM_CHTML';

/**
 * Bundles all images in the image tags.
 * @param dom
 * @param mainfile
 */
export async function bundleImages(dom: JSDOM, mainfile: string): Promise<JSDOM> {
    let document = dom.window.document;
    let mainFolder = path.dirname(mainfile);
    let imgs = document.querySelectorAll('img');
    logger.debug(`Bundling ${imgs.length} images.`);
    for (let img of imgs) {
        let source = img.src;
        let filepath = source;
        let base64Url = source;
        if (!path.isAbsolute(filepath))
            filepath = path.join(mainFolder, filepath);
        if (await fsx.pathExists(filepath)) {
            let type = path.extname(source).slice(1);
            base64Url = `data:image/${type};base64,`;
            base64Url += (await fsx.readFile(filepath)).toString('base64');
        } else {
            try {
                let response = await fetch(source);
                base64Url = `data:${response.headers.get('content-type')};base64,`;
                base64Url += (await response.buffer()).toString('base64');
            } catch (error) {
                logger.error(error);
            }
        }
        img.src = base64Url;
    }
    return dom;
}

/**
 * Includes mathjax in the dom.
 * @param dom
 */
export function includeMathJax(dom: JSDOM): JSDOM {
    let document = dom.window.document;
    let scriptTag = document.createElement('script');
    scriptTag.src = mathJaxUrl;
    document.head.appendChild(scriptTag);
    return dom;
}

/**
 * Returns the markdown plugin associated with the pluginName
 * @param pluginName
 */
export function getMarkdownPlugin(pluginName: string) {
    logger.debug(`Trying to resolve plugin ${pluginName}`);
    if (markdownPlugins[pluginName]) {
        return require(markdownPlugins[pluginName]);
    } else {
        try {
            let plugin = require(pluginName);
            if (plugin)
                return plugin;
        } catch (err) {
            console.error(`Module ${pluginName} not found.`);
        }
    }
}

/**
 * Asynchronous elay function
 * @param milliseconds
 */
export function delay(milliseconds: number) {
    return new Promise(function(resolve) {
        setTimeout(resolve, milliseconds)
    });
}
