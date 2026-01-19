import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { BloomToken, BloomContent } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("BloomContent", function () {
  let bloomToken: BloomToken;
  let bloomContent: BloomContent;
  let owner: HardhatEthersSigner;
  let author: HardhatEthersSigner;
  let liker1: HardhatEthersSigner;
  let liker2: HardhatEthersSigner;
  let liker3: HardhatEthersSigner;
  let protocolFeeRecipient: HardhatEthersSigner;

  const LIKE_AMOUNT = ethers.parseEther("10");
  const DURATION = 86400; // 1 day

  beforeEach(async function () {
    [owner, author, liker1, liker2, liker3, protocolFeeRecipient] =
      await ethers.getSigners();

    // Deploy BloomToken
    const BloomTokenFactory = await ethers.getContractFactory("BloomToken");
    bloomToken = await BloomTokenFactory.deploy();

    // Deploy BloomContent
    const BloomContentFactory = await ethers.getContractFactory("BloomContent");
    bloomContent = await BloomContentFactory.deploy(
      await bloomToken.getAddress(),
      protocolFeeRecipient.address
    );

    // Distribute tokens to test accounts
    const transferAmount = ethers.parseEther("10000");
    await bloomToken.transfer(author.address, transferAmount);
    await bloomToken.transfer(liker1.address, transferAmount);
    await bloomToken.transfer(liker2.address, transferAmount);
    await bloomToken.transfer(liker3.address, transferAmount);

    // Approve BloomContent to spend tokens
    const contentAddress = await bloomContent.getAddress();
    await bloomToken.connect(liker1).approve(contentAddress, ethers.MaxUint256);
    await bloomToken.connect(liker2).approve(contentAddress, ethers.MaxUint256);
    await bloomToken.connect(liker3).approve(contentAddress, ethers.MaxUint256);
  });

  describe("Content Creation", function () {
    it("should create content with correct parameters", async function () {
      const tx = await bloomContent
        .connect(author)
        .createContent(
          LIKE_AMOUNT,
          DURATION,
          "ipfs://QmTest",
          ethers.keccak256(ethers.toUtf8Bytes("test content"))
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log) => bloomContent.interface.parseLog(log as any)?.name === "ContentCreated"
      );

      expect(event).to.not.be.undefined;

      const content = await bloomContent.getContent(0);
      expect(content.author).to.equal(author.address);
      expect(content.likeAmount).to.equal(LIKE_AMOUNT);
      expect(content.contentURI).to.equal("ipfs://QmTest");
    });

    it("should revert with zero like amount", async function () {
      await expect(
        bloomContent
          .connect(author)
          .createContent(
            0,
            DURATION,
            "ipfs://QmTest",
            ethers.keccak256(ethers.toUtf8Bytes("test"))
          )
      ).to.be.revertedWithCustomError(bloomContent, "InvalidLikeAmount");
    });
  });

  describe("Liking", function () {
    beforeEach(async function () {
      await bloomContent
        .connect(author)
        .createContent(
          LIKE_AMOUNT,
          DURATION,
          "ipfs://QmTest",
          ethers.keccak256(ethers.toUtf8Bytes("test content"))
        );
    });

    it("should allow liking and distribute tokens correctly", async function () {
      const initialBalance = await bloomToken.balanceOf(liker1.address);

      await bloomContent.connect(liker1).like(0);

      const finalBalance = await bloomToken.balanceOf(liker1.address);
      expect(initialBalance - finalBalance).to.equal(LIKE_AMOUNT);

      const content = await bloomContent.getContent(0);
      expect(content.likeCount).to.equal(1);

      // Check distributions: 70% author, 25% likers, 5% protocol
      const expectedAuthorPool = (LIKE_AMOUNT * 7000n) / 10000n;
      const expectedLikerPool = (LIKE_AMOUNT * 2500n) / 10000n;
      expect(content.authorPool).to.equal(expectedAuthorPool);
      expect(content.likerRewardPool).to.equal(expectedLikerPool);
    });

    it("should assign correct weights to likers", async function () {
      await bloomContent.connect(liker1).like(0);
      await bloomContent.connect(liker2).like(0);
      await bloomContent.connect(liker3).like(0);

      const like1 = await bloomContent.getLikeInfo(0, liker1.address);
      const like2 = await bloomContent.getLikeInfo(0, liker2.address);
      const like3 = await bloomContent.getLikeInfo(0, liker3.address);

      // First liker should have highest weight
      expect(like1.weight).to.be.gt(like2.weight);
      expect(like2.weight).to.be.gt(like3.weight);

      // First liker weight should be 1.0 (1e18)
      expect(like1.weight).to.equal(ethers.parseEther("1"));
    });

    it("should revert if already liked", async function () {
      await bloomContent.connect(liker1).like(0);
      await expect(
        bloomContent.connect(liker1).like(0)
      ).to.be.revertedWithCustomError(bloomContent, "AlreadyLiked");
    });

    it("should revert if content expired", async function () {
      await time.increase(DURATION + 1);
      await expect(
        bloomContent.connect(liker1).like(0)
      ).to.be.revertedWithCustomError(bloomContent, "ContentExpired");
    });
  });

  describe("Claiming Rewards", function () {
    beforeEach(async function () {
      await bloomContent
        .connect(author)
        .createContent(
          LIKE_AMOUNT,
          DURATION,
          "ipfs://QmTest",
          ethers.keccak256(ethers.toUtf8Bytes("test content"))
        );

      await bloomContent.connect(liker1).like(0);
      await bloomContent.connect(liker2).like(0);
    });

    it("should allow author to claim after deadline", async function () {
      await time.increase(DURATION + 1);

      const initialBalance = await bloomToken.balanceOf(author.address);
      await bloomContent.connect(author).claimAuthorReward(0);
      const finalBalance = await bloomToken.balanceOf(author.address);

      const expectedReward = (LIKE_AMOUNT * 2n * 7000n) / 10000n;
      expect(finalBalance - initialBalance).to.equal(expectedReward);
    });

    it("should allow likers to claim their share after deadline", async function () {
      await time.increase(DURATION + 1);

      const liker1Initial = await bloomToken.balanceOf(liker1.address);
      await bloomContent.connect(liker1).claimLikerReward(0);
      const liker1Final = await bloomToken.balanceOf(liker1.address);

      const liker2Initial = await bloomToken.balanceOf(liker2.address);
      await bloomContent.connect(liker2).claimLikerReward(0);
      const liker2Final = await bloomToken.balanceOf(liker2.address);

      // First liker should get more than second liker
      const liker1Reward = liker1Final - liker1Initial;
      const liker2Reward = liker2Final - liker2Initial;
      expect(liker1Reward).to.be.gt(liker2Reward);
    });

    it("should revert if claiming before deadline", async function () {
      await expect(
        bloomContent.connect(author).claimAuthorReward(0)
      ).to.be.revertedWithCustomError(bloomContent, "ContentNotExpired");

      await expect(
        bloomContent.connect(liker1).claimLikerReward(0)
      ).to.be.revertedWithCustomError(bloomContent, "ContentNotExpired");
    });

    it("should revert if already claimed", async function () {
      await time.increase(DURATION + 1);

      await bloomContent.connect(author).claimAuthorReward(0);
      await expect(
        bloomContent.connect(author).claimAuthorReward(0)
      ).to.be.revertedWithCustomError(bloomContent, "AlreadyClaimed");

      await bloomContent.connect(liker1).claimLikerReward(0);
      await expect(
        bloomContent.connect(liker1).claimLikerReward(0)
      ).to.be.revertedWithCustomError(bloomContent, "AlreadyClaimed");
    });
  });

  describe("Follow System", function () {
    it("should allow following and unfollowing", async function () {
      await bloomContent.connect(liker1).follow(author.address);
      expect(await bloomContent.isFollowing(liker1.address, author.address)).to.be
        .true;

      await bloomContent.connect(liker1).unfollow(author.address);
      expect(await bloomContent.isFollowing(liker1.address, author.address)).to.be
        .false;
    });

    it("should revert if following self", async function () {
      await expect(
        bloomContent.connect(liker1).follow(liker1.address)
      ).to.be.revertedWithCustomError(bloomContent, "CannotFollowSelf");
    });

    it("should revert if already following", async function () {
      await bloomContent.connect(liker1).follow(author.address);
      await expect(
        bloomContent.connect(liker1).follow(author.address)
      ).to.be.revertedWithCustomError(bloomContent, "AlreadyFollowing");
    });
  });

  describe("Estimated Reward", function () {
    it("should return correct estimated reward", async function () {
      await bloomContent
        .connect(author)
        .createContent(
          LIKE_AMOUNT,
          DURATION,
          "ipfs://QmTest",
          ethers.keccak256(ethers.toUtf8Bytes("test content"))
        );

      await bloomContent.connect(liker1).like(0);
      await bloomContent.connect(liker2).like(0);

      const estimated1 = await bloomContent.getEstimatedReward(0, liker1.address);
      const estimated2 = await bloomContent.getEstimatedReward(0, liker2.address);

      expect(estimated1).to.be.gt(estimated2);
      expect(estimated1 + estimated2).to.be.closeTo(
        (LIKE_AMOUNT * 2n * 2500n) / 10000n,
        ethers.parseEther("0.001")
      );
    });
  });
});
