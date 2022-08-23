import { getCollectionAsArray } from '$lib/helpers';
import type { RefAttributes } from '$lib/PDTypes';
import type { PDActor } from '$lib/PDTypes/PDActor';
import type { PDDependency } from '$lib/PDTypes/PDDependency';
import type PDExtendedDependency from '$lib/PDTypes/PDExtendedDependency';
import type { PDGeneralization } from '$lib/PDTypes/PDGeneralization';
import type { PDUseCase } from '$lib/PDTypes/PDUseCase';
import type { PDUseCaseAssociation } from '$lib/PDTypes/PDUseCaseAssociation';
import type {
	ActorSymbol,
	DependencySymbol,
	ExtendedDependencySymbol,
	GeneralizationSymbol,
	PDUseCaseDiagram,
	UseCaseAssociationSymbol,
	UseCaseSymbol
} from '$lib/PDTypes/PDUseCaseDiagram';

export function parseUseCaseDiagram(diagram: PDUseCaseDiagram, PDObjects: object) {
	let PUMLDiagram = '@startuml ' + diagram['a:Name'] + '\n\n';

	// parse actors
	let ActorSymbols: ActorSymbol[] = getCollectionAsArray(diagram['c:Symbols']['o:ActorSymbol']);
	ActorSymbols.forEach(
		(ActorSymbol) =>
			(PUMLDiagram += PDObjects['o:Actor'][ActorSymbol['c:Object']['o:Actor']['@_Ref']] + '\n')
	);

	// parse use cases
	PUMLDiagram += `\nrectangle "${diagram['a:Name']}" {\n`;
	let UseCaseSymbols: UseCaseSymbol[] = getCollectionAsArray(
		diagram['c:Symbols']['o:UseCaseSymbol']
	);
	UseCaseSymbols.forEach(
		(UseCaseSymbol) =>
			(PUMLDiagram +=
				'\t' + PDObjects['o:UseCase'][UseCaseSymbol['c:Object']['o:UseCase']['@_Ref']] + '\n')
	);
	PUMLDiagram += `}\n\n`;

	// parse use case associations
	let Associations: UseCaseAssociationSymbol[] = getCollectionAsArray(
		diagram['c:Symbols']['o:UseCaseAssociationSymbol']
	);
	Associations.forEach((Association) => {
		let definition =
			PDObjects['o:UseCaseAssociation'][Association['c:Object']['o:UseCaseAssociation']['@_Ref']] +
			'\n';
		definition = definition.replace(
			'{{ArrowStyle}}',
			Association['a:ArrowStyle'] === 0 ? '--' : '-->'
		);
		PUMLDiagram += definition;
	});

	// parse generalizations
	let Generalizations: GeneralizationSymbol[] = getCollectionAsArray(
		diagram['c:Symbols']['o:GeneralizationSymbol']
	);
	Generalizations.forEach(
		(Gen) =>
			(PUMLDiagram +=
				PDObjects['o:Generalization'][Gen['c:Object']['o:Generalization']['@_Ref']] + '\n')
	);

	// parse dependencies
	let Dependencies: DependencySymbol[] = getCollectionAsArray(
		diagram['c:Symbols']['o:DependencySymbol']
	);
	Dependencies.forEach(
		(Dep) =>
			(PUMLDiagram += PDObjects['o:Dependency'][Dep['c:Object']['o:Dependency']['@_Ref']] + '\n')
	);

	// parse child tracebility links
	let Extended: ExtendedDependencySymbol[] = getCollectionAsArray(
		diagram['c:Symbols']['o:ExtendedDependencySymbol']
	);
	Extended.forEach((Dep) => {
		PUMLDiagram +=
			PDObjects['o:ExtendedDependency'][Dep['c:Object']['o:ExtendedDependency']['@_Ref']] + '\n';
	});

	PUMLDiagram += '\n@enduml';

	return {
		diagram: {
			id: diagram['@_Id'],
			name: diagram['a:Name'],
			type: 'Use Case'
		},
		data: PUMLDiagram
	};
}

export function parseDependencies(deps: PDDependency[]) {
	let obj = {};

	deps.forEach((dep) => {
		let obj1 = getObjectRef(dep['c:Object1']);
		let obj2 = getObjectRef(dep['c:Object2']);
		obj[dep['@_Id']] = `${obj2} ..> ${obj1}${
			dep['a:Stereotype'] ? ` : <<${dep['a:Stereotype']}>>` : ''
		}`;
	});

	return obj;
}

export function parseGeneralizations(generalizations: PDGeneralization[]) {
	let obj = {};

	generalizations.forEach((gen) => {
		let obj1 = getObjectRef(gen['c:Object1']);
		let obj2 = getObjectRef(gen['c:Object2']);
		obj[gen['@_Id']] = `${obj2} --|> ${obj1}`;
	});

	return obj;
}

export function parseUseCaseAssociations(useCaseAssociations: PDUseCaseAssociation[]) {
	let obj = {};

	useCaseAssociations.forEach((assoc) => {
		let obj1 = getObjectRef(assoc['c:Object1']);
		let obj2 = getObjectRef(assoc['c:Object2']);
		obj[assoc['@_Id']] = `${obj1} {{ArrowStyle}} ${obj2}`;
	});

	return obj;
}

export function parseExtendedDependency(extendedDependencies: PDExtendedDependency[]) {
	let obj = {};

	extendedDependencies.forEach((dep) => {
		let obj1 = getObjectRef(dep['c:Object1']);
		let obj2 = getObjectRef(dep['c:Object2']);
		let ster = dep['a:Stereotype'];
		obj[dep['@_Id']] = `${obj1} <.. ${obj2}${ster ? ' : <<' + ster + '>>' : ''}`;
	});

	return obj;
}

export function parseActors(actors: PDActor[]) {
	let obj = {};

	actors.forEach((actor) => {
		obj[actor['@_Id']] = `actor "${actor['a:Name']}" as ${actor['@_Id']}`;
	});

	return obj;
}

export function parseUseCases(useCases: PDUseCase[]) {
	let obj = {};

	useCases.forEach((useCase) => {
		obj[useCase['@_Id']] = `usecase "${useCase['a:Name']}" as ${useCase['@_Id']}`;
	});

	return obj;
}

// Helpers

function getObjectRef(obj: { [key: string]: RefAttributes }) {
	let key = Object.keys(obj)[0];
	return obj[key]['@_Ref'];
}
