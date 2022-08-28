import type { PDObjectDefinition, RefAttributes } from '..';
import type { Annotation, Attribute, Operation } from './PDOther';



export interface PDInterface extends PDObjectDefinition {
	name?: string;
	'a:UseParentNamespace': 0 | 1;
	'a:Classifier.Abstract'?: 1;
	'c:LinkedObjects'?: {
		'o:Interface': RefAttributes;
	};
	'c:InnerInterfaces'?: {
		'o:Interface': PDInterface | PDInterface[];
	};
	'c:Attributes': {
		'o:Attribute': Attribute | Attribute[];
	};
	'c:Operations': {
		'o:Operation': Operation | Operation[];
	};
	'c:Annotations': {
		'o:Annotation': Annotation | Annotation[];
	};
}
