import type { IdAttributes, RefAttributes } from "."

export interface PDInheritanceLink extends IdAttributes {
    "a:ObjectID": string,
    "a:CreationDate": number,
    "a:Creator": string,
    "a:ModificationDate": number,
    "a:Modifier": string,
    "c:Object1": {
      "o:Inheritance": RefAttributes
    },
    "c:Object2": {
      "o:Entity": RefAttributes
    }
  }