// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/UniswapV2Factory.sol";
import "../src/UniswapV2Router02.sol";
import "../src/MegaLocker.sol";

contract DeployMainnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        address WETH = 0x420DD381b31aEf6683db6B902084cB0FFECe40Da;
        
        vm.startBroadcast(deployerPrivateKey);
        
        UniswapV2Factory factory = new UniswapV2Factory(deployer);
        console.log("Factory deployed:", address(factory));
        
        bytes32 initCodeHash = factory.INIT_CODE_HASH();
        console.log("Init Code Hash:");
        console.logBytes32(initCodeHash);
        
        UniswapV2Router02 router = new UniswapV2Router02(
            address(factory),
            WETH,
            initCodeHash
        );
        console.log("Router deployed:", address(router));
        
        MegaLocker locker = new MegaLocker();
        console.log("Locker deployed:", address(locker));
        
        vm.stopBroadcast();
        
        console.log("\n=== MAINNET DEPLOYMENT COMPLETE ===");
        console.log("WETH (existing):", WETH);
        console.log("Factory:", address(factory));
        console.log("Router:", address(router));
        console.log("Locker:", address(locker));
        console.log("\nSave these addresses for frontend!");
    }
}
