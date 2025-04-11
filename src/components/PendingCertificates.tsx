
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useWeb3 } from '@/context/Web3Context';
import { getPendingCertificates, approveCertificate } from '@/utils/contracts';
import { viewIPFS } from '@/utils/ipfs';
import { Check, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const PendingCertificates: React.FC = () => {
  const { signer } = useWeb3();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadCertificates = async () => {
    if (!signer) return;
    
    try {
      setLoading(true);
      const pendingCertificates = await getPendingCertificates(signer);
      setCertificates(pendingCertificates);
    } catch (error) {
      console.error("Error loading pending certificates:", error);
      toast({
        title: "Failed to load certificates",
        description: "Could not load pending certificates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (signer) {
      loadCertificates();
    }
  }, [signer]);

  const handleApprove = async (certificateId: string) => {
    if (!signer) return;
    
    try {
      setApprovingId(certificateId);
      const result = await approveCertificate(signer, certificateId);
      
      if (result) {
        toast({
          title: "Certificate approved",
          description: "The certificate has been successfully approved.",
        });
        
        // Refresh the list
        loadCertificates();
      } else {
        throw new Error("Failed to approve certificate");
      }
    } catch (error: any) {
      console.error("Error approving certificate:", error);
      toast({
        title: "Approval failed",
        description: error.message || "There was an error approving the certificate",
        variant: "destructive",
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleViewCertificate = (ipfsHash: string) => {
    viewIPFS(ipfsHash);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pending Certificates</CardTitle>
        <CardDescription>
          Review and approve pending certificates for your students
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending certificates found
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <div key={cert.id} className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <h4 className="font-medium">{cert.studentName || 'Unknown Student'}</h4>
                  <p className="text-sm text-gray-500 truncate">{cert.studentAddress}</p>
                  <p className="text-xs text-gray-400">
                    Uploaded: {format(new Date(cert.timestamp), 'PPpp')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewCertificate(cert.ipfsHash)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleApprove(cert.id)}
                    disabled={approvingId === cert.id}
                  >
                    {approvingId === cert.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingCertificates;
