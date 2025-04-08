import {FontTextWidgetClass} from "./FontTextWidget.ts";
import {languageSelected, languageStrings} from "../main.ts";

const pattern = /\[([^\s:]+):(\d+)\]/;

export class LabelWidgetClass extends FontTextWidgetClass {
    getTreatedText() {
        let str = this.text.value;
        const match = str.match(pattern);
        if (match !== null && match.index !== undefined) {
            const language = languageStrings.get(languageSelected.value);
            if (language) {
                const str1 = language?.[match[1]]?.[match[2]];
                if (typeof str1 === "string") {
                    str = str1;
                }
            }
        }
        const lines = str.split("\n");
        if (lines.length > this.maxLines.value) {
            return lines.slice(0, this.maxLines.value).join("\n");
        }
        else {
            return str;
        }
    }
}
