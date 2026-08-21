import assert from "node:assert/strict";
import { readFocusQuery, withFocusQuery } from "../focus-arrival";

assert.equal(withFocusQuery("/fiqh/books/taharah/lessons/x", "المياه"), "/fiqh/books/taharah/lessons/x?focus=%D8%A7%D9%84%D9%85%D9%8A%D8%A7%D9%87");
assert.equal(withFocusQuery("/lessons/a?id=1", "صلاة"), "/lessons/a?id=1&focus=%D8%B5%D9%84%D8%A7%D8%A9");
assert.equal(withFocusQuery("/mushaf/page/2?ayah=1:1", "الحمد"), "/mushaf/page/2?ayah=1:1");
assert.equal(withFocusQuery("/fiqh", ""), "/fiqh");
assert.equal(readFocusQuery("?q=1&focus=الصلاة"), "الصلاة");
assert.equal(readFocusQuery(""), "");

console.log("focus-arrival.test.ts: ok");
