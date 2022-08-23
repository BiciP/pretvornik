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

// Pretvori XML v JS in inicializira branje diagrama
export const parseFile = (file: string) => {
	let parser = new XMLParser({ ignoreAttributes: false });
	let xml = parser.parse(file);

	// Preverimo ustreznost datoteke
	let pdInfo = xml['?PowerDesigner'];
	let pdModel = xml['Model']?.['o:RootObject']?.['c:Children']?.['o:Model'];
	if (!pdInfo || !pdModel) throw new ParserError(PARSE_ERROR_MESSAGE.NOT_A_PD_FILE);

	return {
		info: pdInfo,
		model: parsePdModel(pdModel)
	};
};

// Pretvori diagrame v PlantUML notacijo
// najprej pretvorimo vse objekte v PlantUML notacijo in si zapišemo
// nato začnemo s pretvorbo diagramov
const parsePdModel = (pdModel: object) => {
	// writeFileSync("json.json", JSON.stringify(pdModel));
	// PlantUML definicije PowerDesigner objektov
	let definitions = {};
	console.log(pdModel);

	// V prihodje se bomo po pretvorjenih objektih sklicevali
	// po objektu (o:XXX) in ne po collectionu (c:XXX)
	let colObjMap = {
		'c:Tables': 'o:Table',
		'c:References': 'o:Reference',
		'c:Entities': 'o:Entity',
		'c:Relationships': 'o:Relationship',
		'c:InheritanceLinks': 'o:InheritanceLink',
		'c:Actors': 'o:Actor',
		'c:UseCases': 'o:UseCase',
		'c:UseCaseAssociations': 'o:UseCaseAssociation',
		'c:Generalizations': 'o:Generalization',
		'c:Dependencies': 'o:Dependency',
		'c:ChildTraceabilityLinks': 'o:ExtendedDependency'
	};

	// this should resolve into an object of objects
	// { "c:Tables": { o1: PUMLEntity, ... }, "c:References": { o2: PUMLEntity } }
	Object.keys(colObjMap).forEach((col) => {
		// Check that the column exists
		if (pdModel[col] == null) return;

		// @ts-ignore
		definitions[colObjMap[col]] = PDCollectionResolver(col, pdModel[col], pdModel);
	});

	console.log(pdModel);
	// Seznam pretvorjenih diagramov datoteke
	let converted: any[] = [];

	// START - Pretvorba fizičnih diagramov
	let physicalDiagrams: PDPhysicalDiagram[] = [];
	if (pdModel['c:PhysicalDiagrams']) {
		physicalDiagrams = [].concat(pdModel['c:PhysicalDiagrams']['o:PhysicalDiagram']);
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

	return converted;
};

/*
 * HELPERS
 * */

const PDCollectionParser = {
	'': function () {},

	'c:ChildTraceabilityLinks': function (col) {
		let links: PDExtendedDependency[] = [].concat(col['o:ExtendedDependency']);
		return parseExtendedDependency(links);
	},

	'c:Dependencies': function (col) {
		let deps: PDDependency[] = [].concat(col['o:Dependency']);
		return parseDependencies(deps);
	},

	'c:Generalizations': function (col) {
		let gens: PDGeneralization[] = [].concat(col['o:Generalization']);
		return parseGeneralizations(gens);
	},

	'c:UseCaseAssociations': function (col) {
		let assocs: PDUseCaseAssociation[] = [].concat(col['o:UseCaseAssociation']);
		return parseUseCaseAssociations(assocs);
	},

	'c:Actors': function (col) {
		let actors: PDActor[] = [].concat(col['o:Actor']);
		return parseActors(actors);
	},

	'c:UseCases': function (col) {
		let useCases: PDUseCase[] = [].concat(col['o:UseCase']);
		return parseUseCases(useCases);
	},

	'c:Tables': function (col) {
		let tables: PDTableObject[] = [].concat(col['o:Table']);
		return parseTables(tables);
	},

	'c:References': function (col) {
		let references: PDReferenceObject[] = [].concat(col['o:Reference']);
		return parseReferences(references);
	},

	'c:Entities': function (col, pdModel) {
		let entities = [].concat(col['o:Entity']);
		return parseEntities(entities, pdModel);
	},

	'c:Relationships': function (col) {
		let relationships = [].concat(col['o:Relationship']);
		return parseRelationships(relationships);
	},

	'c:InheritanceLinks': function (col, pdModel) {
		let inheritanceLinks = [].concat(col['o:InheritanceLink']);
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
