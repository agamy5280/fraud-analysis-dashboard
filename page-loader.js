// Create and insert the page loader immediately
function createPageLoader() {
  // Create the loader container
  const loaderContainer = document.createElement("div");
  loaderContainer.className = "page-loader-container";
  loaderContainer.id = "mainPageLoader";

  // Create spinner
  const spinner = document.createElement("div");
  spinner.className = "page-spinner";

  // Create loading text
  const loadingText = document.createElement("div");
  loadingText.className = "page-loading-text";
  loadingText.textContent = "Loading Dashboard...";

  // Add counter for progress indication
  const progressCounter = document.createElement("div");
  progressCounter.className = "progress-counter";
  progressCounter.id = "loaderProgressCounter";
  progressCounter.textContent = "0%";

  // Append all elements
  loaderContainer.appendChild(spinner);
  loaderContainer.appendChild(loadingText);
  loaderContainer.appendChild(progressCounter);

  // Insert as first element in body
  document.body.insertBefore(loaderContainer, document.body.firstChild);

  // Start the progress animation
  simulateProgress(progressCounter);
}

// Simulate progress while page loads
function simulateProgress(progressElement) {
  let progress = 0;
  const interval = setInterval(() => {
    // Slower progress simulation to account for iframe loading
    const increment = (100 - progress) / 15;
    progress += Math.min(increment, 2);

    if (progress >= 70) {
      // Stop at 70% and wait for actual content load
      clearInterval(interval);
      progressElement.textContent = "70%";
    } else {
      progressElement.textContent = `${Math.floor(progress)}%`;
    }
  }, 300);

  // Store interval ID to clear it later
  window.progressInterval = interval;
}

// Track iframe loading progress
function trackIframeLoading() {
  // Wait for DOM to be ready
  document.addEventListener("DOMContentLoaded", function () {
    // Initialize tracking variables
    window.totalIframes = 0;
    window.loadedIframes = 0;

    // Find all iframes once they're created (after initDashboard runs)
    setTimeout(() => {
      const iframes = document.querySelectorAll(".visualization-frame");
      window.totalIframes = iframes.length;

      if (iframes.length === 0) {
        // No iframes found, just remove the loader
        completeLoading();
        return;
      }

      // Update progress text
      const progressElement = document.getElementById("loaderProgressCounter");
      if (progressElement) {
        progressElement.textContent = `70% - Loading visualizations (0/${window.totalIframes})`;
      }

      // Track each iframe's load event
      iframes.forEach((iframe) => {
        // Check if already loaded
        if (iframe.complete || iframe.readyState === "complete") {
          incrementLoadedIframes();
        } else {
          iframe.addEventListener("load", incrementLoadedIframes);
        }
      });

      // Set a timeout to prevent infinite waiting
      setTimeout(completeLoading, 30000); // 30 seconds max wait
    }, 1000); // Give time for initDashboard to create iframes
  });
}

// Increment loaded iframes counter and update progress
function incrementLoadedIframes() {
  window.loadedIframes++;

  // Calculate total progress (70% base + up to 30% for iframes)
  const iframeProgress =
    window.totalIframes > 0
      ? (window.loadedIframes / window.totalIframes) * 30
      : 30;

  const totalProgress = Math.min(70 + Math.floor(iframeProgress), 100);

  // Update progress text
  const progressElement = document.getElementById("loaderProgressCounter");
  if (progressElement) {
    progressElement.textContent = `${totalProgress}% - Loading visualizations (${window.loadedIframes}/${window.totalIframes})`;
  }

  // If all iframes are loaded, complete the loading process
  if (window.loadedIframes >= window.totalIframes) {
    completeLoading();
  }
}

// Complete the loading process
function completeLoading() {
  // Ensure this only runs once
  if (window.loadingCompleted) return;
  window.loadingCompleted = true;

  const loaderContainer = document.getElementById("mainPageLoader");
  const progressCounter = document.getElementById("loaderProgressCounter");

  if (loaderContainer) {
    // Update to 100%
    if (progressCounter) {
      progressCounter.textContent = "100% - Complete";
    }

    // Clear any remaining interval
    if (window.progressInterval) {
      clearInterval(window.progressInterval);
    }

    // Add fade-out class
    setTimeout(() => {
      loaderContainer.classList.add("fade-out");

      // Remove after animation completes
      setTimeout(() => {
        loaderContainer.remove();
      }, 500);
    }, 500); // Show 100% for a moment before fading
  }
}

// Create page loader immediately
createPageLoader();

// Start tracking iframe loading
trackIframeLoading();

// Backup to ensure loader eventually disappears even if something goes wrong
window.addEventListener("load", function () {
  setTimeout(() => {
    if (!window.loadingCompleted) {
      completeLoading();
    }
  }, 5000); // Wait 5 seconds after window load before forcing completion
});
