import { XMLParser } from 'fast-xml-parser';
import ParserError, { PARSE_ERROR_MESSAGE } from './ParseError';
import { getCollectionAsArray } from './helpers';

// Seznam značk diagramov
let colMap = {
	'c:Packages': 'o:Package',
	'c:ClassDiagrams': 'o:ClassDiagram',
	'c:UseCaseDiagrams': 'o:UseCaseDiagram',
	'c:PhysicalDiagrams': 'o:PhysicalDiagram',
	'c:ConceptualDiagrams': 'o:ConceptualDiagram',
	'c:SequenceDiagrams': 'o:SequenceDiagram'
};

// Pretvori XML v JS in inicializira branje diagrama
export const parseFile = (file: string) => {
	let parser = new XMLParser({ ignoreAttributes: false });
	let xml = parser.parse(file);

	// Preverimo ustreznost datoteke
	let pdInfo = xml['?PowerDesigner'];
	let pdModel = xml['Model']?.['o:RootObject']?.['c:Children']?.['o:Model'];
	if (!pdInfo || !pdModel) throw new ParserError(PARSE_ERROR_MESSAGE.NOT_A_PD_FILE);

	return {
		model: JSON.parse(JSON.stringify(pdModel)),
		list: getCollectionList(pdModel)
	};
};

const getCollectionList = (pdModel: object) => {
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