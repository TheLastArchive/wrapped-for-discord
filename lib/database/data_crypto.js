require("dotenv").config();
const crypto = require("crypto");

const crypto_key = process.env.CRYPTO_KEY;
const crypto_algo = "aes256";

function encrypt(data, iv = null) {
    let return_iv = false;
    if (!iv) {
        iv = crypto.randomBytes(16);
        return_iv = true;
    }
    const cipher = crypto.createCipheriv(crypto_algo, crypto_key, iv);
    const encrypted_data = Buffer.concat([
        cipher.update(data, "utf-8"),
        cipher.final(),
    ]);

    if (return_iv) {
        return [encrypted_data.toString("hex"), iv];
    }
    return encrypted_data.toString("hex");
}

function decrypt(data, iv) {
    const decipher = crypto.createDecipheriv(crypto_algo, crypto_key, iv);
    const decrypted_data = Buffer.concat([
        decipher.update(Buffer.from(data, "hex")),
        decipher.final(),
    ]);
    return decrypted_data.toString("utf-8");
}

module.exports = {
    encrypt,
    decrypt,
};