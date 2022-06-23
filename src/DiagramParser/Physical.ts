import {PhysicalDiagram, TableColumn, TableKey, TableSymbol} from "../types";
import ParserError from "../ParseError";
import {PDTableObject, PDTableSymbol} from "../PDTypes/PDTable";
import {PDReferenceObject, PDReferenceSymbol} from "../PDTypes/PDReference";
import {PDPhysicalDiagram} from "../PDTypes/PDPhysicalDiagram";
import * as fs from "fs";

export const parser = (diagram: PDPhysicalDiagram, PDObjects: any) => {
    let PUMLDiagram = ""

    // Parse Table symbols
    let tableSymbols: PDTableSymbol[] = [].concat(diagram["c:Symbols"]["o:TableSymbol"])
    tableSymbols.forEach(symbol => PUMLDiagram += PDObjects["o:Table"][symbol["c:Object"]["o:Table"]._attributes.Ref] + "\n")

    // Parse Reference symbols
    let refSymbols: PDReferenceSymbol[] = [].concat(diagram["c:Symbols"]["o:ReferenceSymbol"])
    refSymbols.forEach(symbol => PUMLDiagram += PDObjects["o:Reference"][symbol["c:Object"]["o:Reference"]._attributes.Ref] + "\n")

    return {
        diagram: {
            id: diagram._attributes.Id,
            name: diagram["a:Name"]._text,
        },
        data: PUMLDiagram
    }
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

// Pretvori PowerDesigner TableColumn v PlantUML notacijo
const parseColumnData = (col: TableColumn) =>
    `${col["a:Mandatory"]?._text === "1" ? "*" : ""} ${col["a:Name"]._text}: ${col["a:DataType"]._text}`