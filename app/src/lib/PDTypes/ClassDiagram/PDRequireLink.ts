import type { PDObjectDefinition, RefAttributes } from '..';

export interface PDRequireLink extends PDObjectDefinition {
	'c:Object1': {
		'o:Interface': RefAttributes;
	};
	'c:Object2': {
		'o:Class': RefAttributes;
	};
}
