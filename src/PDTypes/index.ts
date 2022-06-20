export interface PDObject extends IdAttributes{
    "a:ObjectID": PDTextObject,
    "a:Name": PDTextObject,
    "a:Code": PDTextObject,
}

export interface RefAttributes {
    "_attributes": {
        "Ref": string
    }
}

export interface IdAttributes {
    "_attributes": {
        "Id": string
    }
}

export interface PDTextObject {
    "_text": string
}