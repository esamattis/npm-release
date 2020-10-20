import { promises as fs } from "fs";
import PathUtils from "path";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import { execSync } from "child_process";

const gitRev = execSync("git rev-parse HEAD").toString();

async function setPrereleaseVersion() {
    const packageFile = "./package.json";
    const pkg = JSON.parse((await fs.readFile(packageFile)).toString());

    if (pkg.version.includes("-dev.")) {
        console.log("Prerelease version already set");
        process.exit(1);
    }

    pkg.version = `${pkg.version}-dev.${gitRev.slice(0, 9)}`;

    await fs.writeFile(packageFile, JSON.stringify(pkg, null, "    "));
    console.log("Prerelease version: " + pkg.version);
}

async function exportReleaseVersion() {
    const packageFile = "./package.json";
    const pkg = JSON.parse((await fs.readFile(packageFile)).toString());
    core.exportVariable("NPM_PACKAGE_NAME", pkg.name);
    core.exportVariable("NPM_RELEASE_VERSION", pkg.version);
}

async function isDir(path: string): Promise<boolean> {
    return fs.stat(path).then(
        (s) => s.isDirectory(),
        () => false,
    );
}

async function isFile(path: string): Promise<boolean> {
    return fs.stat(path).then(
        (s) => s.isFile(),
        () => false,
    );
}

async function run() {
    const dir = core.getInput("dir");
    if (dir) {
        process.chdir(dir);
    }

    const tag = core.getInput("tag") || "next";

    if (!/[a-z]+/.test(tag)) {
        core.setFailed(`Invalid tag format "${tag}". Only a-z characters.`);
        return;
    }

    const type: "stable" | "prerelease" = core.getInput("type") as any;

    if (!["stable", "prerelease"].includes(type)) {
        core.setFailed(
            "You must set the 'type' input to 'stable' or 'prerelease'",
        );
        return;
    }

    const npmToken = core.getInput("token");

    if (!npmToken) {
        core.setFailed("'token' input not set");
        return;
    }

    await fs.writeFile(
        PathUtils.join(process.env.HOME || "~", ".npmrc"),
        `//registry.npmjs.org/:_authToken=${npmToken}`,
    );

    await exec("npm whoami");

    /* check if the deps where installed in a previous step */
    const isInstalled = await isDir("node_modules");

    if (!isInstalled) {
        if (await isFile("package-lock.json")) {
            await exec("npm ci");
        } else {
            await exec("npm install");
        }
    }

    if (type === "prerelease") {
        await setPrereleaseVersion();
        await exec(`npm publish --tag ${tag}`);
    } else {
        await exec("npm publish");
    }

    core.exportVariable("NPM_RELEASE_TAG", tag);
    await exportReleaseVersion();
}

run().catch((error) => {
    console.log("Action failed", error);
    core.setFailed(error.message);
});
