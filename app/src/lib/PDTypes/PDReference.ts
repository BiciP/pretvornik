import type { IdAttributes, PDObject, PDObjectDefinition, RefAttributes } from './index';

export interface PDReferenceSymbol extends IdAttributes {
	'a:LineColor': number;
	'c:SourceSymbol': {
		'o:TableSymbol': RefAttributes;
	};
	'c:DestinationSymbol': {
		'o:TableSymbol': RefAttributes;
	};
	'c:Object': {
		'o:Reference': RefAttributes;
	};
}

export interface ReferenceJoinObject extends IdAttributes {
	'c:Object1': {
		'o:Column': RefAttributes;
	};
	'c:Object2': {
		'o:Column': RefAttributes;
	};
}

export interface PDReferenceObject extends PDObjectDefinition {
	'a:Cardinality': string;
	'a:UpdateConstraint': string;
	'a:DeleteConstraint': string;
	'a:ParentRole'?: string;
	'a:ChildRole'?: string;
	'c:ParentTable': {
		'o:Table': RefAttributes;
	};
	'c:ChildTable': {
		'o:Table': RefAttributes;
	};
	'c:ParentKey': {
		'o:Key': RefAttributes;
	};
	'c:Joins': {
		'o:ReferenceJoin': ReferenceJoinObject | ReferenceJoinObject[];
	};
}
