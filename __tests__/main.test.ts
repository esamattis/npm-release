import { wait } from "../src/wait";
import * as process from "process";
import * as cp from "child_process";
import * as path from "path";

test("throws invalid number", async () => {
    await expect(wait("foo")).rejects.toThrow("milleseconds not a number");
});

test("wait 500 ms", async () => {
    const start = new Date();
    await wait(500);
    const end = new Date();
    var delta = Math.abs(end.getTime() - start.getTime());
    expect(delta).toBeGreaterThan(450);
});
