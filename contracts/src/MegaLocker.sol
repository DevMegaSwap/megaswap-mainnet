// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Locker {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract MegaLocker {
    struct Lock {
        uint256 id;
        address lpToken;
        address owner;
        uint256 amount;
        uint256 lockDate;
        uint256 unlockDate;
        bool withdrawn;
    }

    uint256 public nextLockId = 1;
    uint256 public lockFee = 0.05 ether;
    address public feeReceiver;

    mapping(uint256 => Lock) public locks;
    mapping(address => uint256[]) public lpTokenLocks;
    mapping(address => uint256[]) public userLocks;

    event LPLocked(uint256 indexed lockId, address indexed lpToken, address indexed owner, uint256 amount, uint256 unlockDate);
    event LPWithdrawn(uint256 indexed lockId, address indexed lpToken, address indexed owner, uint256 amount);

    constructor() {
        feeReceiver = msg.sender;
    }

    function lockLPToken(address lpToken, uint256 amount, uint256 unlockDate) external payable returns (uint256) {
        require(msg.value >= lockFee, "Insufficient fee");
        require(amount > 0, "Amount must be greater than 0");
        require(unlockDate > block.timestamp, "Unlock date must be in the future");

        require(IERC20Locker(lpToken).transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 lockId = nextLockId++;
        
        locks[lockId] = Lock({
            id: lockId,
            lpToken: lpToken,
            owner: msg.sender,
            amount: amount,
            lockDate: block.timestamp,
            unlockDate: unlockDate,
            withdrawn: false
        });

        lpTokenLocks[lpToken].push(lockId);
        userLocks[msg.sender].push(lockId);

        payable(feeReceiver).transfer(msg.value);

        emit LPLocked(lockId, lpToken, msg.sender, amount, unlockDate);
        return lockId;
    }

    function withdrawLPToken(uint256 lockId) external {
        Lock storage lock = locks[lockId];
        require(lock.owner == msg.sender, "Not lock owner");
        require(!lock.withdrawn, "Already withdrawn");
        require(block.timestamp >= lock.unlockDate, "Lock period not ended");

        lock.withdrawn = true;
        require(IERC20Locker(lock.lpToken).transfer(msg.sender, lock.amount), "Transfer failed");

        emit LPWithdrawn(lockId, lock.lpToken, msg.sender, lock.amount);
    }

    function getLocksByLPToken(address lpToken) external view returns (uint256[] memory) {
        return lpTokenLocks[lpToken];
    }

    function getLocksByUser(address user) external view returns (uint256[] memory) {
        return userLocks[user];
    }

    function setLockFee(uint256 newFee) external {
        require(msg.sender == feeReceiver, "Only fee receiver");
        lockFee = newFee;
    }

    function setFeeReceiver(address newReceiver) external {
        require(msg.sender == feeReceiver, "Only fee receiver");
        feeReceiver = newReceiver;
    }
}
