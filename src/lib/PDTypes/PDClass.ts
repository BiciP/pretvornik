import type { PDObjectDefinition, RefAttributes } from './index';
import type { Annotation, Attribute, Operation } from './PDOther';

export interface ObjectRef {
	[key: string]: RefAttributes;
}

export interface PDPort extends PDObjectDefinition {
	'a:Multiplicity': string;
}

export interface Dependency extends PDObjectDefinition {
	'c:Object1': ObjectRef;
	'c:Object2': ObjectRef;
}

export interface Generalization extends PDObjectDefinition {
	'c:Object1': ObjectRef;
	'c:Object2': ObjectRef;
}

export interface Association extends PDObjectDefinition {
	'a:RoleAMultiplicity': string;
	'a:RoleBMultiplicity': string;
	'a:RoleAIndicator'?: 'A' | 'C';
	'c:Object1': ObjectRef;
	'c:Object2': ObjectRef;
}

export interface PDClass extends PDObjectDefinition {
	name?: string;
	'a:Stereotype': string;
	'a:UseParentNamespace': 0 | 1;
	'a:Classifier.Abstract'?: 1;
	'a:Cardinality': string;
	'c:Attributes': {
		'o:Attribute': Attribute | Attribute[];
	};
	'c:Operations': {
		'o:Operation': Operation | Operation[];
	};
	'c:Ports': {
		'o:Port': PDPort | PDPort[];
	};
	'c:Parts': {
		'o:Part': {
			'a:ObjectID': 'D21F97B0-815D-48C5-8883-332D314C8C38';
			'a:Name': 'Part_1';
			'a:Code': 'Part_1';
			'a:CreationDate': 1661354334;
			'a:Creator': 'Bici';
			'a:ModificationDate': 1661354345;
			'a:Modifier': 'Bici';
			'a:Multiplicity': '0..*';
			'@_Id': 'o69';
		};
	};
	'c:LinkedObjects'?: {
		'o:Class': RefAttributes;
	};
	'c:InnerClasses'?: {
		'o:Class': PDClass | PDClass[];
	};
	'c:InnerDependencies': {
		'o:Dependency': Dependency | Dependency[];
	};
	'c:InnerGeneralizations': {
		'o:Generalization': Generalization | Generalization[];
	};
	'c:InnerAssociations': {
		'o:Association': Association | Annotation[];
	};
	'c:Annotations': {
		'o:Annotation': Annotation | Annotation[];
	};
}
