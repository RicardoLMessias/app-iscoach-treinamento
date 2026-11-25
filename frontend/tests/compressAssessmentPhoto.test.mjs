import test from "node:test";
import assert from "node:assert/strict";
import { compressAssessmentPhoto } from "../src/shared/compressAssessmentPhoto.js";

test("reduz dimensões, tenta qualidades limitadas e libera recursos", async () => {
  const originalImage = globalThis.Image, originalDocument = globalThis.document;
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL;
  const qualities = [], revoked = [];
  let dimensions;
  const canvas = { width:0,height:0,getContext:() => ({drawImage:() => { dimensions = [canvas.width,canvas.height]; }}),toBlob(callback,type,quality) { qualities.push(quality); callback(new Blob([new Uint8Array(quality > .74 ? 700*1024 : 400*1024)],{type})); } };
  globalThis.Image = class { naturalWidth=4000;naturalHeight=3000;async decode() {} };
  globalThis.document = { createElement:() => canvas };
  URL.createObjectURL = () => "blob:test";
  URL.revokeObjectURL = (url) => revoked.push(url);
  try {
    const result = await compressAssessmentPhoto({name:"photo.JPG",type:"image/jpeg",size:10*1024*1024});
    assert.deepEqual(dimensions,[1600,1200]);
    assert.deepEqual(qualities,[.86,.8,.74]);
    assert.equal(result.blob.size,400*1024);
    assert.equal(result.blob.type,"image/jpeg");
    assert.deepEqual(revoked,["blob:test"]);
    assert.equal(canvas.width,0);
  } finally {
    globalThis.Image=originalImage;globalThis.document=originalDocument;
    URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;
  }
});
test("recusa formatos não aprovados e originais maiores que 16 MB", async () => {
  await assert.rejects(compressAssessmentPhoto({name:"photo.svg",type:"image/svg+xml",size:100}),/JPG/);
  await assert.rejects(compressAssessmentPhoto({name:"photo.jpg",type:"image/jpeg",size:17*1024*1024}),/16 MB/);
});

