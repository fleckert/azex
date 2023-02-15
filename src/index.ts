#! /usr/bin/env node

import { devops_identity_show } from "./CommandHandler/devops_identity_show";
import { devops_permissions_export } from "./CommandHandler/devops_permissions_export";
import { devops_permissions_show } from "./CommandHandler/devops_permissions_show";
import { devops_permissions_token } from "./CommandHandler/devops_permissions_token";
import { rbac_apply                } from "./CommandHandler/rbac_apply";
import { rbac_export               } from "./CommandHandler/rbac_export";
import { rbac_extend               } from "./CommandHandler/rbac_extend";
import { rbac_verify               } from "./CommandHandler/rbac_verify";
import { SubscriptionIdResolver    } from "./SubscriptionIdResolver";
import { TokenCredentialProvider   } from "./TokenCredentialProvider";

const args = process.argv.slice(2);
const commandName = 'azex';

if (args[0]?.toLowerCase() === "rbac") {
    if (args[1]?.toLowerCase() === "export") {
        var argv = require('minimist')(process.argv.slice(2));
  
        new SubscriptionIdResolver().getSubscriptionId(argv.subscription)
        .then(async subscriptionId => {
            checkSubscriptionId(subscriptionId);
            await rbac_export.handle(TokenCredentialProvider.get(), subscriptionId!, argv.out ?? `${commandName}-${args[0]}-${args[1]}`.toLowerCase());
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
                await rbac_verify.handle(TokenCredentialProvider.get(), subscriptionId!, argv.path, argv.out ?? `${commandName}-${args[0]}-${args[1]}`.toLowerCase());
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
                await rbac_extend.handle(TokenCredentialProvider.get(), subscriptionId!, argv.path, argv.out ?? `${commandName}-${args[0]}-${args[1]}`.toLowerCase());
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
                devops_permissions_export.handle(argv.organization, argv.project, argv.out ?? `${commandName}-${args[0]}-${args[1]}-${args[2]}`.toLowerCase());
            }
        }
        else if (args[2]?.toLowerCase() === "show") {
            var argv = require('minimist')(process.argv.slice(3));

                 if (argv.organization  === undefined) { console.error("Parameter --organization is missing." ); }
            else if (argv.principalName === undefined) { console.error("Parameter --principalName is missing."); }
            else {
                devops_permissions_show.handle(argv.organization, argv.project, argv.principalName, argv.out ?? `${commandName}-${args[0]}-${args[1]}-${args[2]}`.toLowerCase());
            }
        }
        else if (args[2]?.toLowerCase() === "tokens") {
            var argv = require('minimist')(process.argv.slice(3));

                 if (argv.organization === undefined) { console.error("Parameter --organization is missing."); }
            else if (argv.project      === undefined) { console.error("Parameter --project is missing."     ); }
            else {
                devops_permissions_token.all(argv.organization, argv.project, argv.out ?? `${commandName}-${args[0]}-${args[1]}-${args[2]}`.toLowerCase());
            }
        }
        else {
            console.error(`${args[0]} ${args[1]} ${args[2]} - unknown command`.toLowerCase());
        }
    }
    else if (args[1]?.toLowerCase() === "identity") {
        if (args[2]?.toLowerCase() === "show") {
            if (args[3]?.toLowerCase() === "user") {
                var argv = require('minimist')(process.argv.slice(4));

                     if (argv.organization  === undefined) { console.error("Parameter --organization is missing." ); }
                else if (argv.principalName === undefined) { console.error("Parameter --principalName is missing."); }
                else {
                    devops_identity_show.resolve(argv.organization, argv.principalName, ['User']);
                }
            }
            else if (args[3]?.toLowerCase() === "group") {
                var argv = require('minimist')(process.argv.slice(4));

                     if (argv.organization  === undefined) { console.error("Parameter --organization is missing." ); }
                else if (argv.principalName === undefined) { console.error("Parameter --principalName is missing."); }
                else {
                    devops_identity_show.resolve(argv.organization, argv.principalName, ['Group']);
                }
            }
            else{
                var argv = require('minimist')(process.argv.slice(3));

                     if (argv.organization  === undefined) { console.error("Parameter --organization is missing." ); }
                else if (argv.principalName === undefined) { console.error("Parameter --principalName is missing."); }
                else {
                    devops_identity_show.resolve(argv.organization, argv.principalName, ['User', 'Group']);
                }
            }
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

const checkSubscriptionId = (subscriptionId : string | undefined) => {
    if (subscriptionId === undefined || subscriptionId === '') { throw new Error("Parameter --subscription is missing."); }
}