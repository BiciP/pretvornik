import type { PDTableObject, TableColumn, TableKey } from '../PDTypes/PDTable';
import type {
	PDReferenceObject,
	ReferenceJoinObject
} from '../PDTypes/PDReference';
import { getCollectionAsArray, getObjectRef } from '../helpers';
import type { RefAttributes } from '../PDTypes';

let fk = {};

export function parseTable(table: PDTableObject) {
	let pks: RefAttributes[] = getCollectionAsArray(table['c:PrimaryKey']?.['o:Key']);
	let fks: { parentRef: string; obj1: string; obj2: string }[] = fk[table['@_Id']] || [];
	let fkParents = new Set();
	let keys: TableKey[] = getCollectionAsArray(table['c:Keys']?.['o:Key']);
	let columns: TableColumn[] = getCollectionAsArray(table['c:Columns']?.['o:Column']);

	let PUML = `entity "${table['a:Name']}" as ${table['@_Id']} {{COLOR}} {\n`;

	// oznaci primarne kljuce
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
				throw new Error(`Primary key "${pk['@_Ref']}" could not be parsed. Key column not found.`);
			}
			columns[colIndex].isPrimary = true;
		});
	});

	// oznaci tuje kljuce z atributom foreignKey
	fks.forEach((fkObj, i) => {
		fkParents.add(fkObj.parentRef);
		let column = columns.find((col) => col['@_Id'] === fkObj.obj2);
		if (!column) return;
		column.foreignKey = fkParents.size;
	});

	// pretvori stolpce primarnih kljucev
	columns.filter((col) => col.isPrimary).forEach((col) => (PUML += parseColumnData(col)));
	PUML += '\t---\n';
	// pretvori ostale stolpce
	columns.filter((col) => !col.isPrimary).forEach((col) => (PUML += parseColumnData(col)));

	PUML += `}\n`;

	return PUML;
}

// razcleni stike stolpcev za definicijo tujih kljucev
export function parseReference(ref: PDReferenceObject) {
	let joins: ReferenceJoinObject[] = getCollectionAsArray(ref['c:Joins']?.['o:ReferenceJoin']);
	joins.forEach((join) => {
		let child = getObjectRef(ref['c:ChildTable']);
		let parentRef = getObjectRef(ref['c:ParentTable']);
		let obj1 = join['c:Object1']['o:Column']['@_Ref'];
		let obj2 = join['c:Object2']['o:Column']['@_Ref'];
		if (!fk[child]) fk[child] = [];
		fk[child].push({
			parentRef,
			obj1,
			obj2
		});
	});
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
