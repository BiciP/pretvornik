import type { PDObject, RefAttributes } from ".";

export interface PDInheritance extends PDObject {
  "a:CreationDate": number;
  "a:Creator": string;
  "a:ModificationDate": number;
  "a:Modifier": string;
  "a:BaseLogicalInheritance.Complete": 0 | 1;
  "c:ParentEntity": {
    "o:Entity": RefAttributes;
  };
}
