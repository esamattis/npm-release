import { promises as fs } from "fs";
import semver from "semver";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import { execSync } from "child_process";

async function run() {
    const tag = core.getInput("tag");
    const type = core.getInput("type");

    if (!["stable", "prerelease"].includes(type)) {
        core.setFailed("unknown release type " + type);
        return;
    }

    const npmToken = core.getInput("token");

    if (!npmToken) {
        core.setFailed("NPM_TOKEN input not set");
        return;
    }

    await exec(
        `echo "//registry.npmjs.org/:_authToken=${npmToken}" > $HOME/.npmrc`,
    );

    await exec("npm whoami");

    const packageFile = "./package.json";
    const pkg = JSON.parse((await fs.readFile(packageFile)).toString());

    const gitRev = execSync("git rev-parse HEAD")
        .toString()
        .slice(0, 8);

    if (pkg.version.includes("-dev.")) {
        console.log("Prerelease version already set");
        process.exit(1);
    }

    pkg.version = `${semver.inc(
        pkg.version,
        "patch",
    )}-dev.${Date.now()}.${gitRev}`;

    await fs.writeFile(packageFile, JSON.stringify(pkg, null, "    "));
    console.log("Prerelease version: " + pkg.version);

    await exec("npm ci");
    await exec("npm test");
    core.setOutput("time", new Date().toTimeString());
}

run().catch(error => {
    console.log("Action failed", error);
    core.setFailed(error.message);
});
