
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useWeb3 } from '@/context/Web3Context';
import { getStudentCertificates, getPendingCertificates, approveCertificate } from '@/utils/contracts';
import { viewIPFS } from '@/utils/ipfs';
import { Eye, CheckCircle, Clock, FileText, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface CertificateListProps {
  mode?: 'student' | 'institute';
  studentAddress?: string;
  showPending?: boolean;
  onRefresh?: () => void;
}

const CertificateList: React.FC<CertificateListProps> = ({ 
  mode = 'student', 
  studentAddress,
  showPending = false,
  onRefresh
}) => {
  const { account, signer } = useWeb3();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadCertificates = async () => {
    if (!signer) return;
    
    try {
      setLoading(true);
      let certs;
      
      if (mode === 'student') {
        // Load certificates for a student (either the current user or a specified student)
        const address = studentAddress || account;
        if (!address) {
          throw new Error("No address available");
        }
        certs = await getStudentCertificates(signer, address);
      } else if (showPending) {
        // Load pending certificates for the institute
        certs = await getPendingCertificates(signer);
      } else {
        // Load all approved certificates for the institute's students
        // This would need to be implemented in contracts.ts
        certs = [];
      }
      
      setCertificates(certs);
    } catch (error) {
      console.error("Error loading certificates:", error);
      toast({
        title: "Failed to load certificates",
        description: "Could not load certificates. Please try again.",
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
  }, [signer, mode, studentAddress, showPending]);

  const handleViewCertificate = (ipfsHash: string) => {
    viewIPFS(ipfsHash);
  };

  const handleApproveCertificate = async (certificateId: string) => {
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
        if (onRefresh) onRefresh();
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

  const getStatusBadge = (cert: any) => {
    if (cert.approved) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>;
    } else {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300 hover:bg-yellow-100">Pending</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>
            {mode === 'institute' && showPending 
              ? "Pending Certificates" 
              : mode === 'institute' 
                ? "All Certificates"
                : "Your Certificates"}
          </CardTitle>
          <CardDescription>
            {mode === 'institute' && showPending 
              ? "Review and approve pending certificates" 
              : mode === 'institute'
                ? "View all certificates issued by your institute"
                : "Certificates issued to you"}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={loadCertificates}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {mode === 'institute' && showPending 
              ? "No pending certificates found" 
              : "No certificates found"}
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <div key={cert.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <h4 className="font-medium">Certificate #{cert.id.substring(0, 8)}</h4>
                      {mode === 'institute' && (
                        <p className="text-sm text-gray-500">
                          {cert.studentName || 'Unknown Student'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {getStatusBadge(cert)}
                    {cert.timestamp && (
                      <span className="text-xs text-gray-500 ml-2 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(cert.timestamp), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewCertificate(cert.ipfsHash)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Certificate
                  </Button>
                  
                  {mode === 'institute' && showPending && !cert.approved && (
                    <Button 
                      size="sm"
                      onClick={() => handleApproveCertificate(cert.id)}
                      disabled={approvingId === cert.id}
                    >
                      {approvingId === cert.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificateList;
