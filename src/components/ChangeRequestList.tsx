
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useWeb3 } from '@/context/Web3Context';
import { getPendingInstituteChangeRequests, approveInstituteChange } from '@/utils/contracts';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface ChangeRequestListProps {
  onRefresh?: () => void;
}

const ChangeRequestList: React.FC<ChangeRequestListProps> = ({ onRefresh }) => {
  const { signer } = useWeb3();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!signer) return;
    
    try {
      setLoading(true);
      const pendingRequests = await getPendingInstituteChangeRequests(signer);
      setRequests(pendingRequests);
    } catch (error) {
      console.error("Error loading change requests:", error);
      toast({
        title: "Failed to load requests",
        description: "Could not load pending change requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (signer) {
      loadRequests();
    }
  }, [signer]);

  const handleApprove = async (requestId: string, studentId: string) => {
    if (!signer) return;
    
    try {
      setProcessingId(requestId);
      const result = await approveInstituteChange(signer, requestId, studentId);
      
      if (result) {
        toast({
          title: "Request approved",
          description: "The institute change request has been approved.",
        });
        
        // Refresh the list
        loadRequests();
        if (onRefresh) onRefresh();
      } else {
        throw new Error("Failed to approve request");
      }
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast({
        title: "Approval failed",
        description: error.message || "There was an error approving the request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Institute Change Requests</CardTitle>
          <CardDescription>
            Students requesting to join your institute
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={loadRequests}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending institute change requests
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.requestId} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{request.studentName || 'Unknown Student'}</h4>
                    <p className="text-sm text-gray-500 truncate">
                      {request.studentAddress}
                    </p>
                  </div>
                  <Badge variant="outline" className="mt-2 md:mt-0 w-fit">
                    Transfer Request
                  </Badge>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <Button 
                    variant="default"
                    onClick={() => handleApprove(request.requestId, request.studentId)}
                    disabled={processingId === request.requestId}
                  >
                    {processingId === request.requestId ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    <XCircle className="h-4 w-4 mr-1" />
                    Decline
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

export default ChangeRequestList;
