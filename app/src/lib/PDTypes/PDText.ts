import type {IdAttributes, PDTextObject} from "./index";

export interface PDTextSymbol extends IdAttributes {
    "a:Text": PDTextObject,
    "a:CreationDate": PDTextObject,
    "a:ModificationDate": PDTextObject,
    "a:Rect": PDTextObject,
    "a:TextStyle": PDTextObject,
    "a:AutoAdjustToText": PDTextObject,
    "a:LineColor": PDTextObject,
    "a:DashStyle": PDTextObject,
    "a:FillColor": PDTextObject,
    "a:ShadowColor": PDTextObject,
    "a:FontName": PDTextObject,
    "a:ManuallyResized": PDTextObject
}