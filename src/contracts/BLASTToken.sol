// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BLASTToken {
    string public name = "BLAST Network";
    string public symbol = "BLAST";
    uint8 public decimals = 18;
    uint256 public totalSupply = 42000000 * 10**18;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    address public owner;
    address[] public miners;
    uint256 public miningReward = 50 * 10**18;
    uint256 public halvingInterval = 210000;
    uint256 public currentBlock = 0;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mined(address indexed miner, uint256 reward, uint256 blockNumber);
    
    constructor() {
        owner = msg.sender;
        balanceOf[owner] = 21000000 * 10**18;
        balanceOf[address(this)] = 21000000 * 10**18;
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Allowance exceeded");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    function mineBlock() public returns (bool) {
        uint256 era = currentBlock / halvingInterval;
        uint256 reward = miningReward / (2**era);
        
        require(balanceOf[address(this)] >= reward, "No more tokens for mining");
        
        balanceOf[address(this)] -= reward;
        balanceOf[msg.sender] += reward;
        currentBlock++;
        
        emit Mined(msg.sender, reward, currentBlock);
        return true;
    }
    
    function getBlockReward() public view returns (uint256) {
        uint256 era = currentBlock / halvingInterval;
        return miningReward / (2**era);
    }
    
    function burn(uint256 amount) public {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
    
    function mint(address to, uint256 amount) public {
        require(msg.sender == owner, "Only owner can mint");
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
}
