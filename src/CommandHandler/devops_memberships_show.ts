import { AzureDevOpsHelper                                         } from "../AzureDevOpsHelper";
import { AzureDevOpsItemAndOthersEx                                } from "../models/AzureDevOpsItemAndOthersEx";
import { AzureDevOpsMembershipsResolver                            } from "../AzureDevOpsMembershipsResolver";
import { AzureDevOpsPortalLinks                                    } from "../AzureDevOpsPortalLinks";
import { GraphGroup, GraphMember, GraphServicePrincipal, GraphUser } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Helper                                                    } from "../Helper";
import { Html                                                      } from "../Converters/Html";
import { Markdown                                                  } from "../Converters/Markdown";
import { rm, writeFile                                             } from "fs/promises";
import { TeamProjectReference                                      } from "azure-devops-node-api/interfaces/CoreInterfaces";


export class devops_memberships_show {

    static async handle(tenant: string, organization: string, projectName: string | undefined, principalName: string, path: string): Promise<void> {
        const startDate = new Date();
        
        const azureDevOpsHelper =  await AzureDevOpsHelper.instance(tenant);

        const project = projectName === undefined ? undefined : await azureDevOpsHelper.project(organization, projectName);

        const file = `${path}-${organization}` +
                     `${project === undefined ? '' : `-${project.name}`.replaceAll(' ', '_')}` +
                     `-${principalName.replaceAll(new RegExp('[^a-zA-Z0-9_]', 'g'), '_').replaceAll('__', '_')}`;

        const markdownUngrouped = `${file}.md`          ; await rm(markdownUngrouped, { force: true });
        const markdownGrouped   = `${file}-compact.md`  ; await rm(markdownGrouped  , { force: true });
        const htmlUngrouped = `${file}.html`        ; await rm(htmlUngrouped, { force: true });
        const htmlGrouped   = `${file}-compact.html`; await rm(htmlGrouped  , { force: true });

        const graphMember = await azureDevOpsHelper.graphMemberByPrincipalName(organization, ['User', 'Group'], principalName);

        if (graphMember?.descriptor === undefined) {
            throw new Error(JSON.stringify({ tenant, organization, principalName, graphMember, message: `Failed to resolve '${principalName}' in '${organization}'.` }));
        }

        const itemAndOthersUpPromise   = new AzureDevOpsMembershipsResolver().resolve(azureDevOpsHelper, organization, graphMember.descriptor, 'up'  );
        const itemAndOthersDownPromise = new AzureDevOpsMembershipsResolver().resolve(azureDevOpsHelper, organization, graphMember.descriptor, 'down');

        const itemAndOthersUp   = await itemAndOthersUpPromise;
        const itemAndOthersDown = await itemAndOthersDownPromise;

        const itemAndOthersFlatUp   = itemAndOthersUp?.  flatten('up'  ) ?? [];
        const itemAndOthersFlatDown = itemAndOthersDown?.flatten('down') ?? [];

        const itemAndOthersFlatAll = [...itemAndOthersFlatDown, ...itemAndOthersFlatUp];

        const itemAndOthersExDown = itemAndOthersDown === undefined ? undefined : new AzureDevOpsItemAndOthersEx(itemAndOthersDown);
        const itemAndOthersExUp   = itemAndOthersUp   === undefined ? undefined : new AzureDevOpsItemAndOthersEx(itemAndOthersUp  );

        const itemAndOthersExUpFlat   = itemAndOthersExUp   === undefined ? [] : itemAndOthersExUp  .flatten('up'  );
        const itemAndOthersExDownFlat = itemAndOthersExDown === undefined ? [] : itemAndOthersExDown.flatten('down');

        const itemAndOthersExFlatAll = [...itemAndOthersExDownFlat, ...itemAndOthersExUpFlat];

        const blackList = ['Project Valid Users', 'Project Collection Valid Users'];
        const principalNameResolved = `${graphMember?.principalName}`;
        const itemAndOthersFlat   = this.filter  (principalNameResolved, blackList, project, itemAndOthersFlatAll  )
        const itemAndOthersExFlat = this.filterEx(principalNameResolved, blackList, project, itemAndOthersExFlatAll);

        const linebreak = '<br/>';

        const displayForMember    = (member   : GraphMember) => { return AzureDevOpsHelper.isGraphUser(member) ? `${member.displayName}${linebreak}${member.principalName}` : `${member.principalName}` };
        const displayForContainer = (container: GraphMember) => { return `${container.principalName}`; }
        const displayForGroup     = (group    : GraphGroup ) => { return `${group    .principalName}`; }
        const displayForUsers     = (users    : (GraphUser | GraphServicePrincipal)[]) => { return users.map(m => `${m.displayName}`).join(`${linebreak}`); }
    
        const focus  = [{ value: principalNameResolved }];
        const styles = [
            { value: '', style: 'text-align:left' }
        ];

        if (AzureDevOpsHelper.isGraphGroup(graphMember)) {
            styles.push({ value: principalNameResolved, style: 'fill:#00758f' });
        }

        itemAndOthersFlat  .sort((a, b) => this.sort(a, b, displayForMember));
        itemAndOthersExFlat.sort(this.sortEx);

        const links   = this.getLinks  (organization, itemAndOthersFlat  , displayForContainer, displayForMember);
        const linksEx = this.getLinksEx(organization, itemAndOthersExFlat, displayForContainer                  );

        const items   = this.getItems  (itemAndOthersFlat  , displayForContainer, displayForMember                );
        const itemsEx = this.getItemsEx(itemAndOthersExFlat, displayForContainer, displayForGroup, displayForUsers);

        const title = `${organization} ${project === undefined ? '' : `/ ${project.name} `}/ ${principalName}`;

        const markdown   = Markdown.getMermaidDiagramForHierarchyWithStylesAndLinks(items  , focus, styles, links  );
        const markdownEx = Markdown.getMermaidDiagramForHierarchyWithStylesAndLinks(itemsEx, focus, styles, linksEx);
        const html       = Html    .getMermaidDiagramForHierarchyWithStylesAndLinks(items  , focus, styles, links  , title);
        const htmlEx     = Html    .getMermaidDiagramForHierarchyWithStylesAndLinks(itemsEx, focus, styles, linksEx, title);

        await Promise.all([
            writeFile(markdownUngrouped, markdown),
            AzureDevOpsHelper.isGraphGroup(graphMember) ? writeFile(markdownGrouped, markdownEx) : Promise<void>,
            writeFile(htmlUngrouped, html),
            AzureDevOpsHelper.isGraphGroup(graphMember) ? writeFile(htmlGrouped, htmlEx) : Promise<void>,
        ]);

        console.log(JSON.stringify({
            parameters: {
                tenant,
                organization,
                projectName,
                principalName,
                path
            },
            durationInSeconds: Helper.durationInSeconds(startDate),
            files: {
                markdown: {
                    explicit: markdownUngrouped,
                    compact : AzureDevOpsHelper.isGraphGroup(graphMember) ? markdownGrouped : undefined
                },
                html: {
                    explicit: htmlUngrouped,
                    compact : AzureDevOpsHelper.isGraphGroup(graphMember) ? htmlGrouped : undefined
                }
            }
        }, null, 2));
    }

    private static getItems(
        items              : Array<{ container: GraphMember; member: GraphMember; }>,
        displayForContainer: (g: GraphMember) => string,
        displayForMember   : (g: GraphMember) => string
    ): Array<{ container: string, member: string }> {
        return items.map(item => {
            return {
                container: displayForContainer(item.container),
                member   : displayForMember   (item.member   )
            }
        })
    }

    private static getItemsEx(
        items: Array<{ container: GraphMember; users: Array<GraphUser>; } | { container: GraphMember; group: GraphGroup; }>,
        displayForContainer: (item : GraphMember) => string,
        displayForGroup    : (item : GraphMember) => string,
        displayForUsers    : (items: GraphUser[]) => string
    ) : Array<{ container: string, member: string }>
    {
        return items.map(p => {
            if ('users' in p) {
                p.users.sort((a: GraphUser, b: GraphUser) => `${a.displayName}`.toLowerCase().localeCompare(`${b.displayName}`.toLowerCase()));
            }

            return {
                container: displayForContainer(p.container),
                member   : 'users' in p ? displayForUsers(p.users) : displayForGroup(p.group)
            }
        });
    }

    private static getLinks(
        organization: string,
        items: Array<{ container: GraphMember; member: GraphMember; }>,
        displayForContainer: (item: GraphMember) => string,
        displayForMember   : (item: GraphMember) => string
    ) {
        const links: { [id: string]: { value: string, href: string, target: '_self' | '_blank' | '_parent' | '_top' } } = {};

        for (const item of items) {
            if (item.container.descriptor !== undefined) {
                const value = displayForContainer(item.container);
                links[value] = { value, href: AzureDevOpsPortalLinks.Permissions(organization, undefined, item.container.descriptor), target: '_blank' }
            }

            if (item.member.descriptor !== undefined) {
                const value = displayForMember(item.member)
                links[value] = { value, href: AzureDevOpsPortalLinks.Permissions(organization, undefined, item.member.descriptor), target: '_blank' }
            }
        }

        return Helper.toArray(links);
    }

    private static getLinksEx(
        organization: string,
        items: Array<{ container: GraphMember; users: Array<GraphUser>; } | { container: GraphMember; group: GraphGroup; }>,
        displayForContainer: (item: GraphMember) => string
    ) {
        const links: { [id: string]: { value: string, href: string, target: '_self' | '_blank' | '_parent' | '_top' } } = {};
        for (const item of items) {
            if (item.container.descriptor !== undefined) {
                const value = displayForContainer(item.container);
                links[value] = { value, href: AzureDevOpsPortalLinks.Permissions(organization, undefined, item.container.descriptor), target: '_blank' }
            }

            if ('group' in item && item.group.descriptor !== undefined) {
                const value = `${item.group.principalName}`
                links[value] = { value, href: AzureDevOpsPortalLinks.Permissions(organization, undefined, item.group.descriptor), target: '_blank' }
            }
        }

        return Helper.toArray(links);
    }

    private static filter(principalName: string, blackList:string[], project: TeamProjectReference | undefined, items: Array<{ container: GraphMember; member: GraphMember; }>){
        return items
            .filter(p => blackList.find(m => `${p.container.principalName}`.indexOf(m) > 0) === undefined || p.container.principalName?.toLowerCase() === principalName.toLowerCase())
            .filter(p => project === undefined || p.container.principalName?.startsWith(`[${project.name}]`) || p.container.principalName?.toLowerCase() === principalName.toLowerCase());
    }

    private static filterEx(principalName: string, blackList:string[], project: TeamProjectReference | undefined, items: Array<{ container: GraphMember; users: Array<GraphUser>; } | { container: GraphMember; group: GraphGroup; }>) {
        return items
            .filter(p => blackList.find(m => `${p.container.principalName}`.indexOf(m) > 0) === undefined || p.container.principalName?.toLowerCase() === principalName.toLowerCase())
            .filter(p => project === undefined || p.container.principalName?.startsWith(`[${project.name}]`) || p.container.principalName?.toLowerCase() === principalName.toLowerCase());
    }

    private static sort(
        a: { member: GraphMember, container: GraphMember }, 
        b: { member: GraphMember, container: GraphMember },
        displayForMember   : (item: GraphMember) => string
    ) {
        const map = (p: { container: GraphMember, member: GraphMember }, displayForMember: (item: GraphMember) => string) => {
            return `${displayForMember(p.container)}-${displayForMember(p.member)}`.toLowerCase();
        };

        return map(a, displayForMember).localeCompare(map(b, displayForMember));
    }

    private static sortEx(a:{ container: GraphMember; users: Array<GraphUser>; } | { container: GraphMember; group: GraphGroup; }, b:{ container: GraphMember; users: Array<GraphUser>; } | { container: GraphMember; group: GraphGroup; }){
        if ('group' in a && 'users' in b) {
            return -1;
        }
        else if ('users' in a && 'group' in b) {
            return 1;
        }
        else if ('group' in a && 'group' in b) {
            return `${a.group.principalName}`.toLowerCase().localeCompare(`${b.group.principalName}`.toLowerCase());
        }
        else if ('users' in a && 'users' in b) {
            return 0;
        }

        return 0;
    }
}
