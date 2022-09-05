import { get } from 'svelte/store';
import { parseClass, parseInterface } from './DiagramParser/Class';
import {
	getRelationshipArrow,
	parseAssociation,
	parseEntities,
	parseEntity
} from './DiagramParser/Conceptual';
import { parser, parseReference, parseTable, parseTables } from './DiagramParser/Physical';
import { getCollectionAsArray, getPosition, parseColor } from './helpers';
import { parseFile } from './Parser';

export class PDParser {
	DiagramList: any[];
	PDModel: object;
	private PDObjects: object;
	private PDSymbols: object;
	SequenceParser: () => void;
	CurrentDiagram: any;
	SequenceEvents: any[];

	constructor(PDFile: string) {
		let { model, list } = parseFile(PDFile, 'COL_LIST');
		console.log(model);
		this.PDModel = model;
		this.DiagramList = list;
		this.PDObjects = {};
		this.PDSymbols = {};
		this.parseObjects(this.PDModel);
		this.parseReferences(this.PDModel);
	}

	parseDiagram(ObjectID: string) {
		let Diagram = this.findDiagram(ObjectID);

		if (!Diagram) {
			throw new Error(`Diagram not found: ${ObjectID}`);
		}

		this.CurrentDiagram = Diagram;
		let PUML = `@startuml ${Diagram['a:Name']}\n`;

		if (Diagram['x:Type'] === 'o:PhysicalDiagram') {
			PUML += `hide circle\nskinparam linetype ortho\n`;
		} else if (
			Diagram['x:Type'] === 'o:ConceptualDiagram' ||
			Diagram['x:Type'] === 'o:ClassDiagram'
		) {
			PUML += `hide circle\n`;
		} else if (Diagram['x:Type'] === 'o:UseCaseDiagram') {
			PUML += `left to right direction\n`;
		} else if (Diagram['x:Type'] === 'o:SequenceDiagram') {
			this.SequenceEvents = [];
		} else {
			console.log(Diagram['x:Type']);
		}

		PUML += '\n';
		PUML += this.parseSymbols(Diagram);

		PUML += '\n@enduml';
		return PUML
	}

	private parseObjects(Model) {
		let ColTypes = Object.keys(colObjMap);

		ColTypes.forEach((ColType) => {
			let ObjTypes = Object.keys(Model[ColType] || {});
			ObjTypes.forEach((ObjType) => {
				let PDCol = Model[ColType][ObjType];
				let Collection = getCollectionAsArray(PDCol);
				if (!Collection.length) return;
				this.PDObjects[ObjType] = this.PDObjects[ObjType] || {};
				Collection.forEach((item) => {
					if (ObjType === 'o:Class') {
						this.parseClass(item);
					} else if (ObjType === 'o:Interface') {
						this.parseInterface(item);
					} else {
						this.PDObjects[ObjType][item['@_Id']] = item;
					}
				});
			});
		});

		let PDPackages = Model['c:Packages']?.['o:Package'];
		let Packages = getCollectionAsArray(PDPackages);
		Packages.forEach((Package) => this.parseObjects(Package));
	}

	private parseClass(object, parentName = '') {
		let ObjType = 'o:Class';
		if (parentName) object['a:Name'] = `${parentName}::${object['a:Name']}`;
		this.PDObjects[ObjType][object['@_Id']] = object;
		let Inner = getCollectionAsArray(object['c:InnerClasses']?.['o:Class']);
		Inner.forEach((item) => this.parseClass(item, object['a:Name']));

		this.PDObjects['o:Dependency'] = this.PDObjects['o:Dependency'] || {};
		let InnerDeps = getCollectionAsArray(object['c:InnerDependencies']?.['o:Dependency']);
		InnerDeps.forEach((innerDep) => {
			this.PDObjects['o:Dependency'][innerDep['@_Id']] = innerDep;
		});

		this.PDObjects['o:Association'] = this.PDObjects['o:Association'] || {};
		let InnerAssocs = getCollectionAsArray(object['c:InnerAssociations']?.['o:Association']);
		InnerAssocs.forEach((innerAssoc) => {
			this.PDObjects['o:Association'][innerAssoc['@_Id']] = innerAssoc;
		});

		this.PDObjects['o:Generalization'] = this.PDObjects['o:Generalization'] || {};
		let InnerGens = getCollectionAsArray(object['c:InnerGeneralizations']?.['o:Generalization']);
		InnerGens.forEach((gen) => {
			this.PDObjects['o:Generalization'][gen['@_Id']] = gen;
		});

		this.PDObjects['o:Port'] = this.PDObjects['o:Port'] || {};
		let Ports = getCollectionAsArray(object['c:Ports']?.['o:Port']);
		Ports.forEach((port) => (this.PDObjects['o:Port'][port['@_Id']] = port));
	}

	private parseInterface(object, parentName = '') {
		let ObjType = 'o:Interface';
		if (parentName) object['a:Name'] = `${parentName}::${object['a:Name']}`;
		this.PDObjects[ObjType][object['@_Id']] = object;
		let Inner = getCollectionAsArray(object['c:InnerInterfaces']?.['o:Interface']);
		Inner.forEach((item) => this.parseInterface(item, object['a:Name']));
	}

	private parseReferences(Model) {
		let ReferenceCol = Model['c:References'];
		if (ReferenceCol) {
			Object.keys(ReferenceCol).forEach((RefType) => {
				let Col = getCollectionAsArray(ReferenceCol[RefType]);
				if (RefType === 'o:Reference') {
					Col.forEach((Ref) => parseReference(Ref));
				} else if (RefType === 'o:Shortcut') {
					// shortcut references
					Col.forEach((Ref) => {
						let Target = this.findObjectByObjectID(Ref['a:TargetID'], 'o:Reference');
						if (!Target) {
							console.warn(`Shortcut target not found: ${Ref['@_Id']}`);
							return;
						}

						let ChildTable = this.findObjectByRef(Target['c:ChildTable']);
						let ParentTable = this.findObjectByRef(Target['c:ParentTable']);

						let ExtremitiesCol = Ref['c:LinkShortcutExtremities'];
						let Extremities = [];
						let ExtremitiesRef = {};
						Object.keys(ExtremitiesCol).forEach((ExType) => {
							let Col = getCollectionAsArray(ExtremitiesCol[ExType]);
							Col.forEach((Item) => {
								let obj = {};
								obj[ExType] = Item;
								let Obj = this.findObjectByRef(obj);
								ExtremitiesRef[Obj['@_Id']] = obj;
								Extremities.push(Obj);
							});
						});

						let ChildExtremity, ParentExtremity;
						if (ChildTable['a:TargetID']) {
							ChildExtremity = Extremities.find(
								(Item) => Item['a:ObjectID'] === ChildTable['a:TargetID']
							);
						} else {
							ChildExtremity = Extremities.find(
								(Item) => Item['a:TargetID'] === ChildTable['a:ObjectID']
							);
						}

						if (ParentTable['a:TargetID']) {
							ParentExtremity = Extremities.find(
								(Item) => Item['a:ObjectID'] === ParentTable['a:TargetID']
							);
						} else {
							ParentExtremity = Extremities.find(
								(Item) => Item['a:TargetID'] === ParentTable['a:ObjectID']
							);
						}

						Target['c:ChildTable'] = ExtremitiesRef[ChildExtremity['@_Id']];
						Target['c:ParentTable'] = ExtremitiesRef[ParentExtremity['@_Id']];

						// @ts-ignore
						parseReference(Target);
					});
				}
			});
		}

		let PDPackages = Model['c:Packages']?.['o:Package'];
		let Packages = getCollectionAsArray(PDPackages);
		Packages.forEach((Package) => this.parseReferences(Package));
	}

	private findObjectByObjectID(ObjectID, ObjType): object | null {
		let Objects = this.PDObjects[ObjType];
		let Values = Object.values(Objects || {});
		for (let Obj of Values) {
			// @ts-ignore
			if (Obj['a:ObjectID'] === ObjectID) return Obj;
		}
		return null;
	}

	private findObjectByRef(RefObject) {
		let ObjType = Object.keys(RefObject)[0];
		let ObjRef = RefObject[ObjType]['@_Ref'];
		return this.PDObjects[ObjType]?.[ObjRef];
	}

	private findDiagram(ObjectID: string, Package: object = null) {
		let Model = Package || this.PDModel;
		let DiagramTypes = Object.keys(colMap);
		let Diagram;

		for (let DiagramType of DiagramTypes) {
			let ObjectType = colMap[DiagramType];
			let PDCollection = Model[DiagramType]?.[ObjectType];
			let Diagrams: any[] = getCollectionAsArray(PDCollection);
			Diagram = Diagrams.find((item) => item['a:ObjectID'] === ObjectID);
			if (Diagram) {
				Diagram['x:Type'] = ObjectType;
				break;
			}
		}

		if (!Diagram) {
			let PackageCol = Model['c:Packages']?.['o:Package'];
			let Packages = getCollectionAsArray(PackageCol);
			for (let Package of Packages) {
				Diagram = this.findDiagram(ObjectID, Package);
				if (Diagram) break;
			}
		}

		return Diagram;
	}

	private parseSymbols(Diagram: object) {
		let PUML = '';
		let PDSymbols = Diagram['c:Symbols'] || {};
		let Symbols = Object.keys(this.SymbolParserMap);
		for (let Symbol of Symbols) {
			if (Diagram['x:Type'] === 'o:UseCaseDiagram' && Symbol === 'o:UseCaseSymbol') {
				PUML += `rectangle ${Diagram['a:Name']} {\n`;
			}
			let ParseSymbols = this.SymbolParserMap[Symbol];
			if (!ParseSymbols) {
				if (Diagram['x:Type'] === 'o:UseCaseDiagram' && Symbol === 'o:PackageSymbol') {
					PUML += '}\n\n';
				}
				continue;
			}
			let col = getCollectionAsArray(PDSymbols[Symbol]);
			PUML += ParseSymbols(col);
			if (Diagram['x:Type'] === 'o:UseCaseDiagram' && Symbol === 'o:PackageSymbol') {
				PUML += '}\n\n';
			}
		}

		if (Diagram['x:Type'] === 'o:SequenceDiagram') {
			let Events = this.SequenceEvents.sort((a, b) => b.time - a.time);
			Events.forEach(({ def }) => (PUML += def + '\n'));
		}

		return PUML;
	}

	ViewSymbolParser(symbols) {
		let puml = '';
		this.PDSymbols['o:ViewSymbol'] = this.PDSymbols['o:ViewSymbol'] || {};

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:View');
			let colorFrom = getColor(symbol, ['a:GradientEndColor', 'a:FillColor'], 'ffffff');
			let colorTo = getColor(symbol, ['a:FillColor'], 'ffffc0');
			let lineColor = getColor(symbol, ['a:LineColor'], 'b2b2b2');
			let colorDef = `#${colorFrom}/${colorTo};line:${lineColor}`;
			let def = `class "${object['a:Name']}" as ${object['@_Id']} ${colorDef} {\n}`;
			puml += def + '\n\n';
			this.PDSymbols['o:ViewSymbol'][symbol['@_Id']] = object['@_Id'];
		});

		return puml;
	}

	ProcedureSymbolParser(symbols) {
		let puml = '';
		this.PDSymbols['o:ProcedureSymbol'] = this.PDSymbols['o:ProcedureSymbol'] || {};

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:Procedure');
			let colorFrom = getColor(symbol, ['a:GradientEndColor', 'a:FillColor'], 'ffffff');
			let colorTo = getColor(symbol, ['a:FillColor'], 'ffffc0');
			let lineColor = getColor(symbol, ['a:LineColor'], 'b2b2b2');
			let colorDef = `#${colorFrom}/${colorTo};line:${lineColor}`;
			let def = `class "${object['a:Name']}" as ${object['@_Id']} ${colorDef} {\n}`;
			puml += def + '\n\n';
			this.PDSymbols['o:ProcedureSymbol'][symbol['@_Id']] = object['@_Id'];
		});

		return puml;
	}

	ExtendedDepSymbolParser(symbols) {
		let puml = '';

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:ExtendedDependency');

			let SourceType = Object.keys(symbol['c:SourceSymbol'])[0];
			let SourceRef = symbol['c:SourceSymbol'][SourceType]['@_Ref'];
			let Source = this.PDSymbols[SourceType][SourceRef];

			let DestType = Object.keys(symbol['c:DestinationSymbol'])[0];
			let DestRef = symbol['c:DestinationSymbol'][DestType]['@_Ref'];
			let Dest = this.PDSymbols[DestType][DestRef];

			let LineColor = getColor(symbol, ['a:LineColor'], '0000ff');
			let Name = object['a:Name'];
			let Stereotype = object['a:Stereotype'];
			let title = '';
			if (Stereotype) title = `: <<${Stereotype}>>`;
			else if (Name) title = `: ${Name}`;
			let def = `${Source} .[#${LineColor}].> ${Dest}${title}`;

			puml += def + '\n';
		});

		return puml;
	}

	PackageSymbolParser(symbols) {
		let puml = '';
		let tab = this.CurrentDiagram['x:Type'] === 'o:UseCaseDiagram' ? '\t' : '';
		this.PDSymbols['o:PackageSymbol'] = this.PDSymbols['o:PackageSymbol'] || {};

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:Package');
			let colorFrom = getColor(symbol, ['a:GradientEndColor', 'a:FillColor'], 'ffffff');
			let colorTo = getColor(symbol, ['a:FillColor'], 'ffffc0');
			let lineColor = getColor(symbol, ['a:LineColor'], 'b2b2b2');
			let colorDef = `#${colorFrom}/${colorTo};line:${lineColor}`;
			let def = `${tab}package "${object['a:Name']}" as ${object['@_Id']} ${colorDef} {\n}`;
			puml += def + '\n';
			this.PDSymbols['o:PackageSymbol'][symbol['@_Id']] = object['@_Id'];
		});

		return puml + (this.CurrentDiagram['x:Type'] === 'o:UseCaseDiagram' ? '' : '\n');
	}

	TableSymbolParser(symbols) {
		let puml = '';
		this.PDSymbols['o:TableSymbol'] = this.PDSymbols['o:TableSymbol'] || {};

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:Table');
			let def = parseTable(object);
			let colorFrom = getColor(symbol, ['a:GradientEndColor', 'a:FillColor'], 'c0ffc0');
			let colorTo = getColor(symbol, ['a:FillColor'], 'c0ffc0');
			let lineColor = getColor(symbol, ['a:LineColor'], '0000ff');
			let colorDef = `#${colorFrom}/${colorTo};line:${lineColor}`;
			def = def.replace('{{COLOR}}', colorDef);
			puml += def + '\n';
			this.PDSymbols['o:TableSymbol'][symbol['@_Id']] = object['@_Id'];
		});

		return puml;
	}

	ReferenceSymbolParser(symbols) {
		let puml = '';

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:Reference');
			// let def = parseReference(object);
			let SourceType = Object.keys(symbol['c:SourceSymbol'])[0];
			let SourceRef = symbol['c:SourceSymbol'][SourceType]['@_Ref'];
			let Source = this.PDSymbols[SourceType][SourceRef];

			let DestType = Object.keys(symbol['c:DestinationSymbol'])[0];
			let DestRef = symbol['c:DestinationSymbol'][DestType]['@_Ref'];
			let Dest = this.PDSymbols[DestType][DestRef];

			let Name = object['a:Name'];
			let LineColor = getColor(symbol, ['a:LineColor'], '0000ff');
			let def = `${Source} -[#${LineColor}]-> ${Dest}: ${Name}`;

			puml += def + '\n';
		});

		return puml;
	}

	ViewReferenceSymbolParser(symbols) {
		let puml = '';

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:ViewReference');

			let SourceType = Object.keys(symbol['c:SourceSymbol'])[0];
			let SourceRef = symbol['c:SourceSymbol'][SourceType]['@_Ref'];
			let Source = this.PDSymbols[SourceType][SourceRef];

			let DestType = Object.keys(symbol['c:DestinationSymbol'])[0];
			let DestRef = symbol['c:DestinationSymbol'][DestType]['@_Ref'];
			let Dest = this.PDSymbols[DestType][DestRef];

			let Name = object['a:Name'];
			let LineColor = getColor(symbol, ['a:LineColor'], '0000ff');
			let def = `${Source} -[#${LineColor}]-> ${Dest}: ${Name}`;

			puml += def + '\n';
		});

		return puml;
	}

	ActorSymbolParser(symbols) {
		let puml = '';
		this.PDSymbols['o:ActorSymbol'] = this.PDSymbols['o:ActorSymbol'] || {};

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:Actor');
			let color = getColorDefinition(symbol);
			let def = `actor "${object['a:Name']}" as ${object['@_Id']} ${color};line.bold\n`;
			puml += def;
			this.PDSymbols['o:ActorSymbol'][symbol['@_Id']] = object['@_Id'];
		});

		return `${puml}\n`;
	}

	UseCaseSymbolParser(symbols) {
		let puml = '';
		this.PDSymbols['o:UseCaseSymbol'] = this.PDSymbols['o:UseCaseSymbol'] || {};

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:UseCase');
			let color = getColorDefinition(symbol);
			let def = `\tusecase "${object['a:Name']}" as ${object['@_Id']} ${color};line.bold\n`;
			puml += def;
			this.PDSymbols['o:UseCaseSymbol'][symbol['@_Id']] = object['@_Id'];
		});

		return puml;
	}

	DependencySymbolParser(symbols) {
		let puml = '';

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:Dependency');

			let SourceType = Object.keys(symbol['c:SourceSymbol'])[0];
			let SourceRef = symbol['c:SourceSymbol'][SourceType]['@_Ref'];
			let Source = this.PDSymbols[SourceType][SourceRef];

			let DestType = Object.keys(symbol['c:DestinationSymbol'])[0];
			let DestRef = symbol['c:DestinationSymbol'][DestType]['@_Ref'];
			let Dest = this.PDSymbols[DestType][DestRef];

			let Stereotype = object['a:Stereotype'];
			Stereotype = Stereotype ? `: <<${Stereotype}>>` : '';
			let color = parseColor(symbol['a:LineColor']);
			let def = `${Source} .[#${color}].> ${Dest}${Stereotype}`;

			puml += def + '\n';
		});

		return puml;
	}

	GeneralizationSymbolParser(symbols) {
		let puml = '';

		symbols.forEach((symbol) => {
			let Type = Object.keys(symbol['c:Object'])[0];
			let Arrow = Type === 'o:Realization' ? '.[#COLOR].|>' : '-[#COLOR]-|>';

			let SourceType = Object.keys(symbol['c:SourceSymbol'])[0];
			let SourceRef = symbol['c:SourceSymbol'][SourceType]['@_Ref'];
			let Source = this.PDSymbols[SourceType][SourceRef];

			let DestType = Object.keys(symbol['c:DestinationSymbol'])[0];
			let DestRef = symbol['c:DestinationSymbol'][DestType]['@_Ref'];
			let Dest = this.PDSymbols[DestType][DestRef];

			let color = parseColor(symbol['a:LineColor']);
			Arrow = Arrow.replace('COLOR', color);
			let def = `${Source} ${Arrow} ${Dest}`;

			puml += def + '\n';
		});

		return puml;
	}

	UCAssociationSymbolParser(symbols) {
		let puml = '';

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:UseCaseAssociation');

			let SourceType = Object.keys(symbol['c:SourceSymbol'])[0];
			let SourceRef = symbol['c:SourceSymbol'][SourceType]['@_Ref'];
			let Source = this.PDSymbols[SourceType][SourceRef];

			let DestType = Object.keys(symbol['c:DestinationSymbol'])[0];
			let DestRef = symbol['c:DestinationSymbol'][DestType]['@_Ref'];
			let Dest = this.PDSymbols[DestType][DestRef];

			let Name = object['a:Name'];
			let color = parseColor(symbol['a:LineColor']);
			let Line = symbol['a:ArrowStyle'] === 0 ? `-[#${color}]-` : `-[#${color}]->`;
			let def = `${Source} ${Line} ${Dest}: ${Name}`;

			puml += def + '\n';
		});

		return puml;
	}

	EntitySymbolParser(symbols) {
		let puml = '';
		this.PDSymbols['o:EntitySymbol'] = this.PDSymbols['o:EntitySymbol'] || {};

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:Entity');
			let color = getColorDefinition(symbol);
			let def = parseEntity(object, this.PDObjects['o:DataItem']);
			def = def.replace('{{COLOR}}', color);
			puml += def;
			this.PDSymbols['o:EntitySymbol'][symbol['@_Id']] = object['@_Id'];
		});

		return puml;
	}

	AssociationSymbolParser(symbols) {
		let puml = '';
		if (this.CurrentDiagram['x:Type'] === 'o:ConceptualDiagram') {
			this.PDSymbols['o:AssociationSymbol'] = this.PDSymbols['o:AssociationSymbol'] || {};

			symbols.forEach((symbol) => {
				let object = this.getSymbolObject(symbol, 'o:Association');
				let color = getColorDefinition(symbol);
				let def = parseAssociation(object, this.PDObjects['o:DataItem']);
				def = def.replace('{{COLOR}}', color);

				puml += def;
				this.PDSymbols['o:AssociationSymbol'][symbol['@_Id']] = object['@_Id'];
			});
		} else {
			symbols.forEach((symbol) => {
				let object = this.getSymbolObject(symbol, 'o:Association');
				let roleA = object['a:RoleAMultiplicity'];
				let roleB = object['a:RoleBMultiplicity'];
				let type = object['a:RoleAIndicator'];
				let arrow;

				if (type) {
					arrow = type === 'A' ? 'o-[#COLOR]->' : '*-[#COLOR]->';
				} else {
					arrow = '-[#COLOR]->';
				}

				let SourceType = Object.keys(symbol['c:SourceSymbol'])[0];
				let SourceRef = symbol['c:SourceSymbol'][SourceType]['@_Ref'];
				let Source = this.PDSymbols[SourceType][SourceRef];

				let DestType = Object.keys(symbol['c:DestinationSymbol'])[0];
				let DestRef = symbol['c:DestinationSymbol'][DestType]['@_Ref'];
				let Dest = this.PDSymbols[DestType][DestRef];

				let color = parseColor(symbol['a:LineColor']);
				arrow = arrow.replace('COLOR', color);
				let def = `${Source} "${roleA}" ${arrow} "${roleB}" ${Dest}\n`;
				puml += def;
			});
		}
		return puml;
	}

	AssociationLinkSymbolParser(symbols) {
		let puml = '';

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:AssociationLink');

			let SourceType = Object.keys(symbol['c:SourceSymbol'])[0];
			let SourceRef = symbol['c:SourceSymbol'][SourceType]['@_Ref'];
			let Source = this.PDSymbols[SourceType][SourceRef];

			let DestType = Object.keys(symbol['c:DestinationSymbol'])[0];
			let DestRef = symbol['c:DestinationSymbol'][DestType]['@_Ref'];
			let Dest = this.PDSymbols[DestType][DestRef];

			let color = parseColor(symbol['a:LineColor']);
			let text = object['a:Cardinality'];
			let def = `${Source} -[#${color}]- ${Dest}: ${text}`;

			puml += def + '\n';
		});

		return puml;
	}

	RelationshipSymbolParser(symbols) {
		let puml = '';

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:Relationship');

			let SourceType = Object.keys(symbol['c:SourceSymbol'])[0];
			let SourceRef = symbol['c:SourceSymbol'][SourceType]['@_Ref'];
			let Source = this.PDSymbols[SourceType][SourceRef];

			let DestType = Object.keys(symbol['c:DestinationSymbol'])[0];
			let DestRef = symbol['c:DestinationSymbol'][DestType]['@_Ref'];
			let Dest = this.PDSymbols[DestType][DestRef];

			let Name = object['a:Name'];
			let color = parseColor(symbol['a:LineColor']);
			let arrow = getRelationshipArrow(object);
			arrow = arrow.replace('{{COLOR}}', `[#${color}]`);
			let def = `${Source} ${arrow} ${Dest}: ${Name}`;

			puml += def + '\n';
		});

		return puml;
	}

	InheritanceSymbolParser(symbols) {
		let puml = '';
		this.PDSymbols['o:InheritanceSymbol'] = this.PDSymbols['o:InheritanceSymbol'] || {};

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:Inheritance');
			let color = getColorDefinition(symbol);
			let text = object['a:Name'];
			if (object['a:MutuallyExclusive'] === 1) text += '\\nMutually Exclusive';
			if (object['a:BaseLogicalInheritance.Complete'] !== 0) text += '\\nComplete';
			let def = `circle "${text}" as ${object['@_Id']} ${color}\n`;
			puml += def;
			this.PDSymbols['o:InheritanceSymbol'][symbol['@_Id']] = object['@_Id'];
		});

		return puml;
	}

	InheritanceRootSymbolParser(symbols) {
		let puml = '';

		symbols.forEach((symbol) => {
			let SourceType = Object.keys(symbol['c:SourceSymbol'])[0];
			let SourceRef = symbol['c:SourceSymbol'][SourceType]['@_Ref'];
			let Source = this.PDSymbols[SourceType][SourceRef];

			let DestType = Object.keys(symbol['c:DestinationSymbol'])[0];
			let DestRef = symbol['c:DestinationSymbol'][DestType]['@_Ref'];
			let Dest = this.PDSymbols[DestType][DestRef];

			let color = parseColor(symbol['a:LineColor']);
			let def = `${Source} -[#${color}]-|> ${Dest}`;

			puml += def + '\n';
		});

		return puml;
	}

	InheritanceLinkSymbolParser(symbols) {
		let puml = '';

		symbols.forEach((symbol) => {
			let SourceType = Object.keys(symbol['c:SourceSymbol'])[0];
			let SourceRef = symbol['c:SourceSymbol'][SourceType]['@_Ref'];
			let Source = this.PDSymbols[SourceType][SourceRef];

			let DestType = Object.keys(symbol['c:DestinationSymbol'])[0];
			let DestRef = symbol['c:DestinationSymbol'][DestType]['@_Ref'];
			let Dest = this.PDSymbols[DestType][DestRef];

			let color = parseColor(symbol['a:LineColor']);
			let def = `${Source} -[#${color}]- ${Dest}`;

			puml += def + '\n';
		});

		return puml;
	}

	ClassSymbolParser(symbols) {
		let puml = '';
		this.PDSymbols['o:ClassSymbol'] = this.PDSymbols['o:ClassSymbol'] || {};

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:Class');
			let def = parseClass(object);
			let color = getColorDefinition(symbol);
			def = def.replace('{{COLOR}}', color);
			puml += def;
			this.PDSymbols['o:ClassSymbol'][symbol['@_Id']] = object['@_Id'];

			this.PDSymbols['o:PortSymbol'] = this.PDSymbols['o:PortSymbol'] || {};
			let ports = getCollectionAsArray(symbol['c:SubSymbols']?.['o:PortSymbol']);
			ports.forEach((portSymbol) => {
				let portObj = this.getSymbolObject(portSymbol, 'o:Port');
				let def = `() "${portObj['a:Name']}" as ${portObj['@_Id']}\n${object['@_Id']} -- ${portObj['@_Id']}\n`;
				puml += def;
				this.PDSymbols['o:PortSymbol'][portSymbol['@_Id']] = portObj['@_Id'];
			});
		});

		return puml;
	}

	InterfaceSymbolParser(symbols) {
		let puml = '';
		this.PDSymbols['o:InterfaceSymbol'] = this.PDSymbols['o:InterfaceSymbol'] || {};

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:Interface');
			let def = parseInterface(object);
			let color = getColorDefinition(symbol);
			def = def.replace('{{COLOR}}', color);
			puml += def;
			this.PDSymbols['o:InterfaceSymbol'][symbol['@_Id']] = object['@_Id'];
		});

		return puml;
	}

	InnerColSymbolParser(symbols) {
		let puml = '';

		symbols.forEach((symbol) => {
			let SourceType = Object.keys(symbol['c:SourceSymbol'])[0];
			let SourceRef = symbol['c:SourceSymbol'][SourceType]['@_Ref'];
			let Source = this.PDSymbols[SourceType][SourceRef];

			let DestType = Object.keys(symbol['c:DestinationSymbol'])[0];
			let DestRef = symbol['c:DestinationSymbol'][DestType]['@_Ref'];
			let Dest = this.PDSymbols[DestType][DestRef];

			let color = parseColor(symbol['a:LineColor']);
			let def = `${Source} -[#${color}]-+ ${Dest}\n`;
			puml += def;
		});

		return puml;
	}

	RequireLinkSymbolParser(symbols) {
		let puml = '';

		symbols.forEach((symbol) => {
			let SourceType = Object.keys(symbol['c:SourceSymbol'])[0];
			let SourceRef = symbol['c:SourceSymbol'][SourceType]['@_Ref'];
			let Source = this.PDSymbols[SourceType][SourceRef];

			let DestType = Object.keys(symbol['c:DestinationSymbol'])[0];
			let DestRef = symbol['c:DestinationSymbol'][DestType]['@_Ref'];
			let Dest = this.PDSymbols[DestType][DestRef];

			let color = parseColor(symbol['a:LineColor']);
			let def = `${Source} -[#${color}]-x ${Dest}\n`;
			puml += def;
		});

		return puml;
	}

	ActorSequenceSymbolParser(symbols) {
		let puml = '';
		this.PDSymbols['o:ActorSequenceSymbol'] = this.PDSymbols['o:ActorSequenceSymbol'] || {};

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:Actor');
			let def = `actor "${object['a:Name']}" as ${object['@_Id']}\n`;
			puml += def;
			this.PDSymbols['o:ActorSequenceSymbol'][symbol['@_Id']] = object['@_Id'];
			this.parseSymbolActivations(symbol, object);
		});

		return puml;
	}

	UMLObjSequenceSymbol(symbols) {
		let puml = '';
		this.PDSymbols['o:UMLObjectSequenceSymbol'] = this.PDSymbols['o:UMLObjectSequenceSymbol'] || {};

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:UMLObject');
			let def = `participant "${object['a:Name']}" as ${object['@_Id']}\n`;
			puml += def;
			this.PDSymbols['o:UMLObjectSequenceSymbol'][symbol['@_Id']] = object['@_Id'];
			this.parseSymbolActivations(symbol, object);
		});

		return puml;
	}

	MessageSymbolParser(symbols) {
		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol, 'o:Message');

			let SourceType = Object.keys(symbol['c:SourceSymbol'])[0];
			let SourceRef = symbol['c:SourceSymbol'][SourceType]['@_Ref'];
			let Source = this.PDSymbols[SourceType][SourceRef];

			let DestType = Object.keys(symbol['c:DestinationSymbol'])[0];
			let DestRef = symbol['c:DestinationSymbol'][DestType]['@_Ref'];
			let Dest = this.PDSymbols[DestType][DestRef];

			let { bottom, top } = getRectPosition(symbol);
			let arrow =
				object['a:ControlFlow'] === 'R' ? '-->' : object['a:ControlFlow'] === 'C' ? '->' : '->>';
			let num = object['a:SequenceNumber'];
			num = num ? `${num}: ` : '';
			let def = `${Source} ${arrow} ${Dest}: "${num}${object['a:Name']}"`;
			this.SequenceEvents.push({
				time: (bottom + top) / 2,
				def
			});
		});

		// otherwise this prints undefined
		return '';
	}

	getSymbolObject(Symbol: object, DefaultType: string) {
		let Reference = Symbol['c:Object'];
		let ObjectType = Object.keys(Reference)[0];
		let ObjectRef = Reference[ObjectType]['@_Ref'];
		let object = this.PDObjects[ObjectType]?.[ObjectRef];

		if (!object) {
			console.warn(`Could not find object definition for symbol: ${Symbol['@_Id']}`);
			console.log(Symbol);
			return {};
		}

		if (ObjectType === 'o:Shortcut') {
			let ObjectID = object['a:TargetID'];
			let ParentCol = this.PDObjects[DefaultType];
			let ColItems: any[] = Object.values(ParentCol || {});
			for (let Parent of ColItems) {
				if (Parent['a:ObjectID'] === ObjectID) {
					object = {
						...Parent,
						...object
					};
					break;
				}
			}
		}

		if (DefaultType === 'o:UMLObject' && !object['a:Name']) {
			if (object['a:TargetID']) {
				let TargetID = object['a:TargetID'];
				let ObjType = DefaultType;
				let Parent = this.findObjectByObjectID(TargetID, ObjType);
				if (Parent) {
					if (Parent['a:Name'] === '') delete Parent['a:Name'];
					if (Parent['a:Code'] === '') delete Parent['a:Code'];
					object = {
						...Parent,
						...object
					};
				}
			}

			let InstantiationRef = object['c:InstantiationClass']?.['o:Shortcut']?.['@_Ref'];
			if (InstantiationRef) {
				let InstantiationClass = this.PDObjects['o:Shortcut'][InstantiationRef];
				if (object['a:Name'] === '') delete object['a:Name'];
				if (object['a:Code'] === '') delete object['a:Code'];
				object = {
					...InstantiationClass,
					...object
				};
			}
		}

		return object;
	}

	parseSymbolActivations(symbol, object) {
		this.PDSymbols['o:ActivationSymbol'] = this.PDSymbols['o:ActivationSymbol'] || {};
		let PDAct = symbol['c:SlaveSubSymbols']?.['o:ActivationSymbol'];
		let Act = getCollectionAsArray(PDAct);
		Act.forEach((activation) => {
			let pos = getRectPosition(activation);
			let startDef = `activate ${object['@_Id']}`;
			let endDef = `deactivate ${object['@_Id']}`;

			// add activate event
			this.SequenceEvents.push({
				time: pos.top,
				def: startDef
			});

			// add deactivate event
			this.SequenceEvents.push({
				time: pos.bottom,
				def: endDef
			});

			// add to symbol-object map
			this.PDSymbols['o:ActivationSymbol'][activation['@_Id']] = object['@_Id'];
		});
	}

	SymbolParserMap = {
		'o:ActorSequenceSymbol': this.ActorSequenceSymbolParser.bind(this),
		'o:UMLObjectSequenceSymbol': this.UMLObjSequenceSymbol.bind(this),
		'o:ClassSymbol': this.ClassSymbolParser.bind(this),
		'o:InterfaceSymbol': this.InterfaceSymbolParser.bind(this),
		'o:EntitySymbol': this.EntitySymbolParser.bind(this),
		'o:InheritanceSymbol': this.InheritanceSymbolParser.bind(this),
		'o:AssociationSymbol': this.AssociationSymbolParser.bind(this),
		'o:ActorSymbol': this.ActorSymbolParser.bind(this),
		'o:UseCaseSymbol': this.UseCaseSymbolParser.bind(this),
		'o:PackageSymbol': this.PackageSymbolParser.bind(this),
		'o:TableSymbol': this.TableSymbolParser.bind(this),
		'o:ViewSymbol': this.ViewSymbolParser.bind(this),
		'o:ProcedureSymbol': this.ProcedureSymbolParser.bind(this),
		'o:ReferenceSymbol': this.ReferenceSymbolParser.bind(this),
		'o:ViewReferenceSymbol': this.ViewReferenceSymbolParser.bind(this),
		'o:UseCaseAssociationSymbol': this.UCAssociationSymbolParser.bind(this),
		'o:ExtendedDependencySymbol': this.ExtendedDepSymbolParser.bind(this),
		'o:DependencySymbol': this.DependencySymbolParser.bind(this),
		'o:GeneralizationSymbol': this.GeneralizationSymbolParser.bind(this),
		'o:RelationshipSymbol': this.RelationshipSymbolParser.bind(this),
		'o:InheritanceRootLinkSymbol': this.InheritanceRootSymbolParser.bind(this),
		'o:InheritanceLinkSymbol': this.InheritanceLinkSymbolParser.bind(this),
		'o:AssociationLinkSymbol': this.AssociationLinkSymbolParser.bind(this),
		'o:InnerCollectionSymbol': this.InnerColSymbolParser.bind(this),
		'o:RequireLinkSymbol': this.RequireLinkSymbolParser.bind(this),
		'o:MessageSymbol': this.MessageSymbolParser.bind(this)
	};
}

PDParser.prototype.SequenceParser = function () {};

// HELPERs
function getRectPosition(symbol) {
	let rect = symbol['a:Rect'];
	if (!rect) return null;

	let [left, bottom, right, top] = rect.split(',');
	return {
		left: Number(left.slice(2)),
		bottom: Number(bottom.slice(0, -1)),
		right: Number(right.slice(2)),
		top: Number(top.slice(0, -2))
	};
}

function getColorDefinition(symbol) {
	let colorTo = parseColor(symbol['a:FillColor']);
	let colorFrom = parseColor(symbol['a:GradientEndColor']) || colorTo;
	let lineColor = parseColor(symbol['a:LineColor']);

	if (!colorFrom && !colorTo) {
		return `#line:${lineColor}`;
	} else {
		return `#${colorFrom}/${colorTo};line:${lineColor}`;
	}
}

function getColor(symbol, colorAttributes, def) {
	let color;
	for (let attr of colorAttributes) {
		color = parseColor(symbol[attr]);
		if (color) break;
	}
	return color || def;
}

let colMap = {
	'c:Packages': 'o:Package',
	'c:ClassDiagrams': 'o:ClassDiagram',
	'c:UseCaseDiagrams': 'o:UseCaseDiagram',
	'c:PhysicalDiagrams': 'o:PhysicalDiagram',
	'c:ConceptualDiagrams': 'o:ConceptualDiagram',
	'c:SequenceDiagrams': 'o:SequenceDiagram'
};

let colObjMap = {
	'c:References': 'o:Reference',
	'c:ViewReferences': 'o:ViewReference',
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
	'c:Package.Objects': 'o:UMLObject',
	'c:Model.Objects': 'o:UMLObject',
	'c:Messages': 'o:Message',
	'c:Views': 'o:View',
	'c:Procedures': 'o:Procedure',
	'c:DataItems': 'o:DataItem',
	'c:Inheritances': 'o:Inheritance',
	'c:AssociationsLinks': 'o:AssociationsLink'
};
