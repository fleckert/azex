#! /usr/bin/env node

import { rbac_apply } from "./CommandHandler/rbac_apply";
import { rbac_export } from "./CommandHandler/rbac_export";
import { rbac_extend } from "./CommandHandler/rbac_extend";
import { rbac_verify } from "./CommandHandler/rbac_verify";
import { SubscriptionIdResolver } from "./SubscriptionIdResolver";

const args = process.argv.slice(2)

if (args[0]?.toLowerCase() === "rbac") {
    if (args[1]?.toLowerCase() === "export") {
        var argv = require('minimist')(process.argv.slice(2));
  
        new SubscriptionIdResolver().getSubscriptionId(argv.subscription)
        .then(subscriptionId =>{
            if (subscriptionId === undefined) { throw new Error("Parameter --subscription is missing."); }

            rbac_export.handle(subscriptionId, argv.out ?? 'azex-rbac-export');
        })
        .catch(console.error);
    }
    else if (args[1]?.toLowerCase() === "verify")
    {
        var argv = require('minimist')(process.argv.slice(2));

        if (argv.path === undefined) { console.error("Parameter --path is missing."); }
        else {
            new SubscriptionIdResolver().getSubscriptionId(argv.subscription)
            .then(subscriptionId =>{
                if (subscriptionId === undefined) {    throw new Error("Parameter --subscription is missing.");}
                rbac_verify.handle(subscriptionId, argv.path, argv.out ?? 'azex-rbac-verify');         
            })
            .catch(console.error);
        }
    }
    else if (args[1]?.toLowerCase() === "extend")
    {
        var argv = require('minimist')(process.argv.slice(2));

        if (argv.path === undefined) { console.error("Parameter --path is missing."); }
        else {
            new SubscriptionIdResolver().getSubscriptionId(argv.subscription)
            .then(subscriptionId => {
                if (subscriptionId === undefined) { throw new Error("Parameter --subscription is missing."); }
                rbac_extend.handle(subscriptionId, argv.path, argv.out ?? 'azex-rbac-extend');
            })
            .catch(console.error);
        }
    }
    else if (args[1]?.toLowerCase() === "apply")
    {
        var argv = require('minimist')(process.argv.slice(2));

        if (argv.path === undefined) { console.error("Parameter --path is missing."); }
        else {
            new SubscriptionIdResolver().getSubscriptionId(argv.subscription)
            .then(subscriptionId => {
                if (subscriptionId === undefined) { throw new Error("Parameter --subscription is missing."); }
                rbac_apply.handle(subscriptionId, argv.path);
            })
            .catch(console.error);
        }
    }
    else {
        console.error("rbac - Unknown command");
    }
}
else {
    console.error("Unknown command");
}