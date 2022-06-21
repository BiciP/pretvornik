import {PDObject, PDTextObject} from "./index";
import {PDReferenceSymbol} from "./PDReference";
import {PDTableSymbol} from "./PDTable";
import {PDTextSymbol} from "./PDText";

export interface PDPhysicalDiagram extends PDObject {
    "a:CreationDate": PDTextObject,
    "a:Creator": PDTextObject,
    "a:ModificationDate": PDTextObject,
    "a:Modifier": PDTextObject,
    "a:History": PDTextObject,
    "a:DisplayPreferences": PDTextObject,
    "a:PaperSize": PDTextObject,
    "a:PageMargins": PDTextObject,
    "a:PageOrientation": PDTextObject,
    "a:PaperSource": PDTextObject,
    "c:Symbols": {
        "o:ReferenceSymbol": PDReferenceSymbol | PDReferenceSymbol[],
        "o:TextSymbol": PDTextSymbol | PDTextSymbol[],
        "o:TableSymbol": PDTableSymbol | PDTableSymbol[]
    },
}