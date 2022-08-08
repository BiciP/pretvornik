import { IdAttributes, PDObject, PDTextObject, RefAttributes } from ".";

export interface EntityAttribute extends IdAttributes {
  "a:ObjectID": PDTextObject;
  "a:CreationDate": PDTextObject;
  "a:Creator": PDTextObject;
  "a:ModificationDate": PDTextObject;
  "a:Modifier": PDTextObject;
  "a:BaseAttribute.Mandatory"?: PDTextObject; // optional
  "c:DataItem": {
    "o:DataItem": RefAttributes // | RefAttributes[]; // should not be a collection, but idk
  };
}

export interface Identifier extends PDObject {
  "a:CreationDate": PDTextObject;
  "a:Creator": PDTextObject;
  "a:ModificationDate": PDTextObject;
  "a:Modifier": PDTextObject;
  "c:Identifier.Attributes": {
    "o:EntityAttribute": EntityAttribute | EntityAttribute[];
  };
}

export interface IdentifierRef {
  _attributes: {
    Ref: string;
  };
}

export interface PDEntityObject extends PDObject {
  "a:CreationDate": PDTextObject;
  "a:Creator": PDTextObject;
  "a:ModificationDate": PDTextObject;
  "a:Modifier": PDTextObject;
  "c:Identifiers": {
    "o:Identifier": Identifier | Identifier[];
  };
  "c:Attributes": {
    "o:EntityAttribute": EntityAttribute | EntityAttribute[];
  };
  "c:PrimaryIdentifier": {
    "o:Identifier": IdentifierRef | IdentifierRef[];
  };
}
