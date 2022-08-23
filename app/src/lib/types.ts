import type { IdAttributes, RefAttributes } from "./PDTypes"

export interface PdInfo {
    AppLocale?: string,
    ID?: string,
    Label?: string,
    Name?: string,
    Objects?: string,
    Symbols?: string,
    Target?: string,
    Type?: string, // '{CDE44E21-9669-11D1-9914-006097355D9B}'
    signature?: string, // 'PDM_DATA_MODEL_XML',
    version?: string // '12.5.0.2169"',
}

interface PDIdObject {
    "@_Id": string
}

interface PDObject extends PDIdObject {
    "a:Name": string,
    "a:Code": string,
}

export interface TableColumn extends PDObject {
    "a:DataType": string,
    "a:Mandatory"?: "1" | "0",
    "isIdentifier"? : Boolean // custom property, ki pove ali je ključ
}

export interface TableKey extends PDObject {
    "c:Key.Columns": {
        "o:Column": RefAttributes
    }
}

interface TableIndexColumn extends IdAttributes {
    "c:Column": {
        "o:Column": RefAttributes
    }
}

interface TableIndex extends PDObject {
    "a:Unique": "0" | "1",
    "c:LinkedObject": {
        "o:Key": RefAttributes
    },
    "c:IndexColumns": {
        "o:IndexColumn": TableIndexColumn | TableIndexColumn[]
    }
}

export interface TableSymbol extends PDObject {
    "c:Columns": {
        "o:Column": TableColumn | TableColumn[]
    },
    "c:Keys": {
        "o:Key": TableKey | TableKey[]
    },
    "c:Indexes": {
        "o:Index": TableIndex | TableIndex[]
    },
    "c:PrimaryKey": {
        "o:Key": RefAttributes
    },
}

export interface PhysicalDiagram extends PDObject {
    "c:Symbols": {
        "o:ReferenceSymbol": object | object[],
        "o:TextSymbol": object | object[],
        "o:TableSymbol": object | object[]
    },
}