import type { PDObjectDefinition } from '..';
import type { PDClassDiagram } from './PDClassDiagram';

export interface PDPackage extends PDObjectDefinition {
	'c:ClassDiagrams': {
		'o:ClassDiagram': PDClassDiagram | PDClassDiagram[];
	};
}
