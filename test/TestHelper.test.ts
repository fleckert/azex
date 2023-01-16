import { TestHelper } from "./TestHelper";

test('TestHelper-checkArrays', async () => {

    const caseSensitiveCompare   = (a: string, b: string) => a               === b              ;
    const caseInsensitiveCompare = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

    expect(TestHelper.checkForCorrespondingElements([             ], [        ], caseSensitiveCompare  )).toBeTruthy();
    expect(TestHelper.checkForCorrespondingElements(['a'          ], ['a'     ], caseSensitiveCompare  )).toBeTruthy();
    expect(TestHelper.checkForCorrespondingElements(['a', 'b'     ], ['a', 'b'], caseSensitiveCompare  )).toBeTruthy();
    expect(TestHelper.checkForCorrespondingElements(['a', 'b'     ], ['b', 'a'], caseSensitiveCompare  )).toBeTruthy();
    expect(TestHelper.checkForCorrespondingElements(['a', 'b', 'a'], ['b', 'a'], caseSensitiveCompare  )).toBeTruthy();
    expect(TestHelper.checkForCorrespondingElements(['a', 'b', 'a'], ['B', 'a'], caseInsensitiveCompare)).toBeTruthy(); 

    expect(TestHelper.checkForCorrespondingElements(['a'          ], [        ], caseSensitiveCompare  )).toBeFalsy();
    expect(TestHelper.checkForCorrespondingElements([             ], ['b'     ], caseSensitiveCompare  )).toBeFalsy();
    expect(TestHelper.checkForCorrespondingElements(['a'          ], ['A'     ], caseSensitiveCompare  )).toBeFalsy();
    expect(TestHelper.checkForCorrespondingElements(['a', 'b'     ], ['a', 'B'], caseSensitiveCompare  )).toBeFalsy();
    expect(TestHelper.checkForCorrespondingElements(['a', 'b'     ], ['B', 'a'], caseSensitiveCompare  )).toBeFalsy(); 

}, 100000);
