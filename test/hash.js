const { expect } = require("chai"),
  fs = require("fs"),
  { createHash } = require("crypto"),
  Documento = require("../classes/Documento");

describe("functions in ../functions/hash.js", function() {
  it("create() should use Node.Crypto to create a SHA256 hash from inputFile", function() {
    let fileBuffer = fs.readFileSync("./README.md");
    let hash1 =
      "0x" +
      createHash("sha256")
        .update(fileBuffer)
        .digest("hex");

    let hash2 = new Documento({ buffer: fileBuffer }).createHash();

    expect(hash2.fileHash).to.equal(hash1);
    expect(hash2.fileHash).to.have.lengthOf(66);
    expect(hash2.fileHash).to.be.a("string");
  });
  /* it("uploadToS3() should upload a file to AWS S3 and return data", async function() {
    let fileBuffer = fs.readFileSync("./README.md");

    let data = await uploadToS3(fileBuffer, "README.md");

    expect(data).to.be.an("object");
  }); */
});