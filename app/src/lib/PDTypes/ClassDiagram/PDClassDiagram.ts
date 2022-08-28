import type { IdAttributes, PDObjectDefinition, RefAttributes } from '..';

export interface ObjectRef {
	[key: string]: RefAttributes;
}

export interface InnerCollectionSymbol extends IdAttributes {
	'a:ArrowStyle': 3840;
	'a:LineColor': number;
	'a:ShadowColor': number;
	'c:SourceSymbol': ObjectRef;
	'c:DestinationSymbol': ObjectRef;
}

export interface GeneralizationSymbol extends IdAttributes {
	'a:ArrowStyle': 7;
	'a:LineColor': number;
	'a:DashStyle': number;
	'a:ShadowColor': number;
	'a:AutomaticRoutingState'?: number;
	'c:SourceSymbol': ObjectRef;
	'c:DestinationSymbol': ObjectRef;
	'c:Object': ObjectRef;
}

export interface AssociationSymbol extends IdAttributes {
	'a:ArrowStyle': 8;
	'a:LineColor': number;
	'a:ShadowColor': number;
	'c:SourceSymbol': ObjectRef;
	'c:DestinationSymbol': ObjectRef;
	'a:AutomaticRoutingState'?: number;
	'c:Object': {
		'o:Association': RefAttributes;
	};
}

export interface DependencySymbol extends IdAttributes {
    'a:ArrowStyle': 8;
    'a:LineColor': number;
    'a:ShadowColor': number;
    'c:SourceSymbol': ObjectRef;
    'c:DestinationSymbol':ObjectRef;
    'c:Object': {
        'o:Dependency': RefAttributes;
    };
}

export interface RequireLinkSymbol extends IdAttributes {
    'a:ArrowStyle': 51;
    'a:LineColor': number;
    'a:ShadowColor': number;
    'c:SourceSymbol': ObjectRef;
    'c:DestinationSymbol': ObjectRef;
    'c:Object': {
        'o:RequireLink': RefAttributes;
    };
}

export interface ExtendedDependencySymbol extends IdAttributes {
    'a:ArrowStyle': 8;
    'a:LineColor': number;
    'a:ShadowColor': number;
    'c:SourceSymbol': ObjectRef;
    'c:DestinationSymbol': ObjectRef;
    'c:Object': {
        'o:ExtendedDependency': RefAttributes;
    };
}

export interface PortSymbol extends IdAttributes {
    'a:LineColor': number;
    'a:FillColor': number;
    'a:GradientEndColor'?: number;
    'c:Object': {
        'o:Port': RefAttributes;
    };
}

export interface ClassSymbol extends IdAttributes {
    'a:LineColor': number;
    'a:FillColor': number;
    'a:GradientEndColor'?: number;
    'c:SubSymbols'?: {
        'o:PortSymbol': PortSymbol | PortSymbol[];
    };
    'c:Object': {
        'o:Class': RefAttributes;
    };
}

export interface InterfaceSymbol extends IdAttributes {
    'a:LineColor': number;
    'a:FillColor': number;
    'a:GradientEndColor'?: number;
    'c:Object': {
        'o:Interface': RefAttributes;
    };
}

export interface PackageSymbol extends IdAttributes {
    'a:LineColor': number;
    'a:FillColor': number;
    'a:GradientEndColor'?: number;
    'c:Object': {
        'o:Package': RefAttributes;
    };
}

export interface PDClassDiagram extends PDObjectDefinition {
	'c:Symbols': {
		'o:InnerCollectionSymbol': InnerCollectionSymbol | InnerCollectionSymbol[];
		'o:GeneralizationSymbol': GeneralizationSymbol | GeneralizationSymbol[];
		'o:AssociationSymbol': AssociationSymbol | AssociationSymbol[];
		'o:DependencySymbol': DependencySymbol | DependencySymbol[];
		'o:RequireLinkSymbol': RequireLinkSymbol | RequireLinkSymbol[];
		'o:ExtendedDependencySymbol': ExtendedDependencySymbol | ExtendedDependencySymbol[];
		'o:ClassSymbol': ClassSymbol | ClassSymbol[];
		'o:InterfaceSymbol': InterfaceSymbol | InterfaceSymbol[];
		'o:PackageSymbol': PackageSymbol | PackageSymbol[];
	};
}
