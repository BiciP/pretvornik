import ParserError from '../ParseError';
import type { PDTableObject, PDTableSymbol, TableColumn, TableKey } from '../PDTypes/PDTable';
import type {
	PDReferenceObject,
	PDReferenceSymbol,
	ReferenceJoinObject
} from '../PDTypes/PDReference';
import type { PDPhysicalDiagram } from '../PDTypes/PDPhysicalDiagram';
import { getCollectionAsArray, parseColor } from '../helpers';
import type { RefAttributes } from '$lib/PDTypes';

let fk = {};

export const parser = (diagram: PDPhysicalDiagram, PDObjects: any) => {
	// Initialize the PlantUML notation diagram and give it a name
	let PUMLDiagram = '@startuml ' + diagram['a:Name'] + '\n\n';

	// Parse Table symbols
	let tableSymbols: PDTableSymbol[] = getCollectionAsArray(diagram['c:Symbols']?.['o:TableSymbol']);
	tableSymbols.forEach((symbol) => {
		let colorFrom = parseColor(symbol['a:GradientEndColor']) || parseColor(symbol['a:FillColor']) || 'c0ffc0';
		let colorTo = parseColor(symbol['a:FillColor']) || 'c0ffc0';
		let lineColor = parseColor(symbol['a:LineColor']) || '0000ff';
		let colorDef = `#${colorFrom}/${colorTo};line:${lineColor}`;
		let def = PDObjects['o:Table'][symbol['c:Object']['o:Table']['@_Ref']] + '\n';
		def = def.replace('{{COLOR}}', colorDef);
		PUMLDiagram += def;
	});

	// Parse Reference symbols
	let refSymbols: PDReferenceSymbol[] = getCollectionAsArray(
		diagram['c:Symbols']?.['o:ReferenceSymbol']
	);
	refSymbols.forEach((symbol) => {
		let color = parseColor(symbol['a:LineColor']);
		let puml = PDObjects['o:Reference'][symbol['c:Object']['o:Reference']['@_Ref']] + '\n';
		puml = puml.replace('{{ARROW}}', `-${`[#${color}]`}->`);
		PUMLDiagram += puml;
	});

	// Finish the PlnatUML notation
	PUMLDiagram += '\n\n@enduml';

	return {
		diagram: {
			id: diagram['@_Id'],
			name: diagram['a:Name'],
			type: 'Physical'
		},
		data: PUMLDiagram
	};
};

export function parseTables(tables: PDTableObject[], model: null) {
	// { o1: PUMLEntity, o2: PUMLEntity }
	let obj = {};

	tables.forEach((table) => {
		let pks: RefAttributes[] = getCollectionAsArray(table['c:PrimaryKey']?.['o:Key']);
		let fks: { parentRef: string; obj1: string; obj2: string }[] = fk[table['@_Id']] || [];
        let fkParents = new Set()
		let keys: TableKey[] = getCollectionAsArray(table['c:Keys']?.['o:Key']);
		let columns: TableColumn[] = getCollectionAsArray(table['c:Columns']?.['o:Column']);

		let PUML = `entity "${table['a:Name']}" as ${table['@_Id']} {{COLOR}} {\n`;

		// parse primary keys
		pks.forEach((pk) => {
			let keyId = pk['@_Ref'];
			let keyIndex = keys.findIndex((key) => key['@_Id'] === keyId);
			if (keyIndex < 0) {
				throw new Error(`Primary key "${pk['@_Ref']}" could not be parsed. Key not found.`);
			}
			let key = keys[keyIndex];
			let keyColsIds: RefAttributes[] = getCollectionAsArray(key['c:Key.Columns']['o:Column']);
			keyColsIds.map((keyColIdRef) => {
				let colIndex = columns.findIndex((col) => col?.['@_Id'] === keyColIdRef['@_Ref']);
				if (colIndex < 0) {
					throw new Error(
						`Primary key "${pk['@_Ref']}" could not be parsed. Key column not found.`
					);
				}
				columns[colIndex].isPrimary = true;
			});
		});

		fks.forEach((fkObj, i) => {
            fkParents.add(fkObj.parentRef)
            let column = columns.find(col => col['@_Id'] === fkObj.obj2)
            column.foreignKey = fkParents.size
		});

		columns.filter((col) => col.isPrimary).forEach((col) => (PUML += parseColumnData(col)));
		PUML += '\t---\n';
		columns.filter((col) => !col.isPrimary).forEach((col) => (PUML += parseColumnData(col)));

		PUML += `}\n`;

		obj[table['@_Id']] = PUML;
	});

	return obj;
}

export function parseReferences(references: PDReferenceObject[]) {
	let obj = {};

	references.forEach((ref) => {
		let parent = ref['c:ParentTable']['o:Table']['@_Ref'];
		let parentRole = ref['a:ParentRole'];
		let child = ref['c:ChildTable']['o:Table']['@_Ref'];
		let childRole = ref['a:ChildRole'];
		let code = ref['a:Code'];

		let joins: ReferenceJoinObject[] = getCollectionAsArray(ref['c:Joins']?.['o:ReferenceJoin']);
		joins.forEach((join) => {
			let child = ref['c:ChildTable']['o:Table']['@_Ref'];
			let parentRef = ref['c:ParentTable']['o:Table']['@_Ref'];
			let obj1 = join['c:Object1']['o:Column']['@_Ref'];
			let obj2 = join['c:Object2']['o:Column']['@_Ref'];
			if (!fk[child]) fk[child] = [];
			fk[child].push({
				parentRef,
				obj1,
				obj2
			});
		});

		obj[ref['@_Id']] = `${child}${childRole ? ` "${childRole}" ` : ' '} {{ARROW}} ${
			parentRole ? ` "${parentRole}" ` : ' '
		}${parent}${code ? ` : ${code}` : ''}`;
	});

	return obj;
}

/*
 * HELPERS
 * */

// Pretvori PowerDesigner TableColumn v PlantUML notacijo
const parseColumnData = (col: TableColumn) => {
	let identifiers = [];
	if (col.isPrimary) identifiers.push('pk');
	if (col.foreignKey != null) identifiers.push(`fk${col.foreignKey}`);
	return `\t${col['a:Column.Mandatory'] === 1 ? '*' : ''} ${col['a:Name']}: ${col['a:DataType']} ${
		identifiers.length ? `<${identifiers.join(',')}>` : ''
	}\n`;
};
