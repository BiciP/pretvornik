import type { PDObjectDefinition } from './index';
import type { PDReferenceSymbol } from './PDReference';
import type { PDTableSymbol } from './PDTable';
import type { PDTextSymbol } from './PDText';

export interface PDPhysicalDiagram extends PDObjectDefinition {
	'c:Symbols': {
		'o:ReferenceSymbol': PDReferenceSymbol | PDReferenceSymbol[];
		'o:TextSymbol': PDTextSymbol | PDTextSymbol[];
		'o:TableSymbol': PDTableSymbol | PDTableSymbol[];
	};
}
