import type { ObjectRef } from './PDTypes/ClassDiagram/PDClassDiagram';

export function getPosition(rect: string) {
	if (!rect) return { x: 0, y: 0 };
	let x = rect?.split(',')[0].slice(2);
	let y = rect?.split(',')?.[1]?.slice(0, -1);
	return {
		x: x ? Number(x) : 0,
		y: y ? Number(y) : 0
	};
}

export function parseArrowStyle(style: number) {
	if (style === 8) return '->';
	if (style === 1) return '-->';
	return '->';
}

export function getCollectionAsArray(col): any[] {
	if (col == null) return [];
	return [].concat(col);
}

export function getObjectRef(objRef: ObjectRef) {
	let vals = Object.values(objRef);
	return vals[0]['@_Ref'];
}

export function parseColor(color: number) {
	if (color === 0) return '000000';
	if (!color) return null;
	let hex = color.toString(16);
	while (hex.length < 6) hex = '0' + hex
	return hex.slice(4, 6) + hex.slice(2, 4) + hex.slice(0, 2);
}
