import type { PDObject, RefAttributes } from "."

export type PDCardinality = "0,1" | "0,n" | "1,1" | "1,n"

export interface PDRelationship extends PDObject {
    "a:CreationDate": number,
    "a:Creator": string,
    "a:ModificationDate": number,
    "a:Modifier": string,
    "a:Entity1ToEntity2RoleCardinality": PDCardinality,
    "a:Entity2ToEntity1RoleCardinality": PDCardinality,
    "c:Object1": {
      "o:Entity": RefAttributes
    },
    "c:Object2": {
      "o:Entity": RefAttributes
    }
  }