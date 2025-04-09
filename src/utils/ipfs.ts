
// Utility functions for IPFS operations

// Convert a file to a buffer that can be uploaded to IPFS
export const fileToBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Mock function to simulate uploading a file to IPFS
// In a real app, this would connect to an IPFS node or a service like Pinata
export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a mock IPFS hash (CID)
    const mockCID = 'Qm' + Array(44).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    console.log(`File "${file.name}" uploaded to IPFS with hash: ${mockCID}`);
    return mockCID;
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw new Error("Failed to upload file to IPFS");
  }
};

// Function to get a file from IPFS and open it in a new tab
export const viewIPFS = (cid: string): void => {
  const ipfsUrl = getIPFSUrl(cid);
  window.open(ipfsUrl, '_blank');
};

// Function to download a file from IPFS
export const downloadFromIPFS = async (cid: string, filename: string = 'certificate.pdf'): Promise<void> => {
  try {
    const ipfsUrl = getIPFSUrl(cid);
    
    // Fetch the file from IPFS gateway
    const response = await fetch(ipfsUrl);
    const blob = await response.blob();
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Error downloading from IPFS:", error);
    throw new Error("Failed to download file from IPFS");
  }
};

// Get a file URL from IPFS gateway
export const getIPFSUrl = (cid: string): string => {
  return `https://ipfs.io/ipfs/${cid}`;
};
