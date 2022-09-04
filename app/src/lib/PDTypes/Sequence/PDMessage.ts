import type { PDObjectDefinition } from '..';
import type { ObjectRef } from '../ClassDiagram/PDClassDiagram';

export interface PDMessage extends PDObjectDefinition {
	'a:ControlFlow'?: 'R' | 'C';
	'a:Delay'?: number;
	'c:Object1': ObjectRef;
	'c:Object2': ObjectRef;
}
