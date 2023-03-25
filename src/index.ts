#! /usr/bin/env node

import { devops_auditlog_query     } from "./CommandHandler/devops_auditlog_query";
import { devops_identity_list      } from "./CommandHandler/devops_identity_list";
import { devops_identity_show      } from "./CommandHandler/devops_identity_show";
import { devops_invite_user        } from "./CommandHandler/devops_invite_user";
import { devops_memberships_copy   } from "./CommandHandler/devops_memberships_copy";
import { devops_memberships_show   } from "./CommandHandler/devops_memberships_show";
import { devops_pat                } from "./CommandHandler/devops_pat";
import { devops_permissions_token  } from "./CommandHandler/devops_permissions_token";
import { rbac_apply                } from "./CommandHandler/rbac_apply";
import { rbac_export               } from "./CommandHandler/rbac_export";
import { rbac_extend               } from "./CommandHandler/rbac_extend";
import { rbac_verify               } from "./CommandHandler/rbac_verify";
import { SubscriptionIdResolver    } from "./SubscriptionIdResolver";
import { TokenCredentialProvider   } from "./TokenCredentialProvider";

const args = process.argv.slice(2);
const commandName = 'azex';

const getArgv = (index: number): any => require('minimist')(process.argv.slice(index));

const checkSubscriptionId      = (value: string | undefined): string => checkParameter('subscription' , value, undefined                      );
const checkDevOpsTenant        = (value: string | undefined): string => checkParameter('tenant'       , value, 'AZURE_DEVOPS_EXT_TENANTID'    );
const checkDevOpsOrganization  = (value: string | undefined): string => checkParameter('organization' , value, 'AZURE_DEVOPS_EXT_ORGANIZATION');
const checkDevOpsProject       = (value: string | undefined): string => checkParameter('project'      , value, 'AZURE_DEVOPS_EXT_PROJECT'     );
const checkDevOpsPrincipalName = (value: string | undefined): string => checkParameter('principalName', value, undefined                      );

const checkParameter = (parameterName: string, parameterValue: string | undefined, environmentVariableName: string | undefined): string => {
    if (parameterValue !== undefined && parameterValue.trim() !== '') {
        return parameterValue.trim();
    }

    if (environmentVariableName === undefined) {
        throw new Error(`Parameter --${parameterName} is missing.`);
    }

    const environmentVariableValue = process.env[environmentVariableName] === undefined ? '' : `${process.env[environmentVariableName]}`;

    if (environmentVariableValue !== '') {
        return environmentVariableValue;
    }

    throw new Error(`Parameter --${parameterName} is missing and environmentVariable '${environmentVariableName}' is missing.`);
}

if (args[0]?.toLowerCase() === "rbac") {
    if (args[1]?.toLowerCase() === "export") {
        var argv = getArgv(2);
  
        new SubscriptionIdResolver().getSubscriptionId(argv.subscription)
        .then(async subscriptionId => {
            checkSubscriptionId(subscriptionId);
            await rbac_export.handle(TokenCredentialProvider.get(), subscriptionId!, argv.out ?? `${commandName}-${args[0]}-${args[1]}`.toLowerCase());
        });
    }
    else if (args[1]?.toLowerCase() === "verify") {
        var argv = getArgv(2);

        const path = checkParameter('path', argv.path, undefined);

        new SubscriptionIdResolver().getSubscriptionId(argv.subscription)
        .then(async subscriptionId => {
            checkSubscriptionId(subscriptionId);
            await rbac_verify.handle(TokenCredentialProvider.get(), subscriptionId!, path, argv.out ?? `${commandName}-${args[0]}-${args[1]}`.toLowerCase());
        });
    }
    else if (args[1]?.toLowerCase() === "extend") {
        var argv = getArgv(2);

        const path = checkParameter('path', argv.path, undefined);

        new SubscriptionIdResolver().getSubscriptionId(argv.subscription)
        .then(async subscriptionId => {
            checkSubscriptionId(subscriptionId);
            await rbac_extend.handle(TokenCredentialProvider.get(), subscriptionId!, path, argv.out ?? `${commandName}-${args[0]}-${args[1]}`.toLowerCase());
        });
    }
    else if (args[1]?.toLowerCase() === "apply") {
        var argv = getArgv(2);

        const path = checkParameter('path', argv.path, undefined);

        new SubscriptionIdResolver().getSubscriptionId(argv.subscription)
        .then(async subscriptionId => {
            checkSubscriptionId(subscriptionId);
            await rbac_apply.handle(TokenCredentialProvider.get(), subscriptionId!, path);
        });
    }
    else {
        console.error(`${args[0]?.toLowerCase()} ${args[1]?.toLowerCase()} - Unknown command`);
    }
}
else if (args[0]?.toLowerCase() === "devops") {
    if (args[1]?.toLowerCase() === "auditlog") {
        var argv = getArgv(2);

        const tenant       = checkDevOpsTenant      (argv.tenant      );
        const organization = checkDevOpsOrganization(argv.organization);

        devops_auditlog_query.handle(tenant, organization, 100000, argv.out ?? `${commandName}-${args[0]}-${args[1]}`.toLowerCase());
    }
    else if (args[1]?.toLowerCase() === "pat") {
        var argv = getArgv(2);

        const tenant = checkDevOpsTenant(argv.tenant);

        devops_pat.handle(tenant);
    }
    else if (args[1]?.toLowerCase() === "permissions") {
        if (args[2]?.toLowerCase() === "tokens") {
            var argv = getArgv(3);

            const tenant       = checkDevOpsTenant      (argv.tenant      );
            const organization = checkDevOpsOrganization(argv.organization);
            const project      = checkDevOpsProject     (argv.project     );

            devops_permissions_token.all(tenant, organization, project, argv.out ?? `${commandName}-${args[0]}-${args[1]}-${args[2]}`.toLowerCase());
        }
        else {
            console.error(`${args[0]} ${args[1]} ${args[2]} - unknown command`.toLowerCase());
        }
    }
    else if (args[1]?.toLowerCase() === "memberships") {
        if (args[2]?.toLowerCase() === "show") {
            var argv = getArgv(3);

            const tenant        = checkDevOpsTenant       (argv.tenant                           );
            const organization  = checkDevOpsOrganization (argv.organization                     );
            const principalName = checkDevOpsPrincipalName(argv.principalName                    );

            devops_memberships_show.handle(tenant, organization, argv.projectName, principalName, argv.out ?? `${commandName}-${args[0]}-${args[1]}-${args[2]}`.toLowerCase());
        } 
        else if (args[2]?.toLowerCase() === "copy") {
            var argv = getArgv(3);

            const tenant              = checkDevOpsTenant      (argv.tenant                     );
            const organization        = checkDevOpsOrganization(argv.organization               );
            const principalNameSource = checkParameter         ('source', argv.source, undefined);
            const principalNameTarget = checkParameter         ('target', argv.target, undefined);
            const add                 = true;
            const remove              = true; 

            devops_memberships_copy.handle(tenant, organization, principalNameSource , principalNameTarget, add, remove);
        }
        else if (args[2]?.toLowerCase() === "test") {
            var argv = getArgv(3);

            const tenant              = checkDevOpsTenant      (argv.tenant                     );
            const organization        = checkDevOpsOrganization(argv.organization               );
            const principalNameSource = checkParameter         ('source', argv.source, undefined);
            const principalNameTarget = checkParameter         ('target', argv.target, undefined);
            const add                 = false;
            const remove              = false; 

            devops_memberships_copy.handle(tenant, organization, principalNameSource , principalNameTarget, add, remove);
        }
        else if (args[2]?.toLowerCase() === "add") {
            var argv = getArgv(3);

            const tenant              = checkDevOpsTenant      (argv.tenant                     );
            const organization        = checkDevOpsOrganization(argv.organization               );
            const principalNameSource = checkParameter         ('source', argv.source, undefined);
            const principalNameTarget = checkParameter         ('target', argv.target, undefined);
            const add                 = true;
            const remove              = false; 

            devops_memberships_copy.handle(tenant, organization, principalNameSource , principalNameTarget, add, remove);
        }
        else {
            console.error(`${args[0]} ${args[1]} ${args[2]} - unknown command`.toLowerCase());
        }
    }
    else if (args[1]?.toLowerCase() === "identity") {
        if (args[2]?.toLowerCase() === "list") {
            var argv = getArgv(3);

            const tenant       = checkDevOpsTenant       (argv.tenant     );
            const organization = checkDevOpsOrganization(argv.organization);
            const project      = argv.project ?? (process.env['AZURE_DEVOPS_EXT_PROJECT'] === undefined ? undefined : `${process.env['AZURE_DEVOPS_EXT_PROJECT']}`.trim());

            devops_identity_list.resolve(tenant, organization, project , argv.out ?? `${commandName}-${args[0]}-${args[1]}-${args[2]}`.toLowerCase());
        }
        else if (args[2]?.toLowerCase() === "show") {
            var argv = getArgv(3);

            const tenant        = checkDevOpsTenant       (argv.tenant       );
            const organization  = checkDevOpsOrganization (argv.organization );
            const principalName = checkDevOpsPrincipalName(argv.principalName);

            devops_identity_show.resolve(tenant, organization, principalName, ['User', 'Group']);
        }
        else {
            console.error(`${args[0]} ${args[1]} ${args[2]} - unknown command`.toLowerCase());
        }
    }
    else if (args[1]?.toLowerCase() === "user") {
        if (args[2]?.toLowerCase() === "invite") {
            var argv = getArgv(3);

            const tenant        = checkDevOpsTenant       (argv.tenant       );
            const organization  = checkDevOpsOrganization (argv.organization );
            const principalName = checkDevOpsPrincipalName(argv.principalName);
            const accessLevel   = 'express';

            devops_invite_user.handle(tenant, organization, principalName, accessLevel);
        }
        else {
            console.error(`${args[0]} ${args[1]} ${args[2]} - unknown command`.toLowerCase());
        }
    }
    else {
        console.error(`${args[0]} ${args[1]} - unknown command`.toLowerCase());
    }
}
else {
    console.error("unknown command");
}
