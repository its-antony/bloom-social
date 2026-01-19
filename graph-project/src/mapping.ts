import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  ContentCreated,
  Liked,
  AuthorRewardClaimed,
  LikerRewardClaimed,
  Followed,
  Unfollowed,
} from "../generated/BloomContent/BloomContent";
import { Content, Like, User, Follow } from "../generated/schema";

function getOrCreateUser(address: Bytes): User {
  let id = address.toHexString();
  let user = User.load(id);
  if (user == null) {
    user = new User(id);
    user.totalEarned = BigInt.fromI32(0);
    user.totalLiked = BigInt.fromI32(0);
    user.followersCount = BigInt.fromI32(0);
    user.followingCount = BigInt.fromI32(0);
    user.contentsCreated = BigInt.fromI32(0);
  }
  return user;
}

export function handleContentCreated(event: ContentCreated): void {
  let id = event.params.contentId.toString();
  let content = new Content(id);
  content.author = event.params.author;
  content.likeAmount = event.params.likeAmount;
  content.deadline = event.params.deadline;
  content.contentURI = event.params.contentURI;
  content.contentHash = event.params.contentHash;
  content.authorPool = BigInt.fromI32(0);
  content.likerRewardPool = BigInt.fromI32(0);
  content.totalWeight = BigInt.fromI32(0);
  content.likeCount = BigInt.fromI32(0);
  content.createdAt = event.block.timestamp;
  content.authorClaimed = false;
  content.save();

  let user = getOrCreateUser(event.params.author);
  user.contentsCreated = user.contentsCreated.plus(BigInt.fromI32(1));
  user.save();
}

export function handleLiked(event: Liked): void {
  let contentId = event.params.contentId.toString();
  let likerId = event.params.liker.toHexString();
  let likeId = contentId + "-" + likerId;

  let like = new Like(likeId);
  like.content = contentId;
  like.liker = event.params.liker;
  like.likeIndex = event.params.likeIndex;
  like.weight = event.params.weight;
  like.claimed = false;
  like.likedAt = event.block.timestamp;
  like.save();

  let content = Content.load(contentId);
  if (content != null) {
    content.likeCount = content.likeCount.plus(BigInt.fromI32(1));
    content.totalWeight = content.totalWeight.plus(event.params.weight);
    content.authorPool = content.authorPool.plus(
      event.params.amount.times(BigInt.fromI32(7000)).div(BigInt.fromI32(10000))
    );
    content.likerRewardPool = content.likerRewardPool.plus(
      event.params.amount.times(BigInt.fromI32(2500)).div(BigInt.fromI32(10000))
    );
    content.save();
  }

  let user = getOrCreateUser(event.params.liker);
  user.totalLiked = user.totalLiked.plus(BigInt.fromI32(1));
  user.save();
}

export function handleAuthorRewardClaimed(event: AuthorRewardClaimed): void {
  let contentId = event.params.contentId.toString();
  let content = Content.load(contentId);
  if (content != null) {
    content.authorClaimed = true;
    content.save();
  }

  let user = getOrCreateUser(event.params.author);
  user.totalEarned = user.totalEarned.plus(event.params.amount);
  user.save();
}

export function handleLikerRewardClaimed(event: LikerRewardClaimed): void {
  let contentId = event.params.contentId.toString();
  let likerId = event.params.liker.toHexString();
  let likeId = contentId + "-" + likerId;

  let like = Like.load(likeId);
  if (like != null) {
    like.claimed = true;
    like.save();
  }

  let user = getOrCreateUser(event.params.liker);
  user.totalEarned = user.totalEarned.plus(event.params.amount);
  user.save();
}

export function handleFollowed(event: Followed): void {
  let id = event.params.follower.toHexString() + "-" + event.params.followee.toHexString();
  let follow = new Follow(id);
  follow.follower = event.params.follower;
  follow.followee = event.params.followee;
  follow.followedAt = event.block.timestamp;
  follow.save();

  let follower = getOrCreateUser(event.params.follower);
  follower.followingCount = follower.followingCount.plus(BigInt.fromI32(1));
  follower.save();

  let followee = getOrCreateUser(event.params.followee);
  followee.followersCount = followee.followersCount.plus(BigInt.fromI32(1));
  followee.save();
}

export function handleUnfollowed(event: Unfollowed): void {
  let id = event.params.follower.toHexString() + "-" + event.params.followee.toHexString();
  let follow = Follow.load(id);
  if (follow != null) {
    // Note: The Graph doesn't support entity deletion in all versions
    // We keep the record but could add an "active" field if needed
  }

  let follower = getOrCreateUser(event.params.follower);
  if (follower.followingCount.gt(BigInt.fromI32(0))) {
    follower.followingCount = follower.followingCount.minus(BigInt.fromI32(1));
    follower.save();
  }

  let followee = getOrCreateUser(event.params.followee);
  if (followee.followersCount.gt(BigInt.fromI32(0))) {
    followee.followersCount = followee.followersCount.minus(BigInt.fromI32(1));
    followee.save();
  }
}
