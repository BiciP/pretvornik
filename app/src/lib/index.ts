import { parseFile, parsePdModel } from './Parser';

export function getDiagramList(fileAsString) {
    // @ts-ignore
	return parseFile(fileAsString, 'COL_LIST');
}

export function parseDiagram(pdModel, diagram) {
    return parsePdModel(pdModel, diagram)
}

export default function init(fileAsString) {
	return parseFile(fileAsString);
}

