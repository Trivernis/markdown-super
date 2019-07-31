let format = require("date-format");

const dateTimeFormat = "dd.MM.yyyy hh:mm:ss";
const dateFormat = "dd.MM.yyyy";
const timeFormat = "hh:mm:ss";

export const globalVariables: any = {
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
