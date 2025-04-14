document.addEventListener('DOMContentLoaded', () => {
    const breakBtn = document.getElementById('breakBtn');
    const statusDiv = document.getElementById('status');
    const blockedSitesList = document.getElementById('blockedSitesList');
    const newSiteInput = document.getElementById('newSite');
    const addSiteBtn = document.getElementById('addSiteBtn');

    loadSettings();

    breakBtn.addEventListener('click', takeBreak);
    addSiteBtn.addEventListener('click', addSite);
    newSiteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addSite();
        }
    });
    blockedSitesList.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-btn')) {
            const siteToRemove = event.target.dataset.site;
            removeSite(siteToRemove);
        }
    });

    function loadSettings() {
        chrome.storage.local.get(['blockedSites', 'disableUntil'], (result) => {
            const sites = result.blockedSites || getDefaultBlockedSites();
            const disableUntil = result.disableUntil || 0;

            renderBlockedSites(sites);
            updateStatus(disableUntil);

            if (!result.blockedSites) {
                chrome.storage.local.set({ blockedSites: sites });
            }
        });
    }

    function getDefaultBlockedSites() {
        return [
            "*.youtube.com",
            "*.netflix.com",
            "*.hulu.com"
        ];
    }

    function renderBlockedSites(sites) {
        blockedSitesList.innerHTML = '';
        if (!sites || sites.length === 0) {
            blockedSitesList.innerHTML = '<li>No sites blocked.</li>';
            return;
        }
        sites.forEach(site => {
            const li = document.createElement('li');
            const text = document.createElement('span');
            text.textContent = site;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.classList.add('remove-btn');
            removeBtn.dataset.site = site;

            li.appendChild(text);
            li.appendChild(removeBtn);
            blockedSitesList.appendChild(li);
        });
    }

    function updateStatus(disableUntil) {
        const now = Date.now();
        if (disableUntil > now) {
            const minutesLeft = Math.ceil((disableUntil - now) / (1000 * 60));
            statusDiv.textContent = `Blocking disabled for ${minutesLeft} more minute(s).`;
            statusDiv.style.color = 'orange';
            breakBtn.textContent = 'Cancel Break'; // Change button text
            breakBtn.onclick = cancelBreak; // Change button action
        } else {
            statusDiv.textContent = 'Blocking is active.';
            statusDiv.style.color = 'green';
            breakBtn.textContent = 'Take a 30min Break';
            breakBtn.onclick = takeBreak;
        }
    }


    function takeBreak() {
        const disableDuration = 30 * 60 * 1000;
        const disableUntil = Date.now() + disableDuration;
        chrome.storage.local.set({ disableUntil: disableUntil }, () => {
            console.log('Blocking disabled until:', new Date(disableUntil));
            updateStatus(disableUntil);
        });
    }

    function cancelBreak() {
        chrome.storage.local.set({ disableUntil: 0 }, () => {
            console.log('Break cancelled.');
            updateStatus(0);
        });
    }

    function addSite() {
        const newSite = newSiteInput.value.trim();
        if (!newSite) {
            alert('Please enter a site pattern (e.g., *.example.com or www.specificsite.net)');
            return;
        }

        let cleanSite = newSite.replace(/^https?:\/\//, '');
        if (!cleanSite.includes('.')) {
            alert('Invalid site pattern. Use formats like *.example.com or www.specificsite.net');
            return;
        }


        chrome.storage.local.get(['blockedSites'], (result) => {
            const sites = result.blockedSites || getDefaultBlockedSites();
            if (sites.includes(cleanSite)) {
                alert(`${cleanSite} is already in the list.`);
                return;
            }
            const updatedSites = [...sites, cleanSite];
            chrome.storage.local.set({ blockedSites: updatedSites }, () => {
                renderBlockedSites(updatedSites);
                newSiteInput.value = ''; // Clear input field
                console.log('Added site:', cleanSite);
            });
        });
    }

    function removeSite(siteToRemove) {
        chrome.storage.local.get(['blockedSites'], (result) => {
            let sites = result.blockedSites || [];
            const updatedSites = sites.filter(site => site !== siteToRemove);
            chrome.storage.local.set({ blockedSites: updatedSites }, () => {
                renderBlockedSites(updatedSites);
                console.log('Removed site:', siteToRemove);
            });
        });
    }
});