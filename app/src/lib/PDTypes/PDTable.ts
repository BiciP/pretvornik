import type {IdAttributes, PDObject, PDTextObject, RefAttributes} from "./index";

export interface PDTableSymbol extends IdAttributes {
    "a:ModificationDate": PDTextObject,
    "a:Rect": PDTextObject,
    "a:LineColor": PDTextObject,
    "a:FillColor": PDTextObject,
    "a:ShadowColor": PDTextObject,
    "a:FontList": PDTextObject,
    "a:BrushStyle": PDTextObject,
    "a:GradientFillMode": PDTextObject,
    "a:GradientEndColor": PDTextObject,
    "c:Object": {
        "o:Table": RefAttributes
    }
}

export interface TableColumn extends PDObject {
    "a:CreationDate": PDTextObject,
    "a:Creator": PDTextObject,
    "a:ModificationDate": PDTextObject,
    "a:Modifier": PDTextObject,
    "a:History": PDTextObject,
    "a:DataType": PDTextObject,
    "a:Mandatory": PDTextObject
}

export interface TableKey extends PDObject {
    "a:CreationDate": PDTextObject,
    "a:Creator": PDTextObject,
    "a:ModificationDate": PDTextObject,
    "a:Modifier": PDTextObject,
    "a:History": PDTextObject,
    "c:Key.Columns": {
        "o:Column": RefAttributes
    }
}

export interface PDTableObject extends PDObject {
    "a:CreationDate": PDTextObject,
    "a:Creator": PDTextObject,
    "a:ModificationDate": PDTextObject,
    "a:Modifier": PDTextObject,
    "a:History": PDTextObject,
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
        "o:Key": RefAttributes | RefAttributes[]
    },
}

export interface TableIndex extends PDObject {
    "a:CreationDate": PDTextObject,
    "a:Creator": PDTextObject,
    "a:ModificationDate": PDTextObject,
    "a:Modifier": PDTextObject,
    "a:Unique": PDTextObject,
    "c:LinkedObject": {
        "o:Key": RefAttributes
    },
    "c:IndexColumns": {
        "o:IndexColumn": IndexColumn | IndexColumn[]
    }
}

export interface IndexColumn extends IdAttributes {
    "a:ObjectID": PDTextObject,
    "a:CreationDate": PDTextObject,
    "a:Creator": PDTextObject,
    "a:ModificationDate": PDTextObject,
    "a:Modifier": PDTextObject,
    "c:Column": {
        "o:Column": RefAttributes | RefAttributes[]
    }
}