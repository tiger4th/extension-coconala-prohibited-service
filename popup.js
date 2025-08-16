document.addEventListener('DOMContentLoaded', function() {
  const actionButton = document.getElementById('actionButton');
  const statusDiv = document.getElementById('status');

  // Load saved state
  chrome.storage.sync.get(['isActive'], function(result) {
    const isActive = result.isActive || false;
    updateButtonState(isActive);
  });

  // Toggle state on button click
  actionButton.addEventListener('click', function() {
    chrome.storage.sync.get(['isActive'], function(result) {
      const newState = !(result.isActive || false);
      updateButtonState(newState);
      
      // Save state
      chrome.storage.sync.set({ isActive: newState });
      
      // Send message to content script
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'toggle', isActive: newState});
      });
    });
  });

  function updateButtonState(isActive) {
    if (isActive) {
      actionButton.textContent = 'Deactivate';
      actionButton.style.backgroundColor = '#f44336';
      statusDiv.textContent = 'Extension is active';
    } else {
      actionButton.textContent = 'Activate';
      actionButton.style.backgroundColor = '#4CAF50';
      statusDiv.textContent = 'Extension is inactive';
    }
  }
});
