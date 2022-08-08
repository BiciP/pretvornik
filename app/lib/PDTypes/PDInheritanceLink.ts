import { IdAttributes, PDTextObject, RefAttributes } from "."

export interface PDInheritanceLink extends IdAttributes {
    "a:ObjectID": PDTextObject,
    "a:CreationDate": PDTextObject,
    "a:Creator": PDTextObject,
    "a:ModificationDate": PDTextObject,
    "a:Modifier": PDTextObject,
    "c:Object1": {
      "o:Inheritance": RefAttributes
    },
    "c:Object2": {
      "o:Entity": RefAttributes
    }
  }