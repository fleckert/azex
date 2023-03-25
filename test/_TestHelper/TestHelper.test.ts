import { writeFile } from "fs/promises";
import { TestHelper } from "./TestHelper";

test('TestHelper-prepareFile', async () => {

    const testValues = [
        [__dirname, 'out', 'file.json'   ],
        [__dirname, 'out', 'file .json'  ],
        [__dirname, 'out', 'file 0.json' ],
        [__dirname, 'out', 'file\\1.json'],
        [__dirname, 'out', 'file/2.json' ],
    ]

    await Promise.all(testValues.map(p => prepareFile(p)));
});

const prepareFile = async (values: string[]) => {
    const file = await TestHelper.prepareFile(values)
    await writeFile(file, '');
}

test('TestHelper-checkArrays-strings', async () => {

    const caseSensitiveCompare   = (a: string, b: string) => a               === b              ;
    const caseInsensitiveCompare = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

    expect(TestHelper.checkForCorrespondingElements([             ], [        ], caseSensitiveCompare  )).toBeTruthy();
    expect(TestHelper.checkForCorrespondingElements(['a'          ], ['a'     ], caseSensitiveCompare  )).toBeTruthy();
    expect(TestHelper.checkForCorrespondingElements(['a', 'b'     ], ['a', 'b'], caseSensitiveCompare  )).toBeTruthy();
    expect(TestHelper.checkForCorrespondingElements(['a', 'b'     ], ['b', 'a'], caseSensitiveCompare  )).toBeTruthy();
    expect(TestHelper.checkForCorrespondingElements(['a', 'b', 'a'], ['b', 'a'], caseSensitiveCompare  )).toBeTruthy();
    expect(TestHelper.checkForCorrespondingElements(['a', 'b', 'a'], ['B', 'a'], caseInsensitiveCompare)).toBeTruthy(); 

    expect(TestHelper.checkForCorrespondingElements(['a'          ], [        ], caseSensitiveCompare  )).toBeFalsy ();
    expect(TestHelper.checkForCorrespondingElements([             ], ['b'     ], caseSensitiveCompare  )).toBeFalsy ();
    expect(TestHelper.checkForCorrespondingElements(['a'          ], ['A'     ], caseSensitiveCompare  )).toBeFalsy ();
    expect(TestHelper.checkForCorrespondingElements(['a', 'b'     ], ['a', 'B'], caseSensitiveCompare  )).toBeFalsy ();
    expect(TestHelper.checkForCorrespondingElements(['a', 'b'     ], ['B', 'a'], caseSensitiveCompare  )).toBeFalsy (); 
});


test('TestHelper-checkArrays-numbers', async () => {

    const compare = (a: number, b: number) => a === b; 
    expect(TestHelper.checkForCorrespondingElements([       ], [    ], compare)).toBeTruthy();
    expect(TestHelper.checkForCorrespondingElements([1      ], [1   ], compare)).toBeTruthy();
    expect(TestHelper.checkForCorrespondingElements([1, 2   ], [1, 2], compare)).toBeTruthy();
    expect(TestHelper.checkForCorrespondingElements([1, 2   ], [2, 1], compare)).toBeTruthy();
    expect(TestHelper.checkForCorrespondingElements([1, 2, 1], [2, 1], compare)).toBeTruthy(); 

    expect(TestHelper.checkForCorrespondingElements([1      ], [    ], compare)).toBeFalsy ();
    expect(TestHelper.checkForCorrespondingElements([       ], [1   ], compare)).toBeFalsy ();
    expect(TestHelper.checkForCorrespondingElements([1      ], [2   ], compare)).toBeFalsy (); 
});