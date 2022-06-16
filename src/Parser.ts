import {xml2js} from "xml-js"
import * as console from "console";
import {parser} from "./DiagramParser/Physical";
import {PdInfo, TableColumn, TableSymbol} from "./types";

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
    let tables: TableSymbol[] = [].concat(pdModel["c:Tables"]["o:Table"])

    tables.forEach(table => {
        let columns: TableColumn[] = [].concat(table["c:Columns"]["o:Column"])
        const getPUMLColumns = (columns: TableColumn[]) =>
            columns.map(col => `${col["a:Mandatory"]?._text === "1" ? "*" : ""} ${col["a:Name"]._text}: ${col["a:DataType"]._text}`).join("\n    ")

        let PUMLEntity = `
entity "${table["a:Name"]._text}" as ${table._attributes.Id} {
    * key
    --
    ${getPUMLColumns(columns)}
}
        `

        console.log(PUMLEntity)
    })
}

//@startuml
// entity Entity01 {
//   * identifying_attribute
//   --
//   * mandatory_attribute
//   optional_attribute
// }
// @enduml

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