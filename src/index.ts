#! /usr/bin/env node

import { rbac_export } from "./CommandHandler/rbac_export";
import { rbac_verify } from "./CommandHandler/rbac_verify";

const args = process.argv.slice(2)

if (args[0]?.toLowerCase() === "rbac") {
    if (args[1]?.toLowerCase() === "export") {
        var argv = require('minimist')(process.argv.slice(2));

             if (argv.subscription === undefined) { console.error("Parameter --subscription is missing."); }
        else if (argv.pathOut      === undefined) { console.error("Parameter --path is missing."        ); }
        else {
            const subscriptionId: string = argv.subscription;
            const pathForFiles: string = argv.pathOut;

            rbac_export.handle(subscriptionId, pathForFiles);
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
    else {
        console.error("rbac - Unknown command");
    }
}
else {
    console.error("Unknown command");
}