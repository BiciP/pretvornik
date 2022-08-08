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
    _attributes: {
        Id: string
    }
}

interface PDObject extends PDIdObject {
    "a:ObjectID": {
        "_text": string // "FB36F3D4-728F-4E15-9B3B-84055E34B982"
    },
    "a:Name": {
        "_text": "Diagram_1"
    },
    "a:Code": {
        "_text": "DIAGRAM_1"
    },
}

export interface TableColumn extends PDObject {
    "a:DataType": {
        "_text": string // "int"
    },
    "a:Mandatory": {
        "_text": string // "1"
    },
    "isIdentifier"? : Boolean // custom property, ki pove ali je ključ
}

export interface TableKey extends PDObject {
    "c:Key.Columns": {
        "o:Column": {
            "_attributes": {
                "Ref": string
            }
        }
    }
}

interface TableIndexColumn {
    "_attributes": {
        "Id": string
    },
    "a:ObjectID": {
        "_text": string
    },
    "c:Column": {
        "o:Column": {
            "_attributes": {
                "Ref": string
            }
        }
    }
}

interface TableIndex extends PDObject {
    "a:Unique": {
        "_text": string // "1" (true) ali "0" (false)
    },
    "c:LinkedObject": {
        "o:Key": {
            "_attributes": {
                "Ref": string // "o84"
            }
        }
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
        "o:Key": {
            "_attributes": {
                "Ref": string
            }
        }
    },
}

export interface PhysicalDiagram extends PDObject {
    "c:Symbols": {
        "o:ReferenceSymbol": object | object[],
        "o:TextSymbol": object | object[],
        "o:TableSymbol": object | object[]
    },
}