import hre from "hardhat";
const { ethers } = hre;

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy FBTC
    const FBTC = await ethers.getContractFactory("FBTC");
    const fbtc = await FBTC.deploy();
    await fbtc.waitForDeployment();
    const fbtcAddress = await fbtc.getAddress();
    console.log(`FBTC deployed to: ${fbtcAddress}`);

    // 2. Deploy FTSO
    const FTSO = await ethers.getContractFactory("FTSO");
    // Initial BTC Price $50,000
    // The contract uses simple integers.
    const ftso = await FTSO.deploy(50000);
    await ftso.waitForDeployment();
    const ftsoAddress = await ftso.getAddress();
    console.log(`FTSO deployed to: ${ftsoAddress}`);

    // 3. Deploy DIDRegistry
    const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    const didRegistry = await DIDRegistry.deploy();
    await didRegistry.waitForDeployment();
    const didRegistryAddress = await didRegistry.getAddress();
    console.log("DIDRegistry deployed to:", didRegistryAddress);

    // 4. Deploy MicroLender
    const MicroLender = await ethers.getContractFactory("MicroLender");
    const microLender = await MicroLender.deploy(
        fbtcAddress,
        ftsoAddress,
        didRegistryAddress
    );
    await microLender.waitForDeployment();
    const microLenderAddress = await microLender.getAddress();
    console.log("MicroLender deployed to:", microLenderAddress);

    // 5. Deploy RedFlagNFT
    const RedFlagNFT = await ethers.getContractFactory("RedFlagNFT");
    const redFlagNFT = await RedFlagNFT.deploy(deployer.address);
    await redFlagNFT.waitForDeployment();
    const redFlagNFTAddress = await redFlagNFT.getAddress();
    console.log("RedFlagNFT deployed to:", redFlagNFTAddress);

    // Fund MicroLender with C2FLR
    await deployer.sendTransaction({
        to: microLenderAddress,
        value: ethers.parseEther("10.0"), // Fund with 10 C2FLR
    });
    console.log("MicroLender funded with 10 C2FLR");

    console.log("\n--- Deployment Complete ---");
    console.log("NEXT_PUBLIC_MOCK_FBTC_ADDRESS=" + fbtcAddress);
    console.log("NEXT_PUBLIC_MOCK_FTSO_ADDRESS=" + ftsoAddress);
    console.log("NEXT_PUBLIC_DID_REGISTRY_ADDRESS=" + didRegistryAddress);
    console.log("NEXT_PUBLIC_MICRO_LENDER_ADDRESS=" + microLenderAddress);
    console.log("NEXT_PUBLIC_RED_FLAG_NFT_ADDRESS=" + redFlagNFTAddress);
    console.log("NEXT_PUBLIC_ADMIN_ADDRESS=" + deployer.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
