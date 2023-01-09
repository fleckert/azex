#! /usr/bin/env node

import { rbac_apply } from "./CommandHandler/rbac_apply";
import { rbac_export } from "./CommandHandler/rbac_export";
import { rbac_extend } from "./CommandHandler/rbac_extend";
import { rbac_verify } from "./CommandHandler/rbac_verify";
import { SubscriptionResolver } from "./SubscriptionResolver";

const args = process.argv.slice(2)

if (args[0]?.toLowerCase() === "rbac") {
    if (args[1]?.toLowerCase() === "export") {
        var argv = require('minimist')(process.argv.slice(2));

        if (argv.pathOut === undefined) { console.error("Parameter --path is missing."); }
        else {
            const pathForFiles: string = argv.pathOut;
                if (argv.subscription === undefined) {
                    new SubscriptionResolver().getSubscriptionId()
                    .then(subscriptionId =>{
                        if (subscriptionId === undefined) {
                            throw new Error("Parameter --subscription is missing.");
                        }
                        else {
                            rbac_export.handle(subscriptionId, pathForFiles);
                        };
                    })
                }
                else {
                    rbac_export.handle(argv.subscription, pathForFiles);
                }
        }
    }
    else if (args[1]?.toLowerCase() === "verify")
    {
        var argv = require('minimist')(process.argv.slice(2));

             if (argv.subscription === undefined) { console.error("Parameter --subscription is missing."); }
        else if (argv.pathIn       === undefined) { console.error("Parameter --pathIn is missing."      ); }
        else if (argv.pathOut      === undefined) { console.error("Parameter --pathOut is missing."     ); }
        else {
            const subscriptionId: string = argv.subscription;
            const pathIn        : string = argv.pathIn      ;
            const pathOut       : string = argv.pathOut     ;

            rbac_verify.handle(subscriptionId, pathIn, pathOut);
        }
    }
    else if (args[1]?.toLowerCase() === "extend")
    {
        var argv = require('minimist')(process.argv.slice(2));

             if (argv.subscription === undefined) { console.error("Parameter --subscription is missing."); }
        else if (argv.pathIn       === undefined) { console.error("Parameter --pathIn is missing."      ); }
        else if (argv.pathOut      === undefined) { console.error("Parameter --pathOut is missing."     ); }
        else {
            const subscriptionId: string = argv.subscription;
            const pathIn        : string = argv.pathIn      ;
            const pathOut       : string = argv.pathOut     ;

            rbac_extend.handle(subscriptionId, pathIn, pathOut);
        }
    }
    else if (args[1]?.toLowerCase() === "apply")
    {
        var argv = require('minimist')(process.argv.slice(2));

             if (argv.subscription === undefined) { console.error("Parameter --subscription is missing."); }
        else if (argv.path         === undefined) { console.error("Parameter --path is missing."        ); }
        else {
            const subscriptionId: string = argv.subscription;
            const path          : string = argv.path        ;

            rbac_apply.handle(subscriptionId, path);
        }
    }
    else {
        console.error("rbac - Unknown command");
    }
}
else {
    console.error("Unknown command");
}