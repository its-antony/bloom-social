import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BloomSocialModule = buildModule("BloomSocial", (m) => {
  // Get the deployer address for protocol fee recipient
  const protocolFeeRecipient = m.getParameter(
    "protocolFeeRecipient",
    "0x0000000000000000000000000000000000000000"
  );

  // Deploy BloomToken
  const bloomToken = m.contract("BloomToken");

  // Deploy BloomContent with BloomToken address
  const bloomContent = m.contract("BloomContent", [
    bloomToken,
    protocolFeeRecipient,
  ]);

  return { bloomToken, bloomContent };
});

export default BloomSocialModule;
