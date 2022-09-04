import type { IdAttributes, PDObject, PDObjectDefinition, RefAttributes } from '.';

export interface EntityAttribute extends IdAttributes {
	'a:ObjectID': string;
	'a:CreationDate': number;
	'a:Creator': string;
	'a:ModificationDate': number;
	'a:Modifier': string;
	'a:BaseAttribute.Mandatory'?: 0 | 1; // optional
	'c:DataItem': {
		'o:DataItem': RefAttributes; // | RefAttributes[]; // should not be a collection, but idk
	};
}

export interface Identifier extends PDObject {
	'a:CreationDate': number;
	'a:Creator': string;
	'a:ModificationDate': number;
	'a:Modifier': string;
	'c:Identifier.Attributes': {
		'o:EntityAttribute': EntityAttribute | EntityAttribute[];
	};
}

export interface PDAssociationObject extends PDObjectDefinition {
	'c:Attributes': {
		'o:AssociationAttribute': EntityAttribute | EntityAttribute[]
	};
}

export interface PDEntityObject extends PDObject {
	'a:CreationDate': number;
	'a:Creator': string;
	'a:ModificationDate': number;
	'a:Modifier': string;
	'c:Identifiers': {
		'o:Identifier': Identifier | Identifier[];
	};
	'c:Attributes': {
		'o:EntityAttribute': EntityAttribute | EntityAttribute[];
	};
	'c:PrimaryIdentifier': {
		'o:Identifier': RefAttributes | RefAttributes[];
	};
}
