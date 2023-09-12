require("dotenv").config();
const crypto = require("crypto");

const cryptoKey = process.env.CRYPTO_KEY;
const cryptoAlgo = "aes256";

function encrypt(data, iv = null) {
    if (!iv) {
        iv = crypto.randomBytes(16);
    }
    // console.log(data);
    const cipher = crypto.createCipheriv(cryptoAlgo, cryptoKey, iv);
    const encryptedData = Buffer.concat([
        cipher.update(data, "utf-8"),
        cipher.final(),
    ]);

    return [encryptedData.toString("hex"), iv];

}

function decrypt(data, iv) {
    const decipher = crypto.createDecipheriv(cryptoAlgo, cryptoKey, iv);
    const decryptedData = Buffer.concat([
        decipher.update(Buffer.from(data, "hex")),
        decipher.final(),
    ]);
    return decryptedData.toString("utf-8");
}

module.exports = {
    encrypt,
    decrypt,
};