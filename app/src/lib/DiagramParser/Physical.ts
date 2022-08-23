import ParserError from '../ParseError';
import type { TableColumn, TableKey } from '../types';
import type { PDTableObject, PDTableSymbol } from '../PDTypes/PDTable';
import type { PDReferenceObject, PDReferenceSymbol } from '../PDTypes/PDReference';
import type { PDPhysicalDiagram } from '../PDTypes/PDPhysicalDiagram';
import { getCollectionAsArray } from '../helpers';
import type { RefAttributes } from '$lib/PDTypes';

export const parser = (diagram: PDPhysicalDiagram, PDObjects: any) => {
	// Initialize the PlantUML notation diagram and give it a name
	let PUMLDiagram = '@startuml ' + diagram['a:Name'] + '\n\n';

	// Parse Table symbols
	let tableSymbols: PDTableSymbol[] = getCollectionAsArray(diagram['c:Symbols']?.['o:TableSymbol']);
	tableSymbols.forEach(
		(symbol) => (PUMLDiagram += PDObjects['o:Table'][symbol['c:Object']['o:Table']['@_Ref']] + '\n')
	);

	function parseColor(color: number | undefined) {
		if (color == null) return null;
		let str = color.toString(16);
		return str.slice(4, 6) + str.slice(2, 4) + str.slice(0, 2);
	}

	// Parse Reference symbols
	let refSymbols: PDReferenceSymbol[] = getCollectionAsArray(
		diagram['c:Symbols']?.['o:ReferenceSymbol']
	);
	refSymbols.forEach((symbol) => {
		let color = parseColor(symbol['a:LineColor']);
		let puml = PDObjects['o:Reference'][symbol['c:Object']['o:Reference']['@_Ref']] + '\n';
		puml = puml.replace('{{ARROW}}', `-${color && color !== '00aaaa' ? `[#${color}]` : ''}-|>`);
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

export function parseTables(tables: PDTableObject[]) {
	// { o1: PUMLEntity, o2: PUMLEntity }
	let obj = {};

	tables.forEach((table) => {
		let columns: TableColumn[] = getCollectionAsArray(table['c:Columns']?.['o:Column']);
		let keys: TableKey[] = getCollectionAsArray(table['c:Keys']?.['o:Key']);

		let PUMLKeys = keys
			.map((pk) => {
				let keyColumns: RefAttributes[] = getCollectionAsArray(pk['c:Key.Columns']?.['o:Column']);
				let parsedKeyColumns = keyColumns.map((col) => {
					let colIndex = columns.findIndex((item) => item['@_Id'] === col['@_Ref']);
					if (colIndex < 0) {
						throw new ParserError(`Key column does not exist: Ref[${col['@_Ref']}]`);
					}
					let column = columns[colIndex];
					columns[colIndex].isIdentifier = true;
					return parseColumnData(column);
				});

				// če želimo ključ, ki je sestavljen iz več tujih ključev,
				// newline zamenjamo z ,
				return parsedKeyColumns.join('\n    ');
			})
			.join('\n    ');

		const getPUMLColumns = (columns: TableColumn[]) =>
			columns
				.filter((col) => !col.isIdentifier)
				.map((col) => parseColumnData(col))
				.join('\n    ');

		obj[table['@_Id']] = `entity "${table['a:Name']}" as ${table['@_Id']} {
    ${PUMLKeys}
    --
    ${getPUMLColumns(columns)}
}
`;
	});

	return obj;
}

export function parseReferences(references: PDReferenceObject[]) {
	let obj = {};
	let cardinalityMap = {
		'0..1': '<|--',
		'0..*': '<|--',
		'1..1': '<|--',
		'1..*': '<|--'
	};

	references.forEach((ref) => {
		let parent = ref['c:ParentTable']['o:Table']['@_Ref'];
		let parentRole = ref['a:ParentRole'];
		let child = ref['c:ChildTable']['o:Table']['@_Ref'];
		let childRole = ref['a:ChildRole'];
		let code = ref['a:Code'];
		// let cardinality = cardinalityMap[ref['a:Cardinality']];

		obj[ref['@_Id']] = `${child}${childRole ? ` "${childRole}" ` : ' '}{{ARROW}}${
			parentRole ? ` "${parentRole}" ` : ' '
		}${parent}${code ? ` : ${code}` : ''}`;
	});

	return obj;
}

/*
 * HELPERS
 * */

// Pretvori PowerDesigner TableColumn v PlantUML notacijo
const parseColumnData = (col: TableColumn) =>
	`${col['a:Mandatory'] === '1' ? '*' : ''} ${col['a:Name']}: ${col['a:DataType']}`;
