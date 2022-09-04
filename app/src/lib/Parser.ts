import { XMLParser } from 'fast-xml-parser';
import { parser, parseReferences, parseTables } from './DiagramParser/Physical';
import ParserError, { PARSE_ERROR_MESSAGE } from './ParseError';
import {
	parseConceptualDiagram,
	parseEntities,
	parseInheritanceLinks,
	parseRelationships
} from './DiagramParser/Conceptual';
import { getCollectionAsArray } from './helpers';
import type { PdInfo } from './types';
import type { PDTableObject } from './PDTypes/PDTable';
import type { PDReferenceObject } from './PDTypes/PDReference';
import type { PDPhysicalDiagram } from './PDTypes/PDPhysicalDiagram';
import type { PDConceptualDiagram } from './PDTypes/PDConceptualDiagram';
import type { PDActor } from './PDTypes/PDActor';
import {
	parseActors,
	parseDependencies,
	parseExtendedDependency,
	parseGeneralizations,
	parseUseCaseAssociations,
	parseUseCaseDiagram,
	parseUseCases
} from './DiagramParser/UseCase';
import type { PDUseCase } from './PDTypes/PDUseCase';
import type { PDUseCaseDiagram } from './PDTypes/PDUseCaseDiagram';
import type { PDUseCaseAssociation } from './PDTypes/PDUseCaseAssociation';
import type { PDGeneralization } from './PDTypes/PDGeneralization';
import type { PDDependency } from './PDTypes/PDDependency';
import type PDExtendedDependency from './PDTypes/PDExtendedDependency';
import type { PDClass } from './PDTypes/ClassDiagram/PDClass';
import {
	parse,
	parseAssociations,
	parseClasses,
	parseInterfaces,
	parseRealizations,
	parseRequireLinks
} from './DiagramParser/Class';
import type { PDClassDiagram } from './PDTypes/ClassDiagram/PDClassDiagram';
import type { PDAssociation } from './PDTypes/ClassDiagram/PDAssociation';
import type { PDRealization } from './PDTypes/ClassDiagram/PDRealization';
import type { PDInterface } from './PDTypes/ClassDiagram/PDInterface';
import type { PDRequireLink } from './PDTypes/ClassDiagram/PDRequireLink';
import type { PDPackage } from './PDTypes/ClassDiagram/PDPackage';
import { parseMessages, parseModelObjects, parseSequenceDiagram } from './DiagramParser/Sequence';
import type { PDMessage } from './PDTypes/Sequence/PDMessage';
import type {
	PDActorShortcut,
	PDMessageShortcut,
	PDShortcutDefinition
} from './PDTypes/Sequence/PDMessageShortcut';
import { mapActorShortcuts, mapMessageShortcuts, mapShortcuts } from './MapShortcuts';

// Pretvori XML v JS in inicializira branje diagrama
export const parseFile = (file: string, returnType: 'PARSE' | 'COL_LIST' = 'PARSE') => {
	let parser = new XMLParser({ ignoreAttributes: false });
	let xml = parser.parse(file);

	// Preverimo ustreznost datoteke
	let pdInfo = xml['?PowerDesigner'];
	let pdModel = xml['Model']?.['o:RootObject']?.['c:Children']?.['o:Model'];
	if (!pdInfo || !pdModel) throw new ParserError(PARSE_ERROR_MESSAGE.NOT_A_PD_FILE);

	// console.log(JSON.stringify(pdModel));
	if (returnType === 'COL_LIST') {
		return {
			model: JSON.parse(JSON.stringify(pdModel)),
			list: getCollectionList(pdModel)
		};
	}

	return {
		info: pdInfo,
		model: parsePdModel(pdModel, null)
	};
};

const getCollectionList = (pdModel: object) => {
	let colMap = {
		'c:Packages': 'o:Package',
		'c:ClassDiagrams': 'o:ClassDiagram',
		'c:UseCaseDiagrams': 'o:UseCaseDiagram',
		'c:PhysicalDiagrams': 'o:PhysicalDiagram',
		'c:ConceptualDiagrams': 'o:ConceptualDiagram',
		'c:SequenceDiagrams': 'o:SequenceDiagram'
	};

	let list = [];
	Object.entries(colMap).forEach(([key, val]) => {
		let cols = getCollectionAsArray(pdModel[key]?.[val]);
		cols.forEach((col) => {
			col.type = val;
			if (val === 'o:Package') {
				col.children = getCollectionList(col);
			}
			col.parent = pdModel;
			list.push(col);
		});
	});
	return list;
};

// Pretvori diagrame v PlantUML notacijo
// najprej pretvorimo vse objekte v PlantUML notacijo in si zapišemo
// nato začnemo s pretvorbo diagramov
export const parsePdModel = (pdModel: object, diagram: any, isPackage = false) => {
	// writeFileSync("json.json", JSON.stringify(pdModel));
	// PlantUML definicije PowerDesigner objektov
	let definitions = {};

	// V prihodje se bomo po pretvorjenih objektih sklicevali
	// po objektu (o:XXX) in ne po collectionu (c:XXX)
	let colObjMap = {
		'c:References': 'o:Reference',
		'c:Tables': 'o:Table',
		'c:Entities': 'o:Entity',
		'c:Relationships': 'o:Relationship',
		'c:InheritanceLinks': 'o:InheritanceLink',
		'c:Actors': 'o:Actor',
		'c:UseCases': 'o:UseCase',
		'c:UseCaseAssociations': 'o:UseCaseAssociation',
		'c:Generalizations': 'o:Generalization',
		'c:Dependencies': 'o:Dependency',
		'c:ChildTraceabilityLinks': 'o:ExtendedDependency',
		'c:Classes': 'o:Class',
		'c:Associations': 'o:Association',
		'c:Realizations': 'o:Realization',
		'c:Interfaces': 'o:Interface',
		'c:RequireLinks': 'o:RequireLink',
		'c:Packages': 'o:Package',
		'c:Model.Objects': 'o:UMLObject',
		'c:Messages': 'o:Message'
	};

	// this should resolve into an object of objects
	// { "c:Tables": { o1: PUMLEntity, ... }, "c:References": { o2: PUMLEntity } }
	Object.keys(colObjMap).forEach((col) => {
		// Check that the column exists
		if (pdModel[col] == null) return;

		// @ts-ignore
		definitions[colObjMap[col]] = PDCollectionResolver(col, pdModel[col], pdModel);
	});

	if (isPackage) {
		// START - Class diagram
		let converted = [];
		let classDiagrams: PDClassDiagram[] = getCollectionAsArray(
			pdModel['c:ClassDiagrams']?.['o:ClassDiagram']
		);
		let classParserResolver = (diagram) =>
			parse(diagram, definitions, isPackage ? pdModel['@_Id'] : false);
		classDiagrams.forEach((d) =>
			isPackage ? (converted = classParserResolver(d)) : converted.push(classParserResolver(d))
		);
		return converted;
		// END - Class diagram
	}

	if (diagram.type === 'o:PhysicalDiagram') return parser(diagram, definitions);
	if (diagram.type === 'o:ClassDiagram') return parse(diagram, definitions, false);
	if (diagram.type === 'o:UseCaseDiagram') return parseUseCaseDiagram(diagram, definitions);
	if (diagram.type === 'o:ConceptualDiagram') return parseConceptualDiagram(diagram, definitions);
	if (diagram.type === 'o:SequenceDiagram') return parseSequenceDiagram(diagram, definitions);
	return null;
	// Seznam pretvorjenih diagramov datoteke
	let converted: any[] = [];

	// START - Pretvorba fizičnih diagramov
	let physicalDiagrams: PDPhysicalDiagram[] = [];
	if (pdModel['c:PhysicalDiagrams']) {
		physicalDiagrams = getCollectionAsArray(pdModel['c:PhysicalDiagrams']?.['o:PhysicalDiagram']);
	}
	let physicalParserResolver = (diagram) => parser(diagram, definitions);
	physicalDiagrams.forEach((diagram) => converted.push(physicalParserResolver(diagram)));
	// END - Pretvorba fizicnih diagramov

	// START - Pretvorba konceptualnih diagramov
	let conceptualDiagrams: PDConceptualDiagram[] = getCollectionAsArray(
		pdModel['c:ConceptualDiagrams']?.['o:ConceptualDiagram']
	);
	let conceptualParserResolver = (diagram) => parseConceptualDiagram(diagram, definitions);
	conceptualDiagrams.forEach((diagram) => converted.push(conceptualParserResolver(diagram)));
	// END - Pretvorba konceptualnih diagramov

	// START - Use Case
	let useCaseDiagrams: PDUseCaseDiagram[] = getCollectionAsArray(
		pdModel['c:UseCaseDiagrams']?.['o:UseCaseDiagram']
	);
	let useCaseParserResolver = (diagram) => parseUseCaseDiagram(diagram, definitions);
	useCaseDiagrams.forEach((diagram) => converted.push(useCaseParserResolver(diagram)));
	// END - Use Case

	// START - Class diagram
	let classDiagrams: PDClassDiagram[] = getCollectionAsArray(
		pdModel['c:ClassDiagrams']?.['o:ClassDiagram']
	);
	let classParserResolver = (diagram) =>
		parse(diagram, definitions, isPackage ? pdModel['@_Id'] : false);
	classDiagrams.forEach((d) =>
		isPackage ? (converted = classParserResolver(d)) : converted.push(classParserResolver(d))
	);
	// END - Class diagram

	return converted;
};

/*
 * HELPERS
 * */

const PDCollectionParser = {
	'': function () {},

	'c:Messages': function (col, pdModel) {
		// parse shortcuts
		let shortcuts: PDMessageShortcut[] = getCollectionAsArray(col?.['o:Shortcut']);
		shortcuts = mapMessageShortcuts(shortcuts, pdModel);

		let msgs: PDMessage[] = getCollectionAsArray(col?.['o:Message']);
		// @ts-ignore
		return parseMessages(msgs.concat(shortcuts));
	},

	'c:Model.Objects': function (col) {
		let objs = getCollectionAsArray(col?.['o:UMLObject']);
		return parseModelObjects(objs);
	},

	'c:Packages': function (col) {
		let obj = {};
		let packages: PDPackage[] = getCollectionAsArray(col?.['o:Package']);
		packages.forEach((p) => (obj[p['@_Id']] = parsePdModel(p, null, true)));
		return obj;
	},

	'c:RequireLinks': function (col) {
		let links: PDRequireLink[] = getCollectionAsArray(col?.['o:RequireLink']);
		return parseRequireLinks(links);
	},

	'c:Interfaces': function (col) {
		let ints: PDInterface[] = getCollectionAsArray(col?.['o:Interface']);
		return parseInterfaces(ints);
	},

	'c:Realizations': function (col) {
		let reals: PDRealization[] = getCollectionAsArray(col?.['o:Realization']);
		return parseRealizations(reals);
	},

	'c:Associations': function (col) {
		let assocs: PDAssociation[] = getCollectionAsArray(col?.['o:Association']);
		return parseAssociations(assocs);
	},

	'c:Classes': function (col) {
		let classes: PDClass[] = getCollectionAsArray(col?.['o:Class']);
		return parseClasses(classes);
	},

	'c:ChildTraceabilityLinks': function (col) {
		let links: PDExtendedDependency[] = getCollectionAsArray(col?.['o:ExtendedDependency']);
		return parseExtendedDependency(links);
	},

	'c:Dependencies': function (col) {
		let deps: PDDependency[] = getCollectionAsArray(col?.['o:Dependency']);
		return parseDependencies(deps);
	},

	'c:Generalizations': function (col) {
		let gens: PDGeneralization[] = getCollectionAsArray(col?.['o:Generalization']);
		return parseGeneralizations(gens);
	},

	'c:UseCaseAssociations': function (col) {
		let assocs: PDUseCaseAssociation[] = getCollectionAsArray(col?.['o:UseCaseAssociation']);
		return parseUseCaseAssociations(assocs);
	},

	'c:Actors': function (col, pdModel) {
		let shortcuts: PDActorShortcut[] = getCollectionAsArray(col?.['o:Shortcut']);
		shortcuts = mapActorShortcuts(shortcuts, pdModel);
		let actors: PDActor[] = getCollectionAsArray(col?.['o:Actor']);
		return parseActors(actors.concat(shortcuts));
	},

	'c:UseCases': function (col) {
		let useCases: PDUseCase[] = getCollectionAsArray(col?.['o:UseCase']);
		return parseUseCases(useCases);
	},

	'c:Tables': function (col, pdModel) {
		// parse shortcuts
		let shortcuts: any[] = getCollectionAsArray(col?.['o:Shortcut']);
		shortcuts = mapShortcuts(shortcuts, pdModel, 'c:Tables', 'o:table');

		let tables: PDTableObject[] = getCollectionAsArray(col?.['o:Table']);
		return parseTables(shortcuts.concat(tables), pdModel);
	},

	'c:References': function (col, pdModel) {
		let cuts = getCollectionAsArray(col?.['o:Shortcut']);
		cuts = mapShortcuts(cuts, pdModel, 'c:References', 'o:Reference');
		let references: PDReferenceObject[] = getCollectionAsArray(col?.['o:Reference']);
		return parseReferences(cuts.concat(references));
	},

	'c:Entities': function (col, pdModel) {
		let entities = getCollectionAsArray(col?.['o:Entity']);
		return parseEntities(entities, pdModel);
	},

	'c:Relationships': function (col) {
		let relationships = getCollectionAsArray(col?.['o:Relationship']);
		return parseRelationships(relationships);
	},

	'c:InheritanceLinks': function (col, pdModel) {
		let inheritanceLinks = getCollectionAsArray(col?.['o:InheritanceLink']);
		return parseInheritanceLinks(inheritanceLinks, pdModel);
	},

	_default: function (collection) {
		const colKey = Object.keys(collection)[0];
		throw new ParserError(`Collection '${colKey}' not implemented.`);
	}
};

// https://github.com/rwaldron/idiomatic.js - 7.A.1.2 Misc - A better switch statement,
const PDCollectionResolver = function () {
	let args, key, delegate;

	// Transform arguments list into an array
	args = [].slice.call(arguments);

	// shift the case key from the arguments
	key = args.shift();

	// Assign the default case handler
	delegate = PDCollectionParser._default;

	// Derive the method to delegate operation to
	if (PDCollectionParser.hasOwnProperty(key)) {
		delegate = PDCollectionParser[key];
	}

	// The scope arg could be set to something specific,
	// in this case, |null| will suffice
	return delegate.apply(null, args);
};
