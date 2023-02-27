export class Helper {
    static toArray<T>(mapping: { [id: string]: T; }): Array<T> {
        const collection = new Array<T>();

        for (const key in mapping) {
            collection.push(mapping[key]);
        }

        return collection;
    }
}