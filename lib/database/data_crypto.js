require("dotenv").config();
const crypto = require("crypto");

const crypto_key = process.env.CRYPTO_KEY;
const crypto_algo = "aes256";

function encrypt(data, iv = null) {
    let return_iv = false;
    if (!iv) {
        iv = crypto.randomBytes(16);
        return_iv = true
    }
    const cipher = crypto.createCipheriv(crypto_algo, crypto_key, iv);
    const encrypted_data =
        cipher.update(data, "utf8", "hex") + cipher.final("hex");

    if (return_iv) { 
    return [encrypted_data, iv];    
    }
    return encrypted_data
}

function decrypt(data, iv) {
    const decipher = crypto.createDecipheriv(crypto_algo, crypto_key, iv);
    const decrypted_data =
        decipher.update(data, "hex", "utf8") + decipher.final("utf8");
    
    return decrypted_data;
}

module.exports = {
    encrypt,
    decrypt
}