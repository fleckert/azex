#! /usr/bin/env node

import { devops_permissions_export } from "./CommandHandler/devops_permissions_export";
import { devops_permissions_show } from "./CommandHandler/devops_permissions_show";
import { rbac_apply                } from "./CommandHandler/rbac_apply";
import { rbac_export               } from "./CommandHandler/rbac_export";
import { rbac_extend               } from "./CommandHandler/rbac_extend";
import { rbac_verify               } from "./CommandHandler/rbac_verify";
import { SubscriptionIdResolver    } from "./SubscriptionIdResolver";
import { TokenCredentialProvider   } from "./TokenCredentialProvider";

const args = process.argv.slice(2);

if (args[0]?.toLowerCase() === "rbac") {
    if (args[1]?.toLowerCase() === "export") {
        var argv = require('minimist')(process.argv.slice(2));
  
        new SubscriptionIdResolver().getSubscriptionId(argv.subscription)
        .then(async subscriptionId => {
            checkSubscriptionId(subscriptionId);
            await rbac_export.handle(TokenCredentialProvider.get(), subscriptionId!, argv.out ?? `azex-${args[0].toLowerCase()}-${args[1].toLowerCase()}`);
        });
    }
    else if (args[1]?.toLowerCase() === "verify")
    {
        var argv = require('minimist')(process.argv.slice(2));

        if (argv.path === undefined) { console.error("Parameter --path is missing."); }
        else {
            new SubscriptionIdResolver().getSubscriptionId(argv.subscription)
            .then(async subscriptionId => {
                checkSubscriptionId(subscriptionId);
                await rbac_verify.handle(TokenCredentialProvider.get(), subscriptionId!, argv.path, argv.out ?? `azex-${args[0].toLowerCase()}-${args[1].toLowerCase()}`);
            });
        }
    }
    else if (args[1]?.toLowerCase() === "extend")
    {
        var argv = require('minimist')(process.argv.slice(2));

        if (argv.path === undefined) { console.error("Parameter --path is missing."); }
        else {
            new SubscriptionIdResolver().getSubscriptionId(argv.subscription)
            .then(async subscriptionId => {
                checkSubscriptionId(subscriptionId);
                await rbac_extend.handle(TokenCredentialProvider.get(), subscriptionId!, argv.path, argv.out ?? `azex-${args[0].toLowerCase()}-${args[1].toLowerCase()}`);
            });
        }
    }
    else if (args[1]?.toLowerCase() === "apply")
    {
        var argv = require('minimist')(process.argv.slice(2));

        if (argv.path === undefined) { console.error("Parameter --path is missing."); }
        else {
            new SubscriptionIdResolver().getSubscriptionId(argv.subscription)
            .then(async subscriptionId => {
                checkSubscriptionId(subscriptionId);
                await rbac_apply.handle(TokenCredentialProvider.get(), subscriptionId!, argv.path);
            })
            .catch(console.error);
        }
    }
    else {
        console.error(`${args[0]?.toLowerCase()} ${args[1]?.toLowerCase()} - Unknown command`);
    }
}
else if (args[0]?.toLowerCase() === "devops") {
    if (args[1]?.toLowerCase() === "permissions") {
        if (args[2]?.toLowerCase() === "export") {
            var argv = require('minimist')(process.argv.slice(3));

                 if (argv.organization === undefined) { console.error("Parameter --organization is missing."); }
            else if (argv.project      === undefined) { console.error("Parameter --project is missing."     ); }
            else {
                devops_permissions_export.handle(argv.organization, argv.project, argv.out ?? `azex-${args[0].toLowerCase()}-${args[1].toLowerCase()}-${args[2]?.toLowerCase()}`);
            }
        }
        else if (args[2]?.toLowerCase() === "show") {
            var argv = require('minimist')(process.argv.slice(3));

                 if (argv.organization  === undefined) { console.error("Parameter --organization is missing." ); }
            else if (argv.principalName === undefined) { console.error("Parameter --principalName is missing."); }
            else {
                devops_permissions_show.handle(argv.organization, argv.project, argv.principalName, argv.out ?? `azex-${args[0].toLowerCase()}-${args[1].toLowerCase()}-${args[2]?.toLowerCase()}`);
            }
        }
        else {
            console.error(`${args[0]?.toLowerCase()} ${args[1]?.toLowerCase()} ${args[2]?.toLowerCase()} - Unknown command`);
        }
    }
    else {
        console.error(`${args[0]?.toLowerCase()} ${args[1]?.toLowerCase()} - Unknown command`);
    }
}
else {
    console.error("Unknown command");
}

const checkSubscriptionId = (subscriptionId : string | undefined) => {
    if (subscriptionId === undefined || subscriptionId === '') { throw new Error("Parameter --subscription is missing."); }
}