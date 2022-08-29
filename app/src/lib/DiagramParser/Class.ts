import { getCollectionAsArray, getObjectRef, parseColor } from '$lib/helpers';
import type { PDAssociation } from '$lib/PDTypes/ClassDiagram/PDAssociation';
import type {
	Association,
	Dependency,
	Generalization,
	PDClass
} from '$lib/PDTypes/ClassDiagram/PDClass';
import type {
	AssociationSymbol,
	ClassSymbol,
	GeneralizationSymbol,
	InnerCollectionSymbol,
	InterfaceSymbol,
	PackageSymbol,
	PDClassDiagram,
	PortSymbol,
	RequireLinkSymbol
} from '$lib/PDTypes/ClassDiagram/PDClassDiagram';
import type { PDInterface } from '$lib/PDTypes/ClassDiagram/PDInterface';
import type { Operation } from '$lib/PDTypes/ClassDiagram/PDOther';
import type { PDRealization } from '$lib/PDTypes/ClassDiagram/PDRealization';
import type { PDRequireLink } from '$lib/PDTypes/ClassDiagram/PDRequireLink';
import type { DependencySymbol, ExtendedDependencySymbol } from '$lib/PDTypes/PDUseCaseDiagram';
import type { Attribute } from 'svelte/types/compiler/interfaces';

// global variable to keep track of inner links
let dependencies = {};
let generalizations = {};
let associations = {};

export function parse(diagram: PDClassDiagram, PDObjects: any, packageId = false) {
	let symbolMap = {};
	let PUML;
	if (!packageId) PUML = `@startuml "${diagram['a:Name']}"\n\n`;
	else PUML = `package "${diagram['a:Name']}" as ${packageId} {{COLOR}} {\n`;

	// parse packages
	let Packages: PackageSymbol[] = getCollectionAsArray(diagram['c:Symbols']?.['o:PackageSymbol']);
	Packages.forEach((Package) => {
		let ref = Package['c:Object']['o:Package']['@_Ref'];
		let colorTo = parseColor(Package['a:FillColor']) || parseColor(12648447);
		let colorFrom = parseColor(Package['a:GradientEndColor']) || colorTo;
		let lineColor = parseColor(Package['a:LineColor']) || parseColor(11711154);
		let colorDef = `#${colorFrom}/${colorTo};line:${lineColor}`;
		let def = PDObjects['o:Package'][ref];
		if (!def) return
		def = def.replace('{{COLOR}}', colorDef);
		def = def.replace('\n{{END}}', '{{END}}');
        def = def.replaceAll('\n', '\n\t')
		def = def.replace('{{END}}', '\n');
		PUML += `${def}\n`;
	});

	// parse classes
	let Classses: ClassSymbol[] = getCollectionAsArray(diagram['c:Symbols']?.['o:ClassSymbol']);
	Classses.forEach((symbol) => {
		symbolMap[symbol['@_Id']] = symbol['c:Object']['o:Class']['@_Ref'];
		let colorFrom =
			parseColor(symbol['a:GradientEndColor']) || parseColor(symbol['a:FillColor']) || 'c0ffc0';
		let colorTo = parseColor(symbol['a:FillColor']) || 'c0ffc0';
		let lineColor = parseColor(symbol['a:LineColor']) || '0000ff';
		let colorDef = `#${colorFrom}/${colorTo};line:${lineColor}`;
		let def = PDObjects['o:Class'][symbol['c:Object']['o:Class']['@_Ref']];
		def = def.replace('{{COLOR}}', colorDef);
		PUML += def;

		let Ports: PortSymbol[] = getCollectionAsArray(symbol['c:SubSymbols']?.['o:PortSymbol']);
		if (Ports.length) PUML += '\n';
		Ports.forEach((Port) => {
			let def = `<> ${Port['c:Object']['o:Port']['@_Ref']} /' Port '/\n`;
			def += `${symbol['c:Object']['o:Class']['@_Ref']} - ${Port['c:Object']['o:Port']['@_Ref']}\n`;
			PUML += def;
		});

		PUML += '\n';
	});

	// parse interfaces
	let Interfaces: InterfaceSymbol[] = getCollectionAsArray(
		diagram['c:Symbols']?.['o:InterfaceSymbol']
	);
	Interfaces.forEach((symbol) => {
		symbolMap[symbol['@_Id']] = symbol['c:Object']['o:Interface']['@_Ref'];
		let colorFrom =
			parseColor(symbol['a:GradientEndColor']) || parseColor(symbol['a:FillColor']) || 'c0ffc0';
		let colorTo = parseColor(symbol['a:FillColor']) || 'c0ffc0';
		let lineColor = parseColor(symbol['a:LineColor']) || '0000ff';
		let colorDef = `#${colorFrom}/${colorTo};line:${lineColor}`;
		let def = PDObjects['o:Interface'][symbol['c:Object']['o:Interface']['@_Ref']] + '\n';
		def = def.replace('{{COLOR}}', colorDef);
		PUML += def + '\n';
	});

	// parse associations
	let Assocs: AssociationSymbol[] = getCollectionAsArray(
		diagram['c:Symbols']?.['o:AssociationSymbol']
	);
	Assocs.forEach((symbol) => {
		let color = parseColor(symbol['a:LineColor']);
		let ref = symbol['c:Object']['o:Association']['@_Ref'];
		let def = PDObjects['o:Association'][ref] || associations[ref];
		if (!def) {
			console.warn(`Association not found: ${ref}`);
			return;
		}
		def = def.replace('{{ARROW}}', `[#${color}]`);
		PUML += def;
	});

	// parse dependencies
	let Deps: DependencySymbol[] = getCollectionAsArray(diagram['c:Symbols']?.['o:DependencySymbol']);
	Deps.forEach((dep) => {
		let ref = dep['c:Object']['o:Dependency']['@_Ref'];
		let color = parseColor(dep['a:LineColor']) || parseColor(16744576);
		let def = PDObjects['o:Dependency'][ref] || dependencies[ref];
		if (!def) {
			console.warn(`Dependency not found: ${ref}`);
			return;
		}
		def = def.replace('{{ARROW}}', `.[#${color}].>`);
		PUML += def;
	});

	// extended dependencies
	let Extended: ExtendedDependencySymbol[] = getCollectionAsArray(
		diagram['c:Symbols']?.['o:ExtendedDependencySymbol']
	);
	Extended.forEach((dep) => {
		let ref = dep['c:Object']['o:ExtendedDependency']['@_Ref'];
		let color = parseColor(dep['a:LineColor']) || parseColor(16744576);
		let def = PDObjects['o:ExtendedDependency'][ref];
		if (!def) {
			console.warn(`Extended dependency not found: ${ref}`);
			return;
		}
		def = def.replace('{{ARROW}}', `.[#${color}].>`);
		PUML += def;
	});

	// parse inner links (inner dependencies)
	let InnerCols: InnerCollectionSymbol[] = getCollectionAsArray(
		diagram['c:Symbols']?.['o:InnerCollectionSymbol']
	);
	InnerCols.forEach((col) => {
		let obj1 = symbolMap[getObjectRef(col['c:SourceSymbol'])];
		let obj2 = symbolMap[getObjectRef(col['c:DestinationSymbol'])];
		let color = parseColor(col['a:LineColor']);
		if (!obj1 || !obj2) return;
		let def = `${obj2} -[#${color}]-+ ${obj1}\n`;
		PUML += def;
	});

	// parse realizations
	let Realizations: GeneralizationSymbol[] = getCollectionAsArray(
		diagram['c:Symbols']?.['o:GeneralizationSymbol']
	);
	Realizations.forEach((symbol) => {
		let color = parseColor(symbol['a:LineColor']) || '000000';
		let type = Object.keys(symbol['c:Object'])[0];
		let ref = getObjectRef(symbol['c:Object']);
		let def, arrow;

		if (type === 'o:Generalization') {
			def = generalizations[ref] || PDObjects['o:Generalization'][ref];
			arrow = `-[#${color}]-|>`;
		} else if (type === 'o:Realization') {
			def = PDObjects['o:Realization'][ref];
			arrow = `.[#${color}].|>`;
		}

		if (!def) {
			console.warn(`Realization/generalization not found: ${ref}`);
			return;
		}
		def = def.replace('{{ARROW}}', arrow);
		PUML += def;
	});

	// parse require links
	let Links: RequireLinkSymbol[] = getCollectionAsArray(
		diagram['c:Symbols']?.['o:RequireLinkSymbol']
	);
	Links.forEach((symbol) => {
		let ref = symbol['c:Object']['o:RequireLink']['@_Ref'];
		let color = parseColor(symbol['a:LineColor']) || parseColor(16744576);
		let def = PDObjects['o:RequireLink'][ref];
		if (!def) {
			console.warn(`Require links not found: ${ref}`);
			return;
		}
		def = def.replace('{{ARROW}}', `-[#${color}]-x`);
		PUML += def;
	});

	if (!packageId) PUML += '\n@enduml';
	else PUML += '{{END}}}\n';

	// return only PlantUML notation if this is a package
	if (packageId) return PUML;

	return {
		diagram: {
			id: diagram['@_Id'],
			name: diagram['a:Name'],
			type: 'Class'
		},
		data: PUML
	};
}

export function parseClasses(classes: PDClass[]) {
	let obj = {};

	function parseClass(cl: PDClass, parent = null) {
		let name;
		if (parent) {
			name = `${parent.name}::${cl['a:Name']}`;
		} else {
			name = cl['a:Name'];
		}
		cl.name = name;

		let innerClasses = getCollectionAsArray(cl['c:InnerClasses']?.['o:Class']);
		innerClasses.forEach((c) => parseClass(c, cl));

		let innerDeps: Dependency[] = getCollectionAsArray(cl['c:InnerDependencies']?.['o:Dependency']);
		innerDeps.forEach((dep) => {
			let obj1 = getObjectRef(dep['c:Object1']);
			let obj2 = getObjectRef(dep['c:Object2']);
			dependencies[dep['@_Id']] = `${obj2} {{ARROW}} ${obj1}\n`;
		});

		let innerAssocs: Association[] = getCollectionAsArray(
			cl['c:InnerAssociations']?.['o:Association']
		);
		innerAssocs.forEach((assoc) => {
			let obj1 = getObjectRef(assoc['c:Object1']);
			let obj2 = getObjectRef(assoc['c:Object2']);
			let obj1Role = assoc['a:RoleAIndicator'];
			let arrow;
			if (obj1Role) {
				arrow = obj1Role === 'A' ? 'o-{{ARROW}}->' : '*-{{ARROW}}->';
			} else {
				arrow = '-{{ARROW}}->';
			}

			associations[assoc['@_Id']] = `${obj2} ${arrow} ${obj1}\n`;
		});

		let innerGens: Generalization[] = getCollectionAsArray(
			cl['c:InnerGeneralizations']?.['o:Generalization']
		);
		innerGens.forEach((gen) => {
			let obj1 = getObjectRef(gen['c:Object1']);
			let obj2 = getObjectRef(gen['c:Object2']);
			generalizations[gen['@_Id']] = `${obj2} {{ARROW}} ${obj1}\n`;
		});

		let puml = `class "${name}" as ${cl['@_Id']} {{COLOR}} {\n`;

		puml += parseAttributes(getCollectionAsArray(cl['c:Attributes']?.['o:Attribute']));
		puml += parseOperations(getCollectionAsArray(cl['c:Operations']?.['o:Operation']));
		// todo: parse annotations if needed (same as interfaces)

		puml += '}\n';
		obj[cl['@_Id']] = puml;
	}

	classes.forEach((c) => parseClass(c));
	return obj;
}

export function parseAssociations(assocs: PDAssociation[]) {
	let obj = {};

	assocs.forEach((assoc) => {
		let obj1 = getObjectRef(assoc['c:Object1']);
		let obj2 = getObjectRef(assoc['c:Object2']);
		let obj1Role = assoc['a:RoleAIndicator'];
		let arrow;
		if (obj1Role) {
			arrow = obj1Role === 'A' ? 'o-{{ARROW}}->' : '*-{{ARROW}}->';
		} else {
			arrow = '-{{ARROW}}->';
		}
		obj[assoc['@_Id']] = `${obj2} ${arrow} ${obj1}\n`;
	});

	return obj;
}

export function parseRealizations(reals: PDRealization[]) {
	let obj = {};

	reals.forEach((real) => {
		let obj1 = getObjectRef(real['c:Object1']);
		let obj2 = getObjectRef(real['c:Object2']);
		obj[real['@_Id']] = `${obj2} {{ARROW}} ${obj1}\n`;
	});

	return obj;
}

export function parseInterfaces(interfaces: PDInterface[]) {
	let obj = {};

	function parseInterface(int: PDInterface, parent = null) {
		let name;
		if (parent) {
			name = `${parent.name}::${int['a:Name']}`;
		} else {
			name = int['a:Name'];
		}
		int.name = name;

		let inner: PDInterface[] = getCollectionAsArray(int['c:InnerInterfaces']?.['o:Interface']);
		inner.forEach((item) => parseInterface(item, int));

		let puml = `interface "${name}" as ${int['@_Id']} {{COLOR}} {\n`;

		puml += parseAttributes(getCollectionAsArray(int['c:Attributes']?.['o:Attribute']));
		puml += parseOperations(getCollectionAsArray(int['c:Operations']?.['o:Operation']));
		// todo: parse annotations if needed

		puml += '}\n';
		obj[int['@_Id']] = puml;
	}

	interfaces.forEach((int) => parseInterface(int));

	return obj;
}

export function parseRequireLinks(links: PDRequireLink[]) {
	let obj = {};

	links.forEach((link) => {
		let obj1 = link['c:Object1']['o:Interface']['@_Ref'];
		let obj2 = link['c:Object2']['o:Class']['@_Ref'];
		obj[link['@_Id']] = `${obj2} {{ARROW}} ${obj1}\n`;
	});

	return obj;
}

/**
 * HELPERS
 */

function parseOperations(operations: Operation[]) {
	let puml = '';
	operations.forEach((op) => {
		let parsed = '';
		let name = op['a:Name'];
		let returnType = op['a:ReturnType'];
		let visibility = op['a:Operation.Visibility']?.replace('*', '~') || '+';
		if (visibility) parsed += `${visibility} `;
		parsed += `${name} () : ${returnType || 'void'}`;
		puml += `\t${parsed}\n`;
	});
	return puml;
}

function parseAttributes(attributes: Attribute[]) {
	let puml = '';
	attributes.forEach((atr) => {
		let visibility = atr['a:Attribute.Visibility']?.replace('*', '~') || '+';
		let name = atr['a:Name'];
		let type = atr['a:DataType'];
		let def = atr['a:InitialValue'];
		let parsed = ``;
		if (visibility) parsed += `${visibility} `;
		parsed += name;
		if (type != null) parsed += ` : ${type}`;
		if (def != null) parsed += ` = ${def}`;
		puml += `\t${parsed}\n`;
	});
	return puml;
}
