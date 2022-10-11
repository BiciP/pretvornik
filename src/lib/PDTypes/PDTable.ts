import type { IdAttributes, PDObject, RefAttributes } from './index';

export interface TableColumn extends PDObject {
    foreignKey?: number;
	isPrimary?: boolean; // custom prop
	'a:DataType': string;
	'a:Column.Mandatory'?: 0 | 1;
	isIdentifier?: true;
	'a:AutoMigrated'?: 1;
}

export interface TableKey extends PDObject {
	'c:Key.Columns': {
		'o:Column': RefAttributes | RefAttributes[];
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
