// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'toggle') {
    // Handle the toggle action
    if (request.isActive) {
      // Extension is being activated
      console.log('Extension activated');
      // Add your content script logic here
    } else {
      // Extension is being deactivated
      console.log('Extension deactivated');
      // Add cleanup logic here
    }
  }
});

// Initial load
chrome.storage.sync.get(['isActive'], function(result) {
  if (result.isActive) {
    // Add your content script logic here for when the page loads with the extension active
    console.log('Page loaded with extension active');
  }
});
