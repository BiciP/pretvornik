import {xml2js} from "xml-js"
import * as console from "console";
import {parser, parseTables} from "./DiagramParser/Physical";
import {PdInfo, TableColumn, TableSymbol} from "./types";
import ParserError, {PARSE_ERROR_MESSAGE} from "./ParseError";

// Pretvori XML v JS in inicializira branje diagrama
export const parseFile = (file: string) => {
    let xml = xml2js(file, {compact: true})

    // Preverimo ustreznost datoteke
    let pdInfo = xml["_instruction"]?.["PowerDesigner"]
    let pdModel = xml["Model"]?.["o:RootObject"]?.["c:Children"]?.["o:Model"]
    if (!pdInfo || !pdModel)
        throw new ParserError(PARSE_ERROR_MESSAGE.NOT_A_PD_FILE)

    parsePdInfo(pdInfo)
    parsePdModel(pdModel)
}

// Pretvori diagrame v PlantUML notacijo
const parsePdModel = (pdModel: object) => {
    let physicalDiagrams = [].concat(pdModel["c:PhysicalDiagrams"]["o:PhysicalDiagram"])

    console.log(parseTables(pdModel).join("\n"));
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