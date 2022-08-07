import { PDObject, PDTextObject } from ".";

export interface PDDataItem extends PDObject {
  "a:CreationDate": PDTextObject;
  "a:Creator": PDTextObject;
  "a:ModificationDate": PDTextObject;
  "a:Modifier": PDTextObject;
}
