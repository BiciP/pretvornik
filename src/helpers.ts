export function getCollectionAsArray(col): any[] {
    if (col == null) return []
    return [].concat(col)
}