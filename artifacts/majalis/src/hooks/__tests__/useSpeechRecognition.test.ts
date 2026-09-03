import assert from "node:assert/strict";
import { isWebSpeechRecognitionSupported } from "../useSpeechRecognition";

// في بيئة Node لا يوجد window.SpeechRecognition
assert.equal(isWebSpeechRecognitionSupported(), false);

console.log("useSpeechRecognition: ok");
