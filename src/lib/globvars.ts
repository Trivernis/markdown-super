let format = require("date-format");

const dateTimeFormat = "dd.MM.yyyy hh:mm:ss";
const dateFormat = "dd.MM.yyyy";
const timeFormat = "hh:mm:ss";

/**
 * Adds a global variable
 * @param name - name of the variable
 * @param value - value of the variable
 */
export function addGlobalVar(name: string, value: string|Function) {
    name = name.replace(/\W/g, '');     // only allow word characters because it is interpreted as regex
    globalVariables[`\\$${name}`] = value;
}

/**
 * All global variables that can be used in the document.
 */
export const globalVariables: any = {
    "\\$wordcount": 0,          // will be replaced in PreFormatter
    "\\$now"() {
        return format(dateTimeFormat, new Date());
    },
    "\\$date"() {
        return format(dateFormat, new Date());
    },
    "\\$time"() {
        return format(timeFormat, new Date());
    }
};
