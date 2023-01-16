export class TestHelper {
    static checkForCorrespondingElements(collectionA: Array<string>, collectionB: Array<string>, compare: (a: string, b: string) => boolean): boolean {

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
