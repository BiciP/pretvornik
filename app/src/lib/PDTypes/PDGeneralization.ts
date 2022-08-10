import type { PDObjectDefinition, RefAttributes } from '.';

export interface PDGeneralization extends PDObjectDefinition {
	'a:Stereotype': 'implementation';
	'c:Object1': {
		[key: string]: RefAttributes;
	};
	'c:Object2': {
		[key: string]: RefAttributes;
	};
}
