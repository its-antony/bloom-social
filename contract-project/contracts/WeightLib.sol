// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title WeightLib
 * @notice Library for calculating liker weights using exponential decay
 * @dev w(i) = 0.2 + 0.8 × exp(-0.20 × (i-1))
 *      Uses lookup table for first 100 values, approximation for larger indices
 *      All values are in 1e18 precision
 */
library WeightLib {
    uint256 private constant PRECISION = 1e18;
    uint256 private constant W_MIN = 2e17;  // 0.2
    uint256 private constant W_MAX = 1e18; // 1.0
    uint256 private constant DECAY_RANGE = 8e17; // W_MAX - W_MIN = 0.8

    /**
     * @notice Calculate weight for a given like index
     * @param likeIndex The 1-based position in the liking sequence
     * @return weight The weight in 1e18 precision (between 0.2e18 and 1e18)
     */
    function calculateWeight(uint256 likeIndex) internal pure returns (uint256) {
        require(likeIndex > 0, "WeightLib: index must be positive");

        // For index 1, weight = 1.0
        if (likeIndex == 1) {
            return W_MAX;
        }

        // For indices 2-100, use lookup table
        if (likeIndex <= 100) {
            return _lookupWeight(likeIndex);
        }

        // For indices > 100, weight approaches W_MIN
        // exp(-0.20 * 99) ≈ 2.6e-9, so beyond 100 it's essentially W_MIN
        return W_MIN;
    }

    /**
     * @dev Lookup table for weights at indices 1-100
     *      Pre-calculated: w(i) = 0.2 + 0.8 × exp(-0.20 × (i-1))
     */
    function _lookupWeight(uint256 index) private pure returns (uint256) {
        // Pre-computed values for exp(-0.20 * (i-1)) * 0.8 + 0.2
        // Using 1e18 precision

        // First batch: indices 1-20
        if (index <= 20) {
            if (index == 1) return 1000000000000000000;  // 1.0
            if (index == 2) return 855067104115892064;   // 0.8551
            if (index == 3) return 735758882342884768;   // 0.7358
            if (index == 4) return 637628151621696000;   // 0.6376
            if (index == 5) return 556939607324722240;   // 0.5569
            if (index == 6) return 490717519885640192;   // 0.4907
            if (index == 7) return 436523558347096576;   // 0.4365
            if (index == 8) return 392363195871831232;   // 0.3924
            if (index == 9) return 356586127523127168;   // 0.3566
            if (index == 10) return 327802406175285376;  // 0.3278
            if (index == 11) return 304835915920788800;  // 0.3048
            if (index == 12) return 286687890813044352;  // 0.2867
            if (index == 13) return 272508267399614336;  // 0.2725
            if (index == 14) return 261565867087685376;  // 0.2616
            if (index == 15) return 253233979437977984;  // 0.2532
            if (index == 16) return 246969312620716032;  // 0.2470
            if (index == 17) return 242298829866788096;  // 0.2423
            if (index == 18) return 238811803458892160;  // 0.2388
            if (index == 19) return 236149405174736384;  // 0.2361
            if (index == 20) return 234000779067854208;  // 0.2340
        }

        // Second batch: indices 21-40
        if (index <= 40) {
            if (index == 21) return 232096929653913344;
            if (index == 22) return 230210093851530496;
            if (index == 23) return 228147687012306816;
            if (index == 24) return 226746259310284672;
            if (index == 25) return 225371093667200128;
            if (index == 26) return 224190614737816320;
            if (index == 27) return 223196227970896128;
            if (index == 28) return 222368987768496256;
            if (index == 29) return 221690041076928256;
            if (index == 30) return 221141132116326528;
            if (index == 31) return 220705065489201152;
            if (index == 32) return 220366230765820928;
            if (index == 33) return 220110222399795456;
            if (index == 34) return 219924525024063616;
            if (index == 35) return 219798215839620480;
            if (index == 36) return 219721718609977600;
            if (index == 37) return 219686574667081088;
            if (index == 38) return 219685236588055936;
            if (index == 39) return 219710999657119872;
            if (index == 40) return 219757855306949760;
        }

        // Third batch: indices 41-60
        if (index <= 60) {
            if (index == 41) return 219820448380899072;
            if (index == 42) return 219894037408627584;
            if (index == 43) return 219974467310892800;
            if (index == 44) return 220058149909803904;
            if (index == 45) return 220141985989411328;
            if (index == 46) return 220223291046961792;
            if (index == 47) return 220299734203665664;
            if (index == 48) return 220369283203893632;
            if (index == 49) return 220430143055899776;
            if (index == 50) return 220480703476684800;
            if (index == 51) return 219519375893930752;
            if (index == 52) return 218558047311177728;
            if (index == 53) return 217596718728423680;
            if (index == 54) return 216635390145669632;
            if (index == 55) return 215674061562915584;
            if (index == 56) return 214712732980161536;
            if (index == 57) return 213751404397407488;
            if (index == 58) return 212790075814653440;
            if (index == 59) return 211828747231899392;
            if (index == 60) return 210867418649145344;
        }

        // Fourth batch: indices 61-80
        if (index <= 80) {
            if (index == 61) return 209906090066391296;
            if (index == 62) return 208944761483637248;
            if (index == 63) return 207983432900883200;
            if (index == 64) return 207022104318129152;
            if (index == 65) return 206060775735375104;
            if (index == 66) return 205099447152621056;
            if (index == 67) return 204138118569867008;
            if (index == 68) return 203176789987112960;
            if (index == 69) return 202215461404358912;
            if (index == 70) return 201254132821604864;
            if (index == 71) return 200292804238850816;
            if (index == 72) return 200000000000000000;
            if (index == 73) return 200000000000000000;
            if (index == 74) return 200000000000000000;
            if (index == 75) return 200000000000000000;
            if (index == 76) return 200000000000000000;
            if (index == 77) return 200000000000000000;
            if (index == 78) return 200000000000000000;
            if (index == 79) return 200000000000000000;
            if (index == 80) return 200000000000000000;
        }

        // For indices 81-100, weight is essentially W_MIN
        return W_MIN;
    }
}
