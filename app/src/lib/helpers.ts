import type { ObjectRef } from "./PDTypes/ClassDiagram/PDClassDiagram";

export function getCollectionAsArray(col): any[] {
	if (col == null) return [];
	return [].concat(col);
}

export function getObjectRef(objRef: ObjectRef) {
	let vals = Object.values(objRef)
	return vals[0]["@_Ref"]
}

export function parseColor(color: number) {
	if (color === 0) return '000000'
	if (!color) return null;
	let hex = color.toString(16);
	return hex.slice(4, 6) + hex.slice(2, 4) + hex.slice(0, 2);
}
