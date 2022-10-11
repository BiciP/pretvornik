import { getCollectionAsArray } from '../helpers';
import ParserError from '../ParseError';
import type { RefAttributes } from '../PDTypes';
import type { PDDataItem } from '../PDTypes/PDDataItem';
import type {
	EntityAttribute,
	Identifier,
	PDAssociationObject,
	PDEntityObject
} from '../PDTypes/PDEntity';
import type { PDRelationship } from '../PDTypes/PDRelationship';

export function parseAssociation(association: PDAssociationObject, dataItems) {
	let PUML = '';

	// extract id
	let assocId = association['@_Id'];

	PUML = `entity "${association['a:Name']}" as ${assocId} {{COLOR}} {\n`;

	// Declare attributes
	let attributes: EntityAttribute[] = getCollectionAsArray(
		association['c:Attributes']?.['o:AssociationAttribute']
	);
	attributes.forEach((attribute) => {
		let isMandatory = attribute['a:BaseAttribute.Mandatory'] === 1;
		let dataItemRef = attribute['c:DataItem']['o:DataItem']['@_Ref'];
		let dataItem = dataItems[dataItemRef];
		if (dataItem == null)
			throw new ParserError(`Attribute data item does not exist: Ref[${dataItemRef}]`);
		let dataType = extractDataType(dataItem);
		let puml = `\t${isMandatory ? '* ' : ''}${dataItem['a:Name']}`;
		if (dataType != null) {
			puml += ` : `;
			if (dataType) puml += `${dataType} `;
		}
		puml += '\n';
		PUML += puml;
	});

  PUML += '\t--\n';

	// PlantUML entity finalization
	PUML += '}\n';
	return PUML;
}

export function parseEntity(entity: PDEntityObject, dataItems) {
	let PUML = '';

	// Extract entity Id
	let entityId = entity['@_Id'];

	// PlantUML entity initialization
	PUML = `entity "${entity['a:Name']}" as ${entityId} {{COLOR}} {\n`;

	// Get primary identifiers
	let primaryIdentifiers: RefAttributes[] = getCollectionAsArray(
		entity['c:PrimaryIdentifier']?.['o:Identifier']
	);
	let primaryIdentifiersKeys = primaryIdentifiers.map((pk) => pk['@_Ref']);

	// Declare identifiers
	let piAttributes = new Set();
	let identifiers: Identifier[] = getCollectionAsArray(entity['c:Identifiers']?.['o:Identifier']);
	identifiers.forEach((identifier) => {
		let attributesRefs: RefAttributes[] = getCollectionAsArray(
			identifier['c:Identifier.Attributes']?.['o:EntityAttribute']
		);
		attributesRefs.forEach((attributeRef) => piAttributes.add(attributeRef['@_Ref']));
	});

	// Declare attributes
	let attributes: EntityAttribute[] = getCollectionAsArray(
		entity['c:Attributes']?.['o:EntityAttribute']
	);
	attributes.forEach((attribute) => {
		let isIdentifier = piAttributes.has(attribute['@_Id']); // preveri ali je atribut identifikator
		let isMandatory = attribute['a:BaseAttribute.Mandatory'] === 1; // preveri ali je atribut obvezen
		let dataItemRef = attribute['c:DataItem']['o:DataItem']['@_Ref']; // pridobi referenco na podatkovni element
		let dataItem = dataItems[dataItemRef]; // definicija podatkovnega elementa
		if (dataItem == null)
			throw new ParserError(`Attribute data item does not exist: Ref[${dataItemRef}]`);
		let dataType = extractDataType(dataItem); // ekstrahiraj podatkovni tip atributa
		let puml = `\t${isMandatory ? '* ' : ''}${dataItem['a:Name']}`; // začni PlantUML notacijo
		if (dataType != null || isIdentifier) {
			puml += ` : `;
			if (dataType) puml += `${dataType} `; // pripiši podatkovni tip
			if (isIdentifier) puml += '<<pi>>'; // pripiši oznako za identifikator
		}
		puml += '\n';
		PUML += puml;
	});

	// Draw the line between identifiers and attributes if there are any identifiers
	PUML += '\t--\n';

	identifiers.forEach((identifier) => {
		let isPrimary = primaryIdentifiersKeys.includes(identifier['@_Id']);
		PUML += `\t* ${identifier['a:Name']} ${isPrimary ? '<<pi>>' : ''}\n`;
	});

	// PlantUML entity finalization
	PUML += '}\n';
	return PUML;
}

export function getRelationshipArrow(relationship: PDRelationship) {
	let puml = '';
	puml += getCardinality(relationship, 2);
	puml += relationship['a:DependentRole'] ? '.{{COLOR}}.' : '-{{COLOR}}-';
	puml += getCardinality(relationship, 1);
	return puml;
}

// HELPERS

function extractDataType(dataItem: PDDataItem) {
	let dataType: string = dataItem['a:DataType'];
	let length: number | undefined = dataItem['a:Length'];
	let precision: number | undefined = dataItem['a:Precision'];

	if (!dataType) {
		return null;
	}

	let isDefined = Object.keys(dataTypes).every((key) => {
		if (dataType.startsWith(key)) {
			dataType = dataTypes[key];
			return false;
		}

		return true;
	});

	if (isDefined) {
		console.error(`Data type not implemented: '${dataType}'`);
	}

	if (length) {
		dataType += ` (${length}`;
		if (precision) dataType += `,${precision}`;
		dataType += `)`;
	}

	return dataType;
}

function getCardinality(relationship: PDRelationship, entity: 1 | 2): string {
	let keys = {
		1: 'a:Entity1ToEntity2RoleCardinality',
		2: 'a:Entity2ToEntity1RoleCardinality'
	};
	let raw = relationship[keys[entity]];
	let cardinality = cardinalityMap[raw];
	if (!cardinality) throw new ParserError('Invalid cardinality: ' + raw);
	return cardinality[entity];
}

let dataTypes = {
	VBIN: 'Variable binary',
	VMBT: 'Variable multibyte',
	LBIN: 'Long binary',
	LVA: 'Long variable characters',
	BIN: 'Binary',
	BMP: 'Bitmap',
	PIC: 'Image',
	MBT: 'Multibyte',
	OLE: 'OLE',
	TXT: 'Text',
	VA: 'Variable characters',
	MN: 'Money',
	BT: 'Byte',
	BL: 'Boolean',
	LA: 'Long characters',
	SF: 'Short float',
	SI: 'Short integer',
	LI: 'Long integer',
	DT: 'Date & Time',
	DC: 'Decimal',
	TS: 'Timestamp',
	NO: 'Serial',
	N: 'Number',
	D: 'Date',
	T: 'Time',
	I: 'Integer',
	A: 'Characters',
	F: 'Float'
};

let cardinalityMap = {
	'0,1': {
		2: '|o',
		1: 'o|'
	},
	'0,n': {
		2: '}o',
		1: 'o{'
	},
	'1,1': {
		2: '||',
		1: '||'
	},
	'1,n': {
		2: '}|',
		1: '|{'
	}
};
