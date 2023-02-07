
export class AzureDevOpsSecurityNamespaceIds {
    // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#object-level-namespaces-and-permissions
    // object-level-namespaces-and-permissions
    static readonly AnalyticsViews                 = "d34d3680-dfe5-4cc6-a949-7d9c68f73cba";
    static readonly Build                          = "33344d9c-fc72-4d6f-aba5-fa317101a7e9";
    static readonly CSS                            = "83e28ad4-2d72-4ceb-97b0-c7726d5502c3";
    static readonly DashboardsPrivileges           = "8adf73b7-389a-4276-b638-fe1653f7efc7";
    static readonly GitRepositories                = "2e9eb7ed-3c0a-47d4-87c1-0ffdd275fd87";
    static readonly Iteration                      = "bf7bfa03-b2b7-47db-8113-fa2e002cc5b1";
    static readonly MetaTask                       = "f6a4de49-dbe2-4704-86dc-f8ec1a294436";
    static readonly Plan                           = "bed337f8-e5f3-4fb9-80da-81e17d06e7a8";
    static readonly ReleaseManagement              = "c788c23e-1b46-4162-8f5e-d7585343b5de";
    static readonly WorkItemQueryFolders           = "71356614-aad7-4757-8f2c-0fb3bff6f680";

    // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#project-level-namespaces-and-permissions
    // project-level-namespaces-and-permissions
    static readonly Project                        = "52d39943-cb85-4d7f-8fa8-c6baac873819";
    static readonly Tagging                        = "bb50f182-8e5e-40b8-bc21-e8752a1e7ae2";
    static readonly VersionControlItems            = "a39371cf-0841-4c16-bbd3-276e341bc052";

    // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#organization-level-namespaces-and-permissions
    // organization-level-namespaces-and-permissions
    static readonly AuditLog                       = "a6cc6381-a1ca-4b36-b3c1-4e65211e82b6";
    static readonly BuildAdministration            = "302acaca-b667-436d-a946-87133492041c";
    static readonly Collection                     = "3e65f728-f8bc-4ecd-8764-7e378b19bfa7";
    static readonly Process                        = "2dab47f9-bd70-49ed-9bd5-8eb051e59c02";
    static readonly Workspaces                     = "93bafc04-9075-403a-9367-b7164eac6b5c";
    static readonly VersionControlPrivileges       = "66312704-deb5-43f9-b51c-ab4ff5e351c3";

    // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#role-based-namespaces-and-permissions
    // role-based-namespaces-and-permissions
    static readonly DistributedTask                = "101eae8c-1709-47f9-b228-0e476c35b3ba";
    static readonly Environment                    = "83d4c2e6-e57d-4d6e-892b-b87222b7ad20";
    static readonly ExtensionManagement            = "5d6d7b80-3c63-4ab0-b699-b6a5910f8029";
    static readonly Library                        = "b7e84409-6553-448a-bbb2-af228e07cbeb";
    static readonly ServiceEndpoints               = "49b48001-ca20-4adc-8111-5b60c903a50c";

    // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#internal-namespaces-and-permissions
    // internal-namespaces-and-permissions
    static readonly AccountAdminSecurity           = "11238e09-49f2-40c7-94d0-8f0307204ce4";
    static readonly Analytics                      = "58450c49-b02d-465a-ab12-59ae512d6531";
    static readonly BlobStoreBlobPrivileges        = "19F9F97D-7CB7-45F7-8160-DD308A6BD48E";
    static readonly Boards                         = "251e12d9-bea3-43a8-bfdb-901b98c0125e";
    static readonly BoardsExternalIntegration      = "5ab15bc8-4ea1-d0f3-8344-cab8fe976877";
    static readonly Chat                           = "bc295513-b1a2-4663-8d1a-7017fd760d18";
    static readonly DiscussionThreads              = "0d140cae-8ac1-4f48-b6d1-c93ce0301a12";
    static readonly EventPublish                   = "7cd317f2-adc6-4b6c-8d99-6074faeaf173";
    static readonly EventSubscriber                = "2bf24a2b-70ba-43d3-ad97-3d9e1f75622f";
    static readonly EventSubscription              = "58b176e7-3411-457a-89d0-c6d0ccb3c52b";
    static readonly Identity                       = "5a27515b-ccd7-42c9-84f1-54c998f03866";
    static readonly Licensing                      = "453e2db3-2e81-474f-874d-3bf51027f2ee";
    static readonly PermissionLevel                = "25fb0ed7-eb8f-42b8-9a5e-836a25f67e37";
    static readonly OrganizationLevelData          = "F0003BCE-5F45-4F93-A25D-90FC33FE3AA9";
    static readonly PipelineCachePrivileges        = "62a7ad6b-8b8d-426b-ba10-76a7090e94d5";
    static readonly ReleaseManagementInternal      = "7c7d32f7-0e86-4cd6-892e-b35dbba870bd";
    static readonly SearchSecurity                 = "ca535e7e-67ce-457f-93fe-6e53aa4e4160";
    static readonly ServiceHooks                   = "cb594ebe-87dd-4fc9-ac2c-6a10a4c92046";
    static readonly UtilizationPermissions         = "83abde3a-4593-424e-b45f-9898af99034d";
    static readonly WorkItemTrackingAdministration = "445d2788-c5fb-4132-bbef-09c4045ad93f";
    static readonly WorkItemTrackingProvision      = "5a6cd233-6615-414d-9393-48dbb252bd23";
}
