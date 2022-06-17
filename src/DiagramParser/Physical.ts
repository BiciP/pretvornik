import {PhysicalDiagram, TableColumn, TableKey, TableSymbol} from "../types";
import ParserError from "../ParseError";

export const parser = (diagram: PhysicalDiagram) => {
    console.log(diagram["c:Symbols"]["o:TableSymbol"])
}

export function parseTables(pdModel: object) {
    let tables: TableSymbol[] = [].concat(pdModel["c:Tables"]["o:Table"])
    return tables.map(table => {
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

        return `entity "${table["a:Name"]._text}" as ${table._attributes.Id} {
    ${PUMLKeys}
    --
    ${getPUMLColumns(columns)}
}
`
    })
}

/*
* HELPERS
* */

// Pretvori PowerDesigner TableColumn v PlantUML notacijo
const parseColumnData = (col: TableColumn) =>
    `${col["a:Mandatory"]?._text === "1" ? "*" : ""} ${col["a:Name"]._text}: ${col["a:DataType"]._text}`