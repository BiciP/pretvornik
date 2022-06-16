import {xml2js} from "xml-js"
import * as console from "console";

// Pretvori XML v JS in inicializira branje diagrama
export const parseFile = (file: string) => {
    let xml = xml2js(file, {compact: true})

    // Preverimo ustreznost datoteke
    let pdInfo = xml["_instruction"]?.["PowerDesigner"]
    let pdModel = xml["Model"]?.["o:RootObject"]?.["c:Children"]?.["o:Model"]
    if (!pdInfo || !pdModel)
        throw new ParserError(PARSE_ERROR_MESSAGE.NOT_A_PD_FILE)

    parsePdInfo(pdInfo)
    // parse pdModel
}

// Pretvori podatke o PowerDesigner v formatu KEY="VALUE" v JS objekt
const parsePdInfo = (pdInfo: string) => {
    let infoObj: PdInfo = {}
    let info = pdInfo.split(/" /g).map(el => el.split("="))
    info.forEach(([key, val]) => {
        infoObj[key] = val.slice(1)
    })
    return infoObj
}

// Razred za javljanje napak
class ParserError extends Error {
    constructor(message) {
        super();
        this.message = message
    }
}

// Sporočila napak
const PARSE_ERROR_MESSAGE = {
    NOT_A_PD_FILE: "This is not a valid PowerDesigner file.",
}