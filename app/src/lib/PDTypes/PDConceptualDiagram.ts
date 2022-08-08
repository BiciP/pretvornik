import type { IdAttributes, PDObject, RefAttributes } from '.';

export interface RelationshipSymbol extends IdAttributes {
	'a:ModificationDate': number;
	'a:Rect': string;
	'a:ListOfPoints': string;
	'a:CornerStyle': number;
	'a:ArrowStyle': number;
	'a:LineColor': number;
	'a:ShadowColor': number;
	'a:FontList': string;
	'c:SourceSymbol': {
		'o:EntitySymbol': RefAttributes;
	};
	'c:DestinationSymbol': {
		'o:EntitySymbol': RefAttributes;
	};
	'c:Object': {
		'o:Relationship': RefAttributes;
	};
}

export interface EntitySymbol extends IdAttributes {
	'a:ModificationDate': number;
	'a:IconMode': number;
	'a:Rect': string;
	'a:LineColor': number;
	'a:FillColor': number;
	'a:ShadowColor': number;
	'a:FontList': string;
	'a:BrushStyle': number;
	'a:GradientFillMode': number;
	'a:GradientEndColor': number;
	'c:Object': {
		'o:Entity': RefAttributes;
	};
}

export interface InheritanceLinkSymbol extends IdAttributes {
	'a:ModificationDate': number;
	'a:Rect': string;
	'a:ListOfPoints': string;
	'a:CornerStyle': number;
	'a:ArrowStyle': number;
	'a:LineColor': number;
	'a:ShadowColor': number;
	'a:FontList': string;
	'c:SourceSymbol': {
		'o:EntitySymbol': RefAttributes;
	};
	'c:DestinationSymbol': {
		'o:InheritanceSymbol': RefAttributes;
	};
	'c:Object': {
		'o:InheritanceLink': RefAttributes;
	};
}

export interface PDConceptualDiagram extends PDObject {
	'a:ObjectID': string;
	'a:Name': string;
	'a:Code': string;
	'a:CreationDate': number;
	'a:Creator': string;
	'a:ModificationDate': number;
	'a:Modifier': string;
	'a:DisplayPreferences': string;
	'a:PaperSize': string;
	'a:PageMargins': string;
	'a:PageOrientation': number;
	'a:PaperSource': number;
	'c:Symbols': {
		'o:RelationshipSymbol': RelationshipSymbol | RelationshipSymbol[];
		'o:EntitySymbol': EntitySymbol | EntitySymbol[];
	};
	'@_Id': string;
}
