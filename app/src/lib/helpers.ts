export function getCollectionAsArray(col): any[] {
	if (col == null) return [];
	return [].concat(col);
}

export function parseColor(color: number) {
	if (!color) return null;
	let hex = color.toString(16);
	return hex.slice(4, 6) + hex.slice(2, 4) + hex.slice(0, 2);
}
