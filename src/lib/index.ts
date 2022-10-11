import { parseFile } from './Parser';

export function getDiagramList(fileAsString) {
    // @ts-ignore
	return parseFile(fileAsString);
}
