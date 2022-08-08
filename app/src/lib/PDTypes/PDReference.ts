import type {IdAttributes, PDTextObject, RefAttributes} from "./index";

export interface PDReferenceSymbol extends IdAttributes {
    "a:Rect": PDTextObject,
    "a:ListOfPoints": PDTextObject,
    "a:ArrowStyle": PDTextObject,
    "a:LineColor": PDTextObject,
    "a:ShadowColor": PDTextObject,
    "a:FontList": PDTextObject,
    "c:SourceSymbol": {
        "o:TableSymbol": RefAttributes
    },
    "c:DestinationSymbol": {
        "o:TableSymbol": RefAttributes
    },
    "c:Object": {
        "o:Reference": RefAttributes
    },
}

export interface ReferenceJoinObject extends IdAttributes {
    "a:ObjectID": PDTextObject,
    "a:CreationDate": PDTextObject,
    "a:Creator": PDTextObject,
    "a:ModificationDate": PDTextObject,
    "a:Modifier": PDTextObject,
    "c:Object1": {
        "o:Column": RefAttributes
    },
    "c:Object2": {
        "o:Column": RefAttributes
    }
}

export interface PDReferenceObject extends IdAttributes {
    "a:ObjectID": PDTextObject,
    "a:Name": PDTextObject,
    "a:Code": PDTextObject,
    "a:CreationDate": PDTextObject,
    "a:Creator": PDTextObject,
    "a:ModificationDate": PDTextObject,
    "a:Modifier": PDTextObject,
    "a:History": PDTextObject,
    "a:Cardinality": PDTextObject,
    "a:UpdateConstraint": PDTextObject,
    "a:DeleteConstraint": PDTextObject,
    "c:ParentTable": {
        "o:Table": RefAttributes
    },
    "c:ChildTable": {
        "o:Table": RefAttributes
    },
    "c:ParentKey": {
        "o:Key": RefAttributes
    },
    "c:Joins": {
        "o:ReferenceJoin": ReferenceJoinObject | ReferenceJoinObject[]
    },
}