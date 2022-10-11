import type { PDObjectDefinition } from './index';

export type Visibility = '-' | '*' | '#' | '+';

export interface Attribute extends PDObjectDefinition {
	'a:DataType'?: string;
	'a:Static'?: 1;
	'a:Frozen'?: string;
	'a:Attribute.Visibility'?: Visibility;
	'a:InitialValue'?: any;
}

export interface Operation extends PDObjectDefinition {
	'a:ReturnType': any;
	'a:Operation.Abstract'?: 1;
	'a:Operation.Final'?: 1;
	'a:Operation.Visibility'?: Visibility;
	'a:Operation.Static'?: 1;
	'a:Event'?: string;
	'a:TemplateBody': '%DefaultBody%';
}

export interface Annotation extends PDObjectDefinition {
	'a:Annotation.Text': string;
	'a:Annotation.Name': string;
}
