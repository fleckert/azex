import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { Helper                    } from "../../src/Helper";
import { Markdown                  } from "../../src/Converters/Markdown";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper.group-group-check.test.ts', async () => {
    const data : Array<Array<string>>= [
        //['principalName-group-A', 'principalName-group-B'],
    ];

    for (const datum of data) {
        await runTest(datum[0], datum[1])
    }
}, 100000);

const runTest = async (groupNameA: string| undefined, groupNameB: string| undefined) => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenant       = config.azureDevOps.tenant;

    if (groupNameA === undefined) { return; }
    if (groupNameB === undefined) { return; }

    const file = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-group-group-${groupNameA}-${groupNameB}.md`]);

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const groupA = await azureDevOpsHelper.groupByPrincipalName(organization, groupNameA);
    const groupB = await azureDevOpsHelper.groupByPrincipalName(organization, groupNameB);

    if (groupA?.descriptor === undefined) { throw new Error(`Failed to resolve ${JSON.stringify({ groupNameA })}`); }
    if (groupB?.descriptor === undefined) { throw new Error(`Failed to resolve ${JSON.stringify({ groupNameB })}`); }

    const graphMembershipsResultsA = await azureDevOpsHelper.graphMembershipsLists([{ organization, subjectDescriptor: groupA.descriptor, direction: 'down' }]);
    const graphMembershipsResultsB = await azureDevOpsHelper.graphMembershipsLists([{ organization, subjectDescriptor: groupB.descriptor, direction: 'down' }]);

    const descriptorsA = [...new Set(graphMembershipsResultsA.map(p => p.result).flat().map(p => p.memberDescriptor).filter(p => p !== undefined).map(p => p!))];
    const descriptorsB = [...new Set(graphMembershipsResultsB.map(p => p.result).flat().map(p => p.memberDescriptor).filter(p => p !== undefined).map(p => p!))];

    const { itemsInAandNotInB: userDescriptorsWithoutGroupAssignment } = Helper.getMissingElements(descriptorsA, descriptorsB, (a, b) => a.toLowerCase() === b.toLowerCase());

    const graphSubjectsLookUp = await azureDevOpsHelper.graphSubjectsLookup(organization, userDescriptorsWithoutGroupAssignment);

    const graphSubjects = Helper.toArray(graphSubjectsLookUp);

    graphSubjects.sort((a,b)=> `${a.displayName}`.toLowerCase().localeCompare(`${b.displayName}`.toLowerCase()))

    const markdown = Markdown.table(
        `${organization} - users in '${groupNameA}' and not in '${groupNameB}'`,
        ['displayName'],
        graphSubjects.map(p => [
            Markdown.getLinkWithToolTip(`${p.displayName}`, AzureDevOpsPortalLinks.Permissions(organization, undefined, p.descriptor!), `open permissions`)
        ])
    );

    await writeFile(file, markdown);

    console.log({ file });
}
