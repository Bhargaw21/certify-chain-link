
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useWeb3 } from '@/context/Web3Context';
import { getLinkedStudents } from '@/utils/contracts';
import { Loader2, User, Mail, RefreshCw, FileText, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';

const LinkedStudents: React.FC = () => {
  const { signer, account } = useWeb3();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const { needsRefresh, resetRefreshFlag } = useRealTimeUpdates();

  const loadStudents = async () => {
    if (!signer) return;
    
    try {
      setLoading(true);
      const linkedStudents = await getLinkedStudents(signer);
      setStudents(linkedStudents);
    } catch (error) {
      console.error("Error loading linked students:", error);
      toast({
        title: "Failed to load students",
        description: "Could not load your linked students. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      resetRefreshFlag();
    }
  };

  useEffect(() => {
    if (signer) {
      loadStudents();
    }
  }, [signer]);

  // Listen for real-time updates that might affect the student list
  useEffect(() => {
    if (needsRefresh) {
      loadStudents();
    }
  }, [needsRefresh]);

  const handleToggleDetails = (address: string) => {
    if (selectedStudent === address) {
      setSelectedStudent(null);
    } else {
      setSelectedStudent(address);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Students</CardTitle>
          <CardDescription>
            Students currently linked to your institute
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadStudents}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No students linked to your institute yet
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student, index) => (
              <div 
                key={index} 
                className="border rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
              >
                <div 
                  className="flex items-center p-4 cursor-pointer"
                  onClick={() => handleToggleDetails(student.address)}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{student.name || 'Unnamed Student'}</p>
                    <p className="text-sm text-gray-500 truncate">{student.address}</p>
                  </div>
                  {student.certificateCount !== undefined && (
                    <Badge variant="outline" className="ml-2">
                      <FileText className="h-3 w-3 mr-1" /> {student.certificateCount} Certs
                    </Badge>
                  )}
                </div>
                
                {selectedStudent === student.address && (
                  <div className="bg-gray-50 p-4 border-t">
                    <div className="text-sm">
                      <div className="flex items-center mb-3">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          {student.email || 'No email available'}
                        </span>
                      </div>
                      
                      {student.instituteJoinDate && (
                        <div className="flex items-center mb-3">
                          <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">
                            Joined: {new Date(student.instituteJoinDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      <div className="mt-2">
                        <p className="text-gray-600">
                          <span className="font-medium text-gray-700">Wallet Address:</span>{' '}
                          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs break-all">
                            {student.address}
                          </code>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LinkedStudents;
