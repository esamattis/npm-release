import * as core from "@actions/core";
import { wait } from "./wait";
import { exec } from "@actions/exec";

async function run() {
    const ms = core.getInput("milliseconds");
    console.log(`Waiting ${ms} milliseconds ...`);

    core.debug(new Date().toTimeString());
    await wait(parseInt(ms));
    core.debug(new Date().toTimeString());

    console.log("Logging stuff?");

    await exec("npm ci");
    await exec("npm test");

    core.setOutput("time", new Date().toTimeString());
}

run().catch(error => {
    console.log("Action failed", error);
    core.setFailed(error.message);
});
