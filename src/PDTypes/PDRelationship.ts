import { PDObject, PDTextObject, RefAttributes } from "."

export interface PDCardinality {
    _text: "0,1" | "0,n" | "1,1" | "1,n"
}

export interface PDRelationship extends PDObject {
    "a:CreationDate": PDTextObject,
    "a:Creator": PDTextObject,
    "a:ModificationDate": PDTextObject,
    "a:Modifier": PDTextObject,
    "a:Entity1ToEntity2RoleCardinality": PDCardinality,
    "a:Entity2ToEntity1RoleCardinality": PDCardinality,
    "c:Object1": {
      "o:Entity": RefAttributes
    },
    "c:Object2": {
      "o:Entity": RefAttributes
    }
  }