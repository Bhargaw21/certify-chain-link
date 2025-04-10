
import { supabase } from '@/integrations/supabase/client';

// Convert a file to a base64 string that can be sent to the edge function
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix
      const base64Content = base64String.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Function to upload a file to IPFS via Supabase edge function
export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    console.log(`Preparing to upload file "${file.name}" to IPFS...`);
    
    // Convert file to base64
    const base64File = await fileToBase64(file);
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ipfs-operations', {
      body: {
        action: 'upload',
        file: base64File,
        fileName: file.name,
        fileType: file.type
      }
    });
    
    if (error) {
      console.error("Error calling IPFS upload function:", error);
      throw new Error("Failed to upload file to IPFS");
    }
    
    console.log(`File "${file.name}" uploaded to IPFS with hash: ${data.ipfsHash}`);
    return data.ipfsHash;
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw new Error("Failed to upload file to IPFS");
  }
};

// Function to verify if a CID is valid via Supabase edge function
export const isValidCID = async (cid: string): Promise<boolean> => {
  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ipfs-operations', {
      body: {
        action: 'verify',
        ipfsHash: cid
      }
    });
    
    if (error) {
      console.error("Error verifying CID:", error);
      return false;
    }
    
    return data.isValid;
  } catch (error) {
    console.error("Error verifying CID:", error);
    return false;
  }
};

// Function to get a file URL from IPFS gateway
export const getIPFSUrl = (cid: string): string => {
  return `https://ipfs.io/ipfs/${cid}`;
};

// Function to get a file from IPFS and open it in a new tab
export const viewIPFS = (cid: string): void => {
  const ipfsUrl = getIPFSUrl(cid);
  console.log(`Opening IPFS file at: ${ipfsUrl}`);
  window.open(ipfsUrl, '_blank');
};

// Function to download a file from IPFS
export const downloadFromIPFS = async (cid: string, filename: string = 'certificate.pdf'): Promise<void> => {
  try {
    const ipfsUrl = getIPFSUrl(cid);
    console.log(`Downloading file from: ${ipfsUrl}`);
    
    // In a real implementation, we would fetch the file from IPFS
    // For the mock implementation, we'll create a dummy PDF blob
    const dummyPdfContent = "This is a mock certificate PDF file";
    const blob = new Blob([dummyPdfContent], { type: 'application/pdf' });
    
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
    
    console.log(`File downloaded as ${filename}`);
  } catch (error) {
    console.error("Error downloading from IPFS:", error);
    throw new Error("Failed to download file from IPFS");
  }
};
