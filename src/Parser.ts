import {xml2js} from "xml-js"
import * as console from "console";
import {parser, parseReferences, parseTables} from "./DiagramParser/Physical";
import {PdInfo, TableColumn, TableSymbol} from "./types";
import ParserError, {PARSE_ERROR_MESSAGE} from "./ParseError";
import {PDTableObject} from "./PDTypes/PDTable";
import {PDReferenceObject} from "./PDTypes/PDReference";

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
// najprej pretvorimo vse objekte v PlantUML notacijo in si zapišemo
// nato začnemo s pretvorbo diagramov
const parsePdModel = (pdModel: object) => {
    // PlantUML definicije PowerDesigner objektov
    let definitions = {}

    // Vrsta objektov, ki jih lahko pretvorimo v PlantUML notacijo
    let collectionQueue = ["c:Tables", "c:References"]

    // this should resolve into an object of objects
    // { "c:Tables": { o1: PUMLEntity, ... }, "c:References": { o2: PUMLEntity } }
    collectionQueue.forEach(col => {
        // @ts-ignore
        definitions[col] = PDCollectionResolver(col, pdModel[col])
    })

    console.log(definitions)
    // let physicalDiagrams = [].concat(pdModel["c:PhysicalDiagrams"]["o:PhysicalDiagram"])
    // physicalDiagrams.forEach(parser)
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


/*
* HELPERS
* */

const PDCollectionParser = {
    "c:Tables": function (col) {
        let tables: PDTableObject[] = [].concat(col["o:Table"])
        return parseTables(tables)
    },

    "c:References": function (col) {
        console.log("TODO: Parse References")
        let references: PDReferenceObject[] = [].concat(col["o:Reference"])
        return parseReferences(references)
    },

    _default: function (collection) {
        throw new ParserError(`Collection '${collection}' not implemented.`)
    }
}

// https://github.com/rwaldron/idiomatic.js - 7.A.1.2 Misc - A better switch statement,
const PDCollectionResolver = function () {
    let args, key, delegate

    // Transform arguments list into an array
    args = [].slice.call(arguments)

    // shift the case key from the arguments
    key = args.shift()

    // Assign the default case handler
    delegate = PDCollectionParser._default

    // Derive the method to delegate operation to
    if (PDCollectionParser.hasOwnProperty(key)) {
        delegate = PDCollectionParser[key]
    }

    // The scope arg could be set to something specific,
    // in this case, |null| will suffice
    return delegate.apply(null, args)
}
