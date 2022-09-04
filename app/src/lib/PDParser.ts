import { parser, parseReference, parseTable, parseTables } from './DiagramParser/Physical';
import { getCollectionAsArray, parseColor } from './helpers';
import { parseFile } from './Parser';

export class PDParser {
	DiagramList: any[];
	PDModel: object;
	private PDObjects: object;
	private PDSymbols: object;
	SequenceParser: () => void;
	CurrentDiagram: any;

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
		} else if (Diagram['x:Type'] === 'o:UseCaseDiagram') {
			PUML += `left to right direction\n`;
		} else {
			console.log(Diagram['x:Type']);
		}

		PUML += '\n';
		PUML += this.parseSymbols(Diagram);

		PUML += '\n@enduml';
		return PUML;
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
					this.PDObjects[ObjType][item['@_Id']] = item;
				});
			});
		});

		let PDPackages = Model['c:Packages']?.['o:Package'];
		let Packages = getCollectionAsArray(PDPackages);
		Packages.forEach((Package) => this.parseObjects(Package));
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

	private findObjectByObjectID(ObjectID, ObjType) {
		let Objects = this.PDObjects[ObjType];
		let Values = Object.values(Objects);
		for (let Obj of Values) {
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
		return PUML;
	}

	ViewSymbolParser(symbols) {
		let puml = '';
		this.PDSymbols['o:ViewSymbol'] = this.PDSymbols['o:ViewSymbol'] || {};

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol['c:Object'], 'o:View');
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
			let object = this.getSymbolObject(symbol['c:Object'], 'o:Procedure');
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
			let object = this.getSymbolObject(symbol['c:Object'], 'o:ExtendedDependency');

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
			let object = this.getSymbolObject(symbol['c:Object'], 'o:Package');
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
			let object = this.getSymbolObject(symbol['c:Object'], 'o:Table');
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
			let object = this.getSymbolObject(symbol['c:Object'], 'o:Reference');
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
			let object = this.getSymbolObject(symbol['c:Object'], 'o:ViewReference');

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
			let object = this.getSymbolObject(symbol['c:Object'], 'o:Actor');
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
			let object = this.getSymbolObject(symbol['c:Object'], 'o:UseCase');
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
			let object = this.getSymbolObject(symbol['c:Object'], 'o:Dependency');

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

	UCAssociationSymbolParser(symbols) {
		let puml = '';

		symbols.forEach((symbol) => {
			let object = this.getSymbolObject(symbol['c:Object'], 'o:UseCaseAssociation');

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

	getSymbolObject(Reference: object, DefaultType: string) {
		let ObjectType = Object.keys(Reference)[0];
		let ObjectRef = Reference[ObjectType]['@_Ref'];
		let object = this.PDObjects[ObjectType]?.[ObjectRef];

		if (ObjectType === 'o:Shortcut') {
			let ObjectID = object['a:TargetID'];
			let ParentCol = this.PDObjects[DefaultType];
			let ColItems: any[] = Object.values(ParentCol);
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

		return object;
	}

	SymbolParserMap = {
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
		'o:GeneralizationSymbol': this.GeneralizationSymbolParser.bind(this)
	};
}

PDParser.prototype.SequenceParser = function () {};

// HELPERs
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

// let ParsingOrder = ['o:TableSymbol', 'o:PackageSymbol', 'o:ReferenceSymbol'];

let SymbolColMap = {
	'o:TableSymbol': 'c:Tables'
};

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
	'c:Model.Objects': 'o:UMLObject',
	'c:Messages': 'o:Message',
	'c:Views': 'o:View',
	'c:Procedures': 'o:Procedure'
};
