import type { IdAttributes, PDObjectDefinition, RefAttributes } from '.';

export interface UseCaseAssociationSymbol extends IdAttributes {
	'a:ArrowStyle': string;
	'c:SourceSymbol': {
		[key: string]: RefAttributes;
	};
	'c:DestinationSymbol': {
		[key: string]: RefAttributes;
	};
	'c:Object': {
		'o:UseCaseAssociation': RefAttributes;
	};
}

export interface DependencySymbol extends IdAttributes {
	'c:SourceSymbol': {
		[key: string]: RefAttributes;
	};
	'c:DestinationSymbol': {
		[key: string]: RefAttributes;
	};
	'c:Object': {
		'o:Dependency': RefAttributes;
	};
}

export interface GeneralizationSymbol extends IdAttributes  {
    'c:SourceSymbol': {
        [key: string]: RefAttributes;
    };
    'c:DestinationSymbol': {
        [key: string]: RefAttributes;
    };
    'c:Object': {
        'o:Generalization': RefAttributes;
    };
}

export interface ActorSymbol extends IdAttributes {
    'c:Object': {
        'o:Actor': RefAttributes;
    };
}

export interface UseCaseSymbol extends IdAttributes  {
    'c:Object': {
        'o:UseCase': RefAttributes;
    };
}

export interface PDUseCaseDiagram extends PDObjectDefinition {
	'c:Symbols': {
		'o:UseCaseAssociationSymbol': UseCaseAssociationSymbol | UseCaseAssociationSymbol[];
		'o:DependencySymbol': DependencySymbol | DependencySymbol[];
		'o:GeneralizationSymbol': GeneralizationSymbol | GeneralizationSymbol[];
		'o:ActorSymbol': ActorSymbol | ActorSymbol[];
		'o:UseCaseSymbol': UseCaseSymbol | UseCaseSymbol[];
	};
}
