import { formatUnits } from "viem";

/**
 * Truncate an Ethereum address for display
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a BigInt token amount with decimals
 */
export function formatTokenAmount(
  amount: bigint | string | number,
  decimals = 18,
  displayDecimals = 2
): string {
  const formatted = formatUnits(BigInt(amount), decimals);
  const num = parseFloat(formatted);

  if (num === 0) return "0";
  if (num < 0.01) return "<0.01";

  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  });
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number | bigint): string {
  return Number(num).toLocaleString("en-US");
}

/**
 * Calculate time remaining from deadline timestamp
 */
export function getTimeRemaining(deadline: bigint | number): {
  isExpired: boolean;
  days: number;
  hours: number;
  minutes: number;
  totalSeconds: number;
  display: string;
} {
  const now = Math.floor(Date.now() / 1000);
  const deadlineNum = Number(deadline);
  const diff = deadlineNum - now;

  if (diff <= 0) {
    const elapsed = now - deadlineNum;
    const days = Math.floor(elapsed / 86400);
    const hours = Math.floor((elapsed % 86400) / 3600);

    let display = "";
    if (days > 0) {
      display = `${days} 天前结束`;
    } else if (hours > 0) {
      display = `${hours} 小时前结束`;
    } else {
      display = "刚刚结束";
    }

    return {
      isExpired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      totalSeconds: 0,
      display,
    };
  }

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  let display = "";
  if (days > 0) {
    display = `剩余 ${days}天${hours}小时`;
  } else if (hours > 0) {
    display = `剩余 ${hours}小时${minutes}分钟`;
  } else {
    display = `剩余 ${minutes}分钟`;
  }

  return {
    isExpired: false,
    days,
    hours,
    minutes,
    totalSeconds: diff,
    display,
  };
}

/**
 * Format a timestamp to relative time
 */
export function formatRelativeTime(timestamp: bigint | number): string {
  const now = Math.floor(Date.now() / 1000);
  const ts = Number(timestamp);
  const diff = now - ts;

  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;

  const date = new Date(ts * 1000);
  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date for display
 */
export function formatDate(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Calculate percentage
 */
export function calculatePercentage(
  value: bigint,
  total: bigint,
  decimals = 1
): string {
  if (total === 0n) return "0";
  const percentage = (Number(value) / Number(total)) * 100;
  return percentage.toFixed(decimals);
}

/**
 * Generate a deterministic color from an address (for avatars)
 */
export function addressToColor(address: string): string {
  if (!address) return "#1a3a2f";

  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 45%, 35%)`;
}

/**
 * Generate initials from an address
 */
export function addressToInitials(address: string): string {
  if (!address) return "??";
  return address.slice(2, 4).toUpperCase();
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Parse IPFS URI to gateway URL
 */
export function ipfsToGateway(uri: string): string {
  if (!uri) return "";

  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace("ipfs://", "");
    return `https://ipfs.io/ipfs/${cid}`;
  }

  if (uri.startsWith("https://") || uri.startsWith("http://")) {
    return uri;
  }

  return `https://ipfs.io/ipfs/${uri}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Check if content is active (not expired)
 */
export function isContentActive(deadline: bigint | number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return Number(deadline) > now;
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
