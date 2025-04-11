
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import FileUpload from '@/components/FileUpload';
import { uploadToIPFS } from '@/utils/ipfs';
import { uploadCertificate } from '@/utils/contracts';
import { useWeb3 } from '@/context/Web3Context';
import { Loader2 } from 'lucide-react';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';

interface CertificateUploadProps {
  onSuccess?: () => void;
}

const CertificateUpload: React.FC<CertificateUploadProps> = ({ onSuccess }) => {
  const [studentAddress, setStudentAddress] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { signer, account } = useWeb3();
  const { triggerRefresh } = useRealTimeUpdates();

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!studentAddress) {
      toast({
        title: "Student address required",
        description: "Please enter a student's Ethereum address",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a certificate to upload",
        variant: "destructive",
      });
      return;
    }

    if (!signer) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to upload a certificate",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // First upload to IPFS
      const ipfsHash = await uploadToIPFS(selectedFile);
      console.log("File uploaded to IPFS with hash:", ipfsHash);
      
      // Then register on blockchain/database
      const result = await uploadCertificate(signer, studentAddress, ipfsHash);
      
      if (result) {
        toast({
          title: "Certificate uploaded successfully",
          description: "The certificate has been uploaded and is pending approval",
        });
        
        // Trigger refresh to update other components
        triggerRefresh();
        
        // Reset form
        setStudentAddress('');
        setSelectedFile(null);
        
        // Call success callback if provided
        if (onSuccess) onSuccess();
      } else {
        throw new Error("Failed to upload certificate");
      }
    } catch (error: any) {
      console.error("Error uploading certificate:", error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading the certificate",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Upload Certificate</CardTitle>
        <CardDescription>
          Upload a certificate for a student by providing their Ethereum address and the certificate file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="studentAddress" className="text-sm font-medium">
            Student Ethereum Address
          </label>
          <Input
            id="studentAddress"
            placeholder="0x..."
            value={studentAddress}
            onChange={(e) => setStudentAddress(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Certificate PDF</label>
          <FileUpload
            onFileSelected={handleFileSelected}
            accept=".pdf"
            maxSize={5 * 1024 * 1024} // 5MB
            label="Upload Certificate PDF"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleUpload} 
          disabled={isUploading || !selectedFile || !studentAddress}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload Certificate"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CertificateUpload;
