import { join } from 'path';
import { readdir, readFileSync } from 'fs';
const directoryPath = join("./src/assets/", 'lang');

let languages = {};
const DEFAULT_LANGUAGE = 'english';

readdir(directoryPath, async function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    files.forEach(async function (file) {
        try {
            const languageFile = JSON.parse(readFileSync(join(directoryPath, file), 'utf8'));
            const name = file.split('.')[0];

            languages[name] = languageFile;
        } catch {
            bot.logger.error(`Error parsing ${file}`);
        }
    });
});

export const getLanguageNames = function () {
    return Object.keys(languages);
}

export const languageExists = function (language) {
    return languages[language] !== undefined;
}

export const getText = function (key, language = DEFAULT_LANGUAGE) {
    if (languages[language] === undefined) language = DEFAULT_LANGUAGE;
    if (languages[language][key] === undefined) return `Missing translation: ${key}`;
    return languages[language][key];
}

export default {
    getLanguageNames,
    languageExists,
    getText
}