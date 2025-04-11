
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useWeb3 } from '@/context/Web3Context';
import { getLinkedStudents } from '@/utils/contracts';
import { Loader2, User, Mail, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentListProps {
  onRefresh?: () => void;
}

const StudentList: React.FC<StudentListProps> = ({ onRefresh }) => {
  const { signer } = useWeb3();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

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
    }
  };

  useEffect(() => {
    if (signer) {
      loadStudents();
    }
  }, [signer]);

  const handleViewStudentDetails = (studentId: string) => {
    setSelectedStudentId(studentId === selectedStudentId ? null : studentId);
  };

  const handleRefresh = () => {
    loadStudents();
    if (onRefresh) onRefresh();
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
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          Refresh
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
          <div className="space-y-4">
            {students.map((student, index) => (
              <div 
                key={index} 
                className="border rounded-lg overflow-hidden"
              >
                <div 
                  className="flex items-center p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleViewStudentDetails(student.id || index.toString())}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{student.name || 'Unnamed Student'}</p>
                    <p className="text-sm text-gray-500 truncate">{student.address}</p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {student.certificateCount || 0} Certificates
                  </Badge>
                </div>
                
                {selectedStudentId === (student.id || index.toString()) && (
                  <div className="bg-gray-50 p-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Contact Information</h4>
                    {student.email ? (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Mail className="h-4 w-4 mr-2" />
                        {student.email}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mb-2">No email available</div>
                    )}
                    
                    <h4 className="text-sm font-medium mb-2 mt-3">Blockchain Address</h4>
                    <div className="flex items-center text-sm text-gray-600">
                      <Key className="h-4 w-4 mr-2" />
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">{student.address}</code>
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

export default StudentList;
