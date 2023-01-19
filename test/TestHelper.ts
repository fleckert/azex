export class TestHelper {
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

    static stringIsNullUndefinedOrEmpty             (value: string | undefined | null) { return value === undefined || value === null || value.length === 0; }
    static stringIsNotNullAndNotUndefinedAndNotEmpty(value: string | undefined | null) { return value !== undefined && value !== null && value.length !== 0; }

}
