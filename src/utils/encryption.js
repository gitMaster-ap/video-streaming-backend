import crypto from "crypto";

// Encryption function

export function encrypt(buffer, password, salt) {
  //   const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  // Convert buffer to Buffer instance
  const bufferInstance = Buffer.from(buffer);

  let encrypted = cipher.update(bufferInstance);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString("hex"), encryptedData: encrypted.toString("hex") };
}

// Decryption function
export function decrypt(encryptedData, password, salt, iv) {
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    key,
    Buffer.from(iv, "hex")
  );

  let decrypted = decipher.update(Buffer.from(encryptedData, "hex"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}

export const removeEncryption = (filename) => {
  // Remove 'encrypted_' from the start of the string
  filename = filename.replace(/^encrypted_/, "");

  // Remove the last part of the string after the last '-'
  filename = filename.replace(/-[^-]+$/, "");

  return filename;
};
