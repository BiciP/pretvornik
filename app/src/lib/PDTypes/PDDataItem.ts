import type { PDObject } from ".";

export interface PDDataItem extends PDObject {
  "a:CreationDate": number;
  "a:Creator": string;
  "a:ModificationDate": number;
  "a:Modifier": string;
  "a:DataType": string;
  "a:Length"?: number;
  "a:Precision"?: number;
}
