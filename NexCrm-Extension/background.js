// Data Vista Auto-Uploader Background Service Worker

chrome.downloads.onChanged.addListener((delta) => {
  // We only care if the download just completed
  if (delta.state && delta.state.current === 'complete') {
    chrome.downloads.search({ id: delta.id }, async (results) => {
      if (results && results.length > 0) {
        const item = results[0];
        const filename = item.filename; // Absolute path on disk
        const lowered = filename.toLowerCase();

        // Check if it's an Excel or CSV file
        if (lowered.endsWith('.xlsx') || lowered.endsWith('.csv') || lowered.endsWith('.xls')) {
          
          // Optionally, verify it came from Amazon.
          // For safety, we'll try to sync ALL matching sheets if the user wants this.
          // If you only want Amazon: if (item.url.includes('amazon')) { ... }
          
          console.log("Detected new report download:", filename);
          await uploadToDataVista(item);
        }
      }
    });
  }
});

async function uploadToDataVista(downloadItem) {
  try {
    // 1. Fetch the file directly from the user's local disk
    // Note: User MUST enable "Allow access to file URLs" in chrome://extensions
    const fileUrl = 'file:///' + downloadItem.filename.replace(/\\/g, '/');
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Could not read file: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Extract just the filename from the path
    const justFileName = downloadItem.filename.split(/[\\/]/).pop();
    
    // 2. Wrap it into a FormData payload
    const formData = new FormData();
    formData.append('file', blob, justFileName);

    console.log("Uploading to Data Vista...");

    // 3. Post directly to the Render API
    const apiResponse = await fetch('https://data-vista-crm.onrender.com/api/import/upload', {
      method: 'POST',
      body: formData
    });

    if (apiResponse.ok) {
      // 4. Trigger UI Success Notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Data Vista Sync',
        message: 'Amazon Report successfully auto-imported!'
      });
      console.log("Upload successful!");
    } else {
      const errText = await apiResponse.text();
      throw new Error(errText);
    }
  } catch (err) {
    console.error("Auto-import failed. Ensure 'Allow access to file URLs' is enabled.", err);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Data Vista Error',
      message: 'Upload failed. Did you enable "Allow access to file URLs" in extension settings?'
    });
  }
}
