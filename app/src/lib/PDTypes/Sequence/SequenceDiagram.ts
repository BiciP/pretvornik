import type { IdAttributes, PDObjectDefinition, RefAttributes } from '..';
import type { ObjectRef } from '../ClassDiagram/PDClassDiagram';

export interface InteractionSymbol extends IdAttributes {
	'a:BaseSymbol.Flags': number;
	'a:LineColor': number;
	'a:FillColor': number;
	'c:Object': {
		'o:SequenceDiagram': RefAttributes;
	};
}

export interface MessageSymbol extends IdAttributes {
	'a:Rect': string;
	'a:ArrowStyle': number;
	'a:LineColor': number;
	'a:ShadowColor': number;
	'c:SourceSymbol': ObjectRef;
	'c:DestinationSymbol': ObjectRef;
	'c:Object': {
		'o:Message': RefAttributes;
	};
}

export interface ActivationSymbol extends IdAttributes {
	'a:LineColor': number;
	'a:FillColor': number;
	'a:GradientEndColor'?: number;
}

export interface ActorSequenceSymbol extends IdAttributes {
	'a:Rect': string;
	'a:LineColor': number;
	'a:FillColor': number;
	'a:GradientEndColor'?: number;
	'c:SlaveSubSymbols': {
		'o:LifelineSymbol': object;
		'o:ActivationSymbol'?: ActivationSymbol | ActivationSymbol[];
	};
	'c:Object': {
		'o:Actor': RefAttributes;
	};
}

export interface UMLObjectSequenceSymbol extends IdAttributes {
	'a:Rect': string;
	'a:LineColor': number;
	'a:FillColor': number;
	'a:GradientEndColor'?: number;
	'c:SlaveSubSymbols': {
		'o:LifelineSymbol': object;
		'o:ActivationSymbol'?: ActivationSymbol | ActivationSymbol[];
	};
	'c:Object': {
		'o:UMLObject': RefAttributes;
	};
}

export interface SequenceDiagram extends PDObjectDefinition {
	'c:Symbols': {
		'o:InteractionSymbol': InteractionSymbol | InteractionSymbol[];
		'o:MessageSymbol': MessageSymbol | MessageSymbol[];
		'o:ActorSequenceSymbol': ActorSequenceSymbol | ActorSequenceSymbol[];
		'o:UMLObjectSequenceSymbol': UMLObjectSequenceSymbol | UMLObjectSequenceSymbol[];
	};
}
