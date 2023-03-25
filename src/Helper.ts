export class Helper {

    static durationInSeconds(startDate: Date) {
        return (new Date().getTime() - startDate.getTime()) / 1000;
    }

    static isInDebugMode() {
        return require('inspector').url() !== undefined;
    }

    static async batchCalls<TParameters, TResult>(parametersCollection: TParameters[], func: (parameters: TParameters) => Promise<TResult>, batchsize?: number)
    : Promise<Array<{ parameters: TParameters, result: TResult }>> {
        const batches = Helper.getBatches(parametersCollection, batchsize ?? 10);

        const collection = new Array<{ parameters: TParameters, result: TResult }>();

        for (const batch of batches) {
            const promises = batch.map(p => { return { parameters: p, promise: func(p) } });

            for (const promise of promises) {
                collection.push({
                    parameters: promise.parameters,
                    result: await promise.promise
                });
            }
        }

        return collection;
    }

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

    static getBatches<T>(values: T[], batchSize: number): Array<Array<T>> {
        const batches = new Array<Array<T>>();
        batches.push(new Array<T>());

        for (let index = 0; index < values.length; index++) {
            if (batches[batches.length - 1].length == batchSize) {
                batches.push(new Array<T>());
            }

            batches[batches.length - 1].push(values[index]);
        }

        return batches;
    }
}