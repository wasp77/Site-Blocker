const writeMsg = () => {
  document.documentElement.innerHTML = '<html><head><title>Blocked</title><style>body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background-color: #333; color: #eee; } h1 { text-align: center; } </style></head><body><h1>Time is the only truly valuable commodity. Focus!</h1></body></html>';
  throw new Error("WASPY_BLOCKER: Page blocked.");
};

function isBlocked(url, blockedSites) {
  if (!blockedSites || blockedSites.length === 0) {
    return false;
  }
  const currentHostname = new URL(url).hostname; // e.g., www.youtube.com

  return blockedSites.some(pattern => {
    if (pattern.startsWith('*.')) {
      const domain = pattern.substring(2); // youtube.com
      return currentHostname === domain || currentHostname.endsWith('.' + domain);
    } else {
      return currentHostname === pattern;
    }
  });
}

const main = async () => {
  try {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['blockedSites', 'disableUntil'], resolve);
    });

    const blockedSites = result.blockedSites; // Defaults handled in popup.js initialization
    const disableUntil = result.disableUntil || 0;
    const now = Date.now();

    if (disableUntil > now) {
      return;
    }

    const currentUrl = window.location.href;
    if (isBlocked(currentUrl, blockedSites)) {
      const currentHostname = new URL(currentUrl).hostname;

      if (currentHostname.includes("youtube.com") && currentUrl.includes("/watch")) {
        await new Promise(resolve => setTimeout(resolve, 750)); // Wait 750ms

        const channelNameElement = document.querySelector('#owner-sub-count, #upload-info #channel-name a, ytd-channel-name #text a');


        if (channelNameElement && channelNameElement.textContent) {
          const channelName = channelNameElement.textContent.trim().toLowerCase();
          const allowedChannels = [
            "george hotz",
            "andrej karpathy",
            "bon appétit",
            "eater",
            "munchies"
          ];

          const isAllowed = allowedChannels.some(allowed => channelName.includes(allowed));

          if (isAllowed) {
            return;
          } else {
            writeMsg();
          }
        } else {
          writeMsg();
        }
      } else {
        writeMsg();
      }
    }
  } catch (error) {
    if (error.message !== "WASPY_BLOCKER: Page blocked.") {
      console.error("Waspy Blocker Error:", error);
    }
    clearInterval(intervalId);
  }
};

const intervalId = setInterval(main, 1000);

main();