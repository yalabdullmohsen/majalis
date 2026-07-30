import assert from "node:assert/strict";
import { toAppPath, assertAppNavigationHref, absoluteUrl, SITE_URL } from "../site-config";

assert.equal(toAppPath("/lessons/abc"), "/lessons/abc");
assert.equal(toAppPath("https://www.majlisilm.com/lessons/abc"), "/lessons/abc");
assert.equal(toAppPath("https://majlisilm.com/knowledge-graph"), "/knowledge-graph");
assert.equal(toAppPath("https://evil.example/lessons/x"), null);
assert.equal(toAppPath("../etc/passwd"), null);

assert.throws(() => assertAppNavigationHref("https://www.majlisilm.com/lessons/x"), /cross_origin/);
assert.throws(() => assertAppNavigationHref("lessons/x"), /non_path/);
assertAppNavigationHref("/lessons/x");

assert.ok(absoluteUrl("/knowledge-graph").startsWith(SITE_URL));
assert.doesNotMatch(absoluteUrl("/knowledge-graph"), /www\.majlisilm\.com/);

console.log("to-app-path: ok");
