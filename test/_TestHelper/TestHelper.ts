import { mkdir, rm } from "fs/promises";
import path from "path";

export class TestHelper {

    static async prepareFile(parts: string[]) {
        if(parts.length < 2){
            throw new Error(`Provide at least two strings.`);
        }

        await mkdir(path.join(...parts.slice(0, parts.length - 1)), { recursive: true });
        const file = path.join(...parts.slice(0, parts.length - 1), parts[parts.length-1].replaceAll(new RegExp('[^a-zA-Z0-9-_.]', 'g'), '_').replaceAll('__', '_'));
        await rm(file, { force: true });

        return file;
    }

    static checkValueAndError(item: { value: any | undefined, error: Error | undefined }, values?: any) {
        if (item.error !== undefined) { throw item.error; }
        if (item.value === undefined) { throw new Error(`item.value === undefined ${values === undefined ? undefined : JSON.stringify(values, null, 2)}`); }
    }

    static checkForCorrespondingElements<T>(collectionA: Array<T>, collectionB: Array<T>, compare: (a: T, b: T) => boolean): boolean {
        for (const a of collectionA) {
            if (collectionB.find(b => compare(a, b)) === undefined) {
                return false;
            }
        }
        for (const b of collectionB) {
            if (collectionA.find(a => compare(a, b)) === undefined) {
                return false;
            }
        }

        return true;
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

    static stringIsNullUndefinedOrEmpty             (value: string | undefined | null) { return value === undefined || value === null || value.length === 0; }
    static stringIsNotNullAndNotUndefinedAndNotEmpty(value: string | undefined | null) { return value !== undefined && value !== null && value.length !== 0; }

}
