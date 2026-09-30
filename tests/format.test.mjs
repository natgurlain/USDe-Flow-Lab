import test from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "./helpers.mjs";
const format=loadModule("format");
test("compact currency explicitly suppresses optional zeros for SSR/client consistency",()=>{
 assert.equal(format.formatMoney(62101724.86277284),"$62.1M");
 assert.equal(format.formatMoney(1000000),"$1M");
 assert.equal(format.formatMoney(1126700.19881),"$1.13M");
});
