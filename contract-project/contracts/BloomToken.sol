// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BloomToken
 * @notice ERC-20 token for BloomSocial platform
 * @dev Used for content creation and liking
 */
contract BloomToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10 ** 18; // 1 billion tokens

    constructor() ERC20("BloomToken", "BLOOM") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @notice Mint tokens (only for testnet)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function for testnet
     * @dev Anyone can claim 1000 tokens once per day
     */
    mapping(address => uint256) public lastFaucetClaim;
    uint256 public constant FAUCET_AMOUNT = 1000 * 10 ** 18;
    uint256 public constant FAUCET_COOLDOWN = 1 days;

    function faucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "BloomToken: Faucet cooldown not elapsed"
        );
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}
