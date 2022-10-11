import { getCollectionAsArray } from '$lib/helpers';
import type { PDClass } from '../PDTypes/PDClass';
import type { PDInterface } from '../PDTypes/PDInterface';
import type { Operation, Attribute } from '../PDTypes/PDOther';

export function parseClass(cl: PDClass) {
	let puml = `class "${cl['a:Name']}" as ${cl['@_Id']} {{COLOR}} {\n`;

	puml += parseAttributes(getCollectionAsArray(cl['c:Attributes']?.['o:Attribute']));
	puml += parseOperations(getCollectionAsArray(cl['c:Operations']?.['o:Operation']));

	puml += '}\n';
	return puml;
}

export function parseInterface(int: PDInterface) {
	let name = int['a:Name'];
	let puml = `interface "${name}" as ${int['@_Id']} {{COLOR}} {\n`;

	puml += parseAttributes(getCollectionAsArray(int['c:Attributes']?.['o:Attribute']));
	puml += parseOperations(getCollectionAsArray(int['c:Operations']?.['o:Operation']));

	puml += '}\n';
	return puml;
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
