export class PromiseHelper {
    static tryResolve<T>(promise: Promise<T>, abortController: AbortController, defaultT: () => T): Promise<T> {
        if (abortController.signal.aborted) {
            return Promise.resolve(defaultT());
        }

        return Promise.race(
            [
                promise,
                new Promise<T>(
                    (resolve, reject) => {
                        abortController!.signal.addEventListener(
                            'abort',
                            function onAbort() {
                                abortController!.signal.removeEventListener('abort', onAbort);
                                resolve(defaultT());
                            }
                        );
                    }
                )
            ]
        );
    }
}
