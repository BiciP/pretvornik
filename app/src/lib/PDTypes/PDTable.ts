import type { IdAttributes, PDObject, RefAttributes } from './index';

export interface PDTableSymbol extends IdAttributes {
	'a:FillColor': number;
	'c:Object': {
		'o:Table': RefAttributes;
	};
}

export interface TableColumn extends PDObject {
	'a:DataType': string;
	'a:Mandatory': string;
}

export interface TableKey extends PDObject {
	'c:Key.Columns': {
		'o:Column': RefAttributes;
	};
}

export interface PDTableObject extends PDObject {
	'c:Columns': {
		'o:Column': TableColumn | TableColumn[];
	};
	'c:Keys': {
		'o:Key': TableKey | TableKey[];
	};
	'c:Indexes': {
		'o:Index': TableIndex | TableIndex[];
	};
	'c:PrimaryKey': {
		'o:Key': RefAttributes | RefAttributes[];
	};
}

export interface TableIndex extends PDObject {
	'a:Modifier': string;
	'a:Unique': string;
	'c:LinkedObject': {
		'o:Key': RefAttributes;
	};
	'c:IndexColumns': {
		'o:IndexColumn': IndexColumn | IndexColumn[];
	};
}

export interface IndexColumn extends IdAttributes {
	'c:Column': {
		'o:Column': RefAttributes | RefAttributes[];
	};
}
