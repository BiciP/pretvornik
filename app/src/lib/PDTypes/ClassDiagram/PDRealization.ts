import type { PDObjectDefinition } from '..';
import type { ObjectRef } from './PDClassDiagram';

export interface PDRealization extends PDObjectDefinition {
	'c:Object1': ObjectRef;
	'c:Object2': ObjectRef;
}
