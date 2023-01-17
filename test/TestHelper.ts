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
}
