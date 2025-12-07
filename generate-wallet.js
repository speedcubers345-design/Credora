import { ethers } from "ethers";
import fs from "fs";

const wallet = ethers.Wallet.createRandom();
console.log("Generated Wallet:");
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);

const envContent = `PRIVATE_KEY="${wallet.privateKey}"\nNEXT_PUBLIC_ADMIN_ADDRESS="${wallet.address}"\n`;
fs.writeFileSync(".env", envContent);
console.log(".env file created with PRIVATE_KEY");
