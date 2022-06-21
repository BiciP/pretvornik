import {PhysicalDiagram, TableColumn, TableKey, TableSymbol} from "../types";
import ParserError from "../ParseError";
import {PDTableObject} from "../PDTypes/PDTable";
import {PDReferenceObject} from "../PDTypes/PDReference";
import {PDPhysicalDiagram} from "../PDTypes/PDPhysicalDiagram";
import console from "console";

export const parser = (diagram: PDPhysicalDiagram, PDObjects: any) => {
    let symbols = diagram["c:Symbols"]
    Object.keys(symbols).forEach((obj) => {
        console.log(obj)
    })
}

export function parseTables(tables: PDTableObject[]) {
    // { o1: PUMLEntity, o2: PUMLEntity }
    let obj = {}

    tables.forEach(table => {
        let columns: TableColumn[] = [].concat(table["c:Columns"]["o:Column"])
        let keys: TableKey[] = [].concat(table["c:Keys"]["o:Key"])

        let PUMLKeys = keys.map(pk => {
            let keyColumns = [].concat(pk["c:Key.Columns"]["o:Column"])
            keyColumns = keyColumns.map(col => {
                let colIndex = columns.findIndex(item => item._attributes.Id === col._attributes.Ref)
                if (colIndex < 0) {
                    throw new ParserError(`Key column does not exist: Ref[${col._attributes.Ref}]`)
                }
                let column = columns[colIndex]
                columns[colIndex].isIdentifier = true
                return parseColumnData(column)
            })

            // če želimo ključ, ki je sestavljen iz več tujih ključev,
            // newline zamenjamo z ,
            return keyColumns.join("\n    ")
        }).join("\n    ")

        const getPUMLColumns = (columns: TableColumn[]) =>
            columns.filter(col => !col.isIdentifier).map(col => parseColumnData(col)).join("\n    ")

        obj[table._attributes.Id] = `entity "${table["a:Name"]._text}" as ${table._attributes.Id} {
    ${PUMLKeys}
    --
    ${getPUMLColumns(columns)}
}
`
    })

    return obj
}

export function parseReferences(references: PDReferenceObject[]) {
    let obj = {}
    let cardinalityMap = {
        "0..1": "|o--||",
        "0..*": "|o--|{",
        "1..1": "||--||",
        "1..*": "||--|{",
    }

    references.forEach(ref => {
        let parent = ref["c:ParentTable"]["o:Table"]._attributes.Ref
        let child = ref["c:ChildTable"]["o:Table"]._attributes.Ref
        let cardinality = cardinalityMap[ref["a:Cardinality"]._text]

        obj[ref._attributes.Id] = `${parent} ${cardinality} ${child}`
    })

    return obj
}

/*
* HELPERS
* */

const PDSymbolParser = {
    // TODO: IMPLEMENT SYMBOL PARSERS

    _default: function (collection) {
        throw new ParserError(`Symbol '${collection}' not implemented.`)
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
    delegate = PDSymbolParser._default

    // Derive the method to delegate operation to
    if (PDSymbolParser.hasOwnProperty(key)) {
        delegate = PDSymbolParser[key]
    }

    // The scope arg could be set to something specific,
    // in this case, |null| will suffice
    return delegate.apply(null, args)
}

// Pretvori PowerDesigner TableColumn v PlantUML notacijo
const parseColumnData = (col: TableColumn) =>
    `${col["a:Mandatory"]?._text === "1" ? "*" : ""} ${col["a:Name"]._text}: ${col["a:DataType"]._text}`