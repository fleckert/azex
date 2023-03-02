export class Helper {
    static toArray<T>(mapping: { [id: string]: T; }): Array<T> {
        const collection = new Array<T>();

        for (const key in mapping) {
            collection.push(mapping[key]);
        }

        return collection;
    }

    static getMissingElements<T>(collectionA: Array<T>, collectionB: Array<T>, compare: (a: T, b: T) => boolean): { itemsInAandNotInB: Array<T>, itemsInBandNotInA: Array<T> } {

        const itemsInAandNotInB = new Array<T>();
        const itemsInBandNotInA = new Array<T>();

        for (const a of collectionA) {
            if (collectionB.find(b => compare(a, b)) === undefined) {
                itemsInAandNotInB.push(a);
            }
        }
        for (const b of collectionB) {
            if (collectionA.find(a => compare(a, b)) === undefined) {
                itemsInBandNotInA.push(b);
            }
        }

        return { itemsInAandNotInB, itemsInBandNotInA };
    }

    static getItemsFromMap<T>(ids: Array<string>, map: { [id: string]: T; }, throwOnMissing: 'failForMissingId' | 'ignoreMissingId'): Array<T> {
        const items = new Array<T>();

        for (const id of ids) {
            const item = map[id];
            if (item === undefined && throwOnMissing === 'failForMissingId') {
                throw new Error(`Failed to resolve item for ${JSON.stringify({ id })}`);
            }
            else if (item === undefined && throwOnMissing === 'ignoreMissingId') {

            }
            else {
                items.push(item)
            }
        }

        return items;
    }
}