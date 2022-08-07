import { PDObject, PDTextObject, RefAttributes } from ".";

export interface PDInheritance extends PDObject {
  "a:CreationDate": PDTextObject;
  "a:Creator": PDTextObject;
  "a:ModificationDate": PDTextObject;
  "a:Modifier": PDTextObject;
  "a:BaseLogicalInheritance.Complete": {
    _text: "0" | "1";
  };
  "c:ParentEntity": {
    "o:Entity": RefAttributes;
  };
}
