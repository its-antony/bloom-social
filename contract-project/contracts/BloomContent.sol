// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./WeightLib.sol";

/**
 * @title BloomContent
 * @notice Core contract for BloomSocial platform
 * @dev Implements content creation, liking, and reward distribution
 *
 * Economic Model:
 * - Author: 70% of likes received
 * - Likers: 25% distributed by weight (early likers get more)
 * - Protocol: 5% fee
 *
 * Weight Function: w(i) = 0.2 + 0.8 × exp(-0.20 × (i-1))
 * where i is the like position (1-indexed)
 */
contract BloomContent is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using WeightLib for uint256;

    // ============ Constants ============

    uint256 private constant BPS_DENOMINATOR = 10000;
    uint256 public constant AUTHOR_BPS = 7000;    // 70%
    uint256 public constant LIKER_BPS = 2500;     // 25%
    uint256 public constant PROTOCOL_BPS = 500;   // 5%
    uint256 private constant PRECISION = 1e18;

    // ============ State Variables ============

    IERC20 public immutable bloomToken;
    address public protocolFeeRecipient;
    uint256 public protocolFeeAccumulated;

    uint256 public nextContentId;

    struct Content {
        address author;
        uint256 likeAmount;
        uint256 deadline;
        uint256 authorPool;
        uint256 likerRewardPool;
        uint256 totalWeight;
        uint256 likeCount;
        string contentURI;
        bytes32 contentHash;
        bool authorClaimed;
    }

    struct LikeInfo {
        uint256 likeIndex;
        uint256 weight;
        bool claimed;
    }

    mapping(uint256 => Content) public contents;
    mapping(uint256 => mapping(address => LikeInfo)) public likes;
    mapping(address => mapping(address => bool)) public isFollowing;

    // ============ Events ============

    event ContentCreated(
        uint256 indexed contentId,
        address indexed author,
        uint256 likeAmount,
        uint256 deadline,
        string contentURI,
        bytes32 contentHash
    );

    event Liked(
        uint256 indexed contentId,
        address indexed liker,
        uint256 likeIndex,
        uint256 weight,
        uint256 amount
    );

    event AuthorRewardClaimed(
        uint256 indexed contentId,
        address indexed author,
        uint256 amount
    );

    event LikerRewardClaimed(
        uint256 indexed contentId,
        address indexed liker,
        uint256 amount
    );

    event Followed(address indexed follower, address indexed followee);
    event Unfollowed(address indexed follower, address indexed followee);
    event ProtocolFeeWithdrawn(address indexed recipient, uint256 amount);

    // ============ Errors ============

    error InvalidLikeAmount();
    error InvalidDuration();
    error ContentNotFound();
    error ContentExpired();
    error ContentNotExpired();
    error AlreadyLiked();
    error NotLiked();
    error AlreadyClaimed();
    error NotAuthor();
    error CannotFollowSelf();
    error AlreadyFollowing();
    error NotFollowing();

    // ============ Constructor ============

    constructor(address _bloomToken, address _protocolFeeRecipient) {
        bloomToken = IERC20(_bloomToken);
        protocolFeeRecipient = _protocolFeeRecipient;
    }

    // ============ Content Functions ============

    /**
     * @notice Create new content
     * @param likeAmount Amount of tokens required per like
     * @param duration Duration in seconds until deadline
     * @param contentURI IPFS URI of the content
     * @param contentHash Hash of the content for verification
     * @return contentId The ID of the created content
     */
    function createContent(
        uint256 likeAmount,
        uint256 duration,
        string calldata contentURI,
        bytes32 contentHash
    ) external returns (uint256 contentId) {
        if (likeAmount == 0) revert InvalidLikeAmount();
        if (duration == 0) revert InvalidDuration();

        contentId = nextContentId++;

        contents[contentId] = Content({
            author: msg.sender,
            likeAmount: likeAmount,
            deadline: block.timestamp + duration,
            authorPool: 0,
            likerRewardPool: 0,
            totalWeight: 0,
            likeCount: 0,
            contentURI: contentURI,
            contentHash: contentHash,
            authorClaimed: false
        });

        emit ContentCreated(
            contentId,
            msg.sender,
            likeAmount,
            block.timestamp + duration,
            contentURI,
            contentHash
        );
    }

    /**
     * @notice Like content and distribute tokens
     * @param contentId The content to like
     */
    function like(uint256 contentId) external nonReentrant {
        Content storage content = contents[contentId];
        if (content.author == address(0)) revert ContentNotFound();
        if (block.timestamp >= content.deadline) revert ContentExpired();
        if (likes[contentId][msg.sender].likeIndex != 0) revert AlreadyLiked();

        uint256 amount = content.likeAmount;

        // Transfer tokens from liker
        bloomToken.safeTransferFrom(msg.sender, address(this), amount);

        // Calculate distributions
        uint256 authorAmount = (amount * AUTHOR_BPS) / BPS_DENOMINATOR;
        uint256 likerAmount = (amount * LIKER_BPS) / BPS_DENOMINATOR;
        uint256 protocolAmount = amount - authorAmount - likerAmount;

        // Update pools
        content.authorPool += authorAmount;
        content.likerRewardPool += likerAmount;
        protocolFeeAccumulated += protocolAmount;

        // Calculate weight for this liker
        content.likeCount++;
        uint256 weight = WeightLib.calculateWeight(content.likeCount);
        content.totalWeight += weight;

        // Record the like
        likes[contentId][msg.sender] = LikeInfo({
            likeIndex: content.likeCount,
            weight: weight,
            claimed: false
        });

        emit Liked(contentId, msg.sender, content.likeCount, weight, amount);
    }

    // ============ Claim Functions ============

    /**
     * @notice Author claims their reward after deadline
     * @param contentId The content to claim reward from
     */
    function claimAuthorReward(uint256 contentId) external nonReentrant {
        Content storage content = contents[contentId];
        if (content.author == address(0)) revert ContentNotFound();
        if (content.author != msg.sender) revert NotAuthor();
        if (block.timestamp < content.deadline) revert ContentNotExpired();
        if (content.authorClaimed) revert AlreadyClaimed();

        uint256 amount = content.authorPool;
        content.authorClaimed = true;

        if (amount > 0) {
            bloomToken.safeTransfer(msg.sender, amount);
        }

        emit AuthorRewardClaimed(contentId, msg.sender, amount);
    }

    /**
     * @notice Liker claims their share of the reward pool after deadline
     * @param contentId The content to claim reward from
     */
    function claimLikerReward(uint256 contentId) external nonReentrant {
        Content storage content = contents[contentId];
        if (content.author == address(0)) revert ContentNotFound();
        if (block.timestamp < content.deadline) revert ContentNotExpired();

        LikeInfo storage likeInfo = likes[contentId][msg.sender];
        if (likeInfo.likeIndex == 0) revert NotLiked();
        if (likeInfo.claimed) revert AlreadyClaimed();

        likeInfo.claimed = true;

        // Calculate reward: (weight / totalWeight) * likerRewardPool
        uint256 amount = 0;
        if (content.totalWeight > 0) {
            amount = (likeInfo.weight * content.likerRewardPool) / content.totalWeight;
        }

        if (amount > 0) {
            bloomToken.safeTransfer(msg.sender, amount);
        }

        emit LikerRewardClaimed(contentId, msg.sender, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get estimated reward for a liker
     * @param contentId The content ID
     * @param liker The liker's address
     * @return estimatedReward The estimated reward amount
     */
    function getEstimatedReward(
        uint256 contentId,
        address liker
    ) external view returns (uint256 estimatedReward) {
        Content storage content = contents[contentId];
        LikeInfo storage likeInfo = likes[contentId][liker];

        if (likeInfo.likeIndex == 0 || content.totalWeight == 0) {
            return 0;
        }

        return (likeInfo.weight * content.likerRewardPool) / content.totalWeight;
    }

    /**
     * @notice Get content details
     * @param contentId The content ID
     */
    function getContent(uint256 contentId) external view returns (
        address author,
        uint256 likeAmount,
        uint256 deadline,
        uint256 authorPool,
        uint256 likerRewardPool,
        uint256 totalWeight,
        uint256 likeCount,
        string memory contentURI,
        bytes32 contentHash,
        bool authorClaimed
    ) {
        Content storage content = contents[contentId];
        return (
            content.author,
            content.likeAmount,
            content.deadline,
            content.authorPool,
            content.likerRewardPool,
            content.totalWeight,
            content.likeCount,
            content.contentURI,
            content.contentHash,
            content.authorClaimed
        );
    }

    /**
     * @notice Get like info for a user on a content
     * @param contentId The content ID
     * @param liker The liker's address
     */
    function getLikeInfo(
        uint256 contentId,
        address liker
    ) external view returns (uint256 likeIndex, uint256 weight, bool claimed) {
        LikeInfo storage info = likes[contentId][liker];
        return (info.likeIndex, info.weight, info.claimed);
    }

    // ============ Follow Functions ============

    /**
     * @notice Follow another user
     * @param followee The address to follow
     */
    function follow(address followee) external {
        if (followee == msg.sender) revert CannotFollowSelf();
        if (isFollowing[msg.sender][followee]) revert AlreadyFollowing();

        isFollowing[msg.sender][followee] = true;

        emit Followed(msg.sender, followee);
    }

    /**
     * @notice Unfollow a user
     * @param followee The address to unfollow
     */
    function unfollow(address followee) external {
        if (!isFollowing[msg.sender][followee]) revert NotFollowing();

        isFollowing[msg.sender][followee] = false;

        emit Unfollowed(msg.sender, followee);
    }

    // ============ Admin Functions ============

    /**
     * @notice Withdraw accumulated protocol fees
     */
    function withdrawProtocolFee() external {
        uint256 amount = protocolFeeAccumulated;
        protocolFeeAccumulated = 0;

        bloomToken.safeTransfer(protocolFeeRecipient, amount);

        emit ProtocolFeeWithdrawn(protocolFeeRecipient, amount);
    }

    /**
     * @notice Update protocol fee recipient
     * @param newRecipient The new recipient address
     */
    function setProtocolFeeRecipient(address newRecipient) external {
        require(msg.sender == protocolFeeRecipient, "Not authorized");
        protocolFeeRecipient = newRecipient;
    }
}
