import { IdAttributes, PDObject, PDTextObject, RefAttributes } from ".";

export interface RelationshipSymbol extends IdAttributes {
  "a:ModificationDate": PDTextObject;
  "a:Rect": PDTextObject;
  "a:ListOfPoints": PDTextObject;
  "a:CornerStyle": PDTextObject;
  "a:ArrowStyle": PDTextObject;
  "a:LineColor": PDTextObject;
  "a:ShadowColor": PDTextObject;
  "a:FontList": PDTextObject;
  "c:SourceSymbol": {
    "o:EntitySymbol": RefAttributes;
  };
  "c:DestinationSymbol": {
    "o:EntitySymbol": RefAttributes;
  };
  "c:Object": {
    "o:Relationship": RefAttributes;
  };
}

export interface EntitySymbol extends IdAttributes {
  "a:ModificationDate": PDTextObject;
  "a:IconMode": PDTextObject;
  "a:Rect": PDTextObject;
  "a:LineColor": PDTextObject;
  "a:FillColor": PDTextObject;
  "a:ShadowColor": PDTextObject;
  "a:FontList": PDTextObject;
  "a:BrushStyle": PDTextObject;
  "a:GradientFillMode": PDTextObject;
  "a:GradientEndColor": PDTextObject;
  "c:Object": {
    "o:Entity": RefAttributes;
  };
}

export interface InheritanceLinkSymbol extends IdAttributes {
  "a:ModificationDate": PDTextObject;
  "a:Rect": PDTextObject;
  "a:ListOfPoints": PDTextObject;
  "a:CornerStyle": PDTextObject;
  "a:ArrowStyle": PDTextObject;
  "a:LineColor": PDTextObject;
  "a:ShadowColor": PDTextObject;
  "a:FontList": PDTextObject;
  "c:SourceSymbol": {
    "o:EntitySymbol": RefAttributes;
  };
  "c:DestinationSymbol": {
    "o:InheritanceSymbol": RefAttributes;
  };
  "c:Object": {
    "o:InheritanceLink": RefAttributes;
  };
}

export interface PDConceptualDiagram extends PDObject {
  "a:CreationDate": PDTextObject;
  "a:Creator": PDTextObject;
  "a:ModificationDate": PDTextObject;
  "a:Modifier": PDTextObject;
  "a:DisplayPreferences": PDTextObject;
  "a:PaperSize": PDTextObject;
  "a:PageMargins": PDTextObject;
  "a:PageOrientation": PDTextObject;
  "a:PaperSource": PDTextObject;
  "c:Symbols": {
    "o:RelationshipSymbol": RelationshipSymbol | RelationshipSymbol[];
    "o:EntitySymbol": EntitySymbol | EntitySymbol[];
    "o:InheritanceLinkSymbol": InheritanceLinkSymbol | InheritanceLinkSymbol[];
    // TODO: MORE SYMBOLS
  };
}
