import { GraphMember                            } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { writeFile                              } from "fs/promises";
import { AzureDevOpsPermissionsResolver         } from "../../src/AzureDevOpsPermissionsResolver";
import { AzureDevOpsPermissionsResolverBottomUp } from "../../src/AzureDevOpsPermissionsResolverBottomUp";
import { Markdown                               } from "../../src/Converters/Markdown";
import { Html                                   } from "../../src/Converters/Html";
import { TestConfigurationProvider              } from "../_Configuration/TestConfiguration";

test('AzureDevOpsPermissionsResolver', async () => {
    const config = await TestConfigurationProvider.get();

    const { items, error } = await new AzureDevOpsPermissionsResolver().resolve(config.azureDevOps.organization, config.azureDevOps.projectName);

    if (error !== undefined) { throw error; }
    if (items === undefined) { throw new Error("items === undefined"); }

    const memberHierarchy = new AzureDevOpsPermissionsResolverBottomUp().getGraphContainerMemberHierarchies(items);

    if (memberHierarchy.length === 0) { throw new Error("memberHierarchy.length === 0"); }

    await writeFile("test.json", JSON.stringify(memberHierarchy, null, 2));

    for(const item of memberHierarchy){
        const groupMembersFlat = new AzureDevOpsPermissionsResolverBottomUp().getOneGraphSubjectMemberOfFlat(item);

        const mapper = (item: { container: GraphMember, member: GraphMember }) => { return { container: item.container.principalName, member: item.member.principalName } };

        const titleHtml     = `${config.azureDevOps.organization}-${config.azureDevOps.projectName}-${item.graphSubject.displayName}`;
        const suffixAll     = "members-all";
        const path          = "./temp/test-test-test";
        const suffixDescriptor = `${item.graphSubject.displayName}-${item.graphSubject.originId}`;

        await Promise.all([
            writeFile(`${path}-${config.azureDevOps.organization}-${config.azureDevOps.projectName}-${suffixDescriptor}-${suffixAll    }.md`  , Markdown.getMermaidDiagramForHierarchy(                             groupMembersFlat.map(mapper))),
            writeFile(`${path}-${config.azureDevOps.organization}-${config.azureDevOps.projectName}-${suffixDescriptor}-${suffixAll    }.html`, Html    .getMermaidDiagramForHierarchy(`${titleHtml}-${suffixAll}`, groupMembersFlat.map(mapper))),
        ]);
    }
}, 100000);
