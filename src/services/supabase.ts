import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { ethers } from 'ethers';

// Student Services
export const registerStudentInDB = async (address: string, name: string, email: string, instituteAddress: string) => {
  try {
    // First, find the institute by its address
    const { data: instituteData, error: instituteError } = await supabase
      .from('institutes')
      .select('id')
      .eq('address', instituteAddress)
      .single();

    if (instituteError && instituteError.code !== 'PGRST116') {
      console.error("Error finding institute:", instituteError);
      throw new Error("Failed to find institute");
    }

    let instituteId = instituteData?.id;

    // If institute doesn't exist, create it with a placeholder name/email
    if (!instituteId) {
      const { data: newInstitute, error: createError } = await supabase
        .from('institutes')
        .insert({
          address: instituteAddress,
          name: `Institute (${instituteAddress.substring(0, 6)}...)`,
          email: `institute-${instituteAddress.substring(0, 6)}@placeholder.com`
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating institute:", createError);
        throw new Error("Failed to create institute");
      }

      instituteId = newInstitute?.id;
    }

    // Check if student already exists
    const { data: existingStudent, error: checkError } = await supabase
      .from('students')
      .select('id')
      .eq('address', address)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking if student exists:", checkError);
      throw new Error("Failed to check student existence");
    }

    if (existingStudent) {
      // Update existing student
      const { error: updateError } = await supabase
        .from('students')
        .update({
          name,
          email,
          current_institute_id: instituteId
        })
        .eq('address', address);

      if (updateError) {
        console.error("Error updating student:", updateError);
        throw new Error("Failed to update student");
      }

      return existingStudent.id;
    } else {
      // Create new student
      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert({
          address,
          name,
          email,
          current_institute_id: instituteId
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating student:", createError);
        throw new Error("Failed to create student");
      }

      return newStudent?.id;
    }
  } catch (error) {
    console.error("Error in registerStudentInDB:", error);
    throw error;
  }
};

export const getStudentByAddress = async (address: string) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        institute:current_institute_id(id, name, address, email),
        requested_institute:requested_institute_id(id, name, address, email)
      `)
      .eq('address', address)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error getting student:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getStudentByAddress:", error);
    throw error;
  }
};

// Institute Services
export const registerInstituteInDB = async (address: string, name: string, email: string) => {
  try {
    console.log("Registering institute in DB:", { address, name, email });
    
    // Check if institute already exists
    const { data: existingInstitute, error: checkError } = await supabase
      .from('institutes')
      .select('id')
      .eq('address', address)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking if institute exists:", checkError);
      throw new Error("Failed to check institute existence");
    }

    if (existingInstitute) {
      console.log("Institute already exists, updating record");
      // Update existing institute
      const { error: updateError } = await supabase
        .from('institutes')
        .update({ name, email })
        .eq('address', address);

      if (updateError) {
        console.error("Error updating institute:", updateError);
        throw new Error("Failed to update institute");
      }

      return existingInstitute.id;
    } else {
      console.log("Creating new institute record");
      // Create new institute
      const { data: newInstitute, error: createError } = await supabase
        .from('institutes')
        .insert({ address, name, email })
        .select()
        .single();

      if (createError) {
        console.error("Error creating institute:", createError);
        throw new Error("Failed to create institute");
      }

      console.log("Institute created successfully:", newInstitute);
      return newInstitute.id;
    }
  } catch (error) {
    console.error("Error in registerInstituteInDB:", error);
    throw error;
  }
};

export const getInstituteByAddress = async (address: string) => {
  try {
    const { data, error } = await supabase
      .from('institutes')
      .select('*')
      .eq('address', address)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error getting institute:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getInstituteByAddress:", error);
    throw error;
  }
};

export const getStudentsForInstitute = async (instituteId: string) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('current_institute_id', instituteId);

    if (error) {
      console.error("Error getting students for institute:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getStudentsForInstitute:", error);
    throw error;
  }
};

// Certificate Services
export const uploadCertificateToDb = async (studentId: string, instituteId: string, ipfsHash: string) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .insert({
        student_id: studentId,
        institute_id: instituteId,
        ipfs_hash: ipfsHash,
        is_approved: false
      })
      .select()
      .single();

    if (error) {
      console.error("Error uploading certificate:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in uploadCertificateToDb:", error);
    throw error;
  }
};

export const approveCertificateInDb = async (certificateId: string) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .update({ is_approved: true })
      .eq('id', certificateId)
      .select()
      .single();

    if (error) {
      console.error("Error approving certificate:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in approveCertificateInDb:", error);
    throw error;
  }
};

export const getCertificatesForStudent = async (studentId: string) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        institute:institute_id(id, name, address)
      `)
      .eq('student_id', studentId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error("Error getting certificates for student:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getCertificatesForStudent:", error);
    throw error;
  }
};

export const getPendingCertificatesForInstitute = async (instituteId: string) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        student:student_id(id, name, address, email)
      `)
      .eq('institute_id', instituteId)
      .eq('is_approved', false);

    if (error) {
      console.error("Error getting pending certificates:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getPendingCertificatesForInstitute:", error);
    throw error;
  }
};

// Access Management Services
export const grantAccessInDb = async (certificateId: string, viewerAddress: string, grantedBy: string, durationInHours: number) => {
  try {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + durationInHours);

    const { data, error } = await supabase
      .from('access_grants')
      .insert({
        certificate_id: certificateId,
        viewer_address: viewerAddress,
        granted_by: grantedBy,
        expiry: expiryDate.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Error granting access:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in grantAccessInDb:", error);
    throw error;
  }
};

export const logAccessInDb = async (certificateId: string, viewerAddress: string) => {
  try {
    const { data, error } = await supabase
      .from('access_logs')
      .insert({
        certificate_id: certificateId,
        viewer_address: viewerAddress
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging access:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in logAccessInDb:", error);
    throw error;
  }
};

export const getAccessLogsForCertificate = async (certificateId: string) => {
  try {
    const { data, error } = await supabase
      .from('access_logs')
      .select('*')
      .eq('certificate_id', certificateId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error("Error getting access logs:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAccessLogsForCertificate:", error);
    throw error;
  }
};

// Institute Change Services
export const requestInstituteChangeInDb = async (studentId: string, currentInstituteId: string, requestedInstituteId: string) => {
  try {
    // Update the student's requested_institute_id
    const { error: updateError } = await supabase
      .from('students')
      .update({ requested_institute_id: requestedInstituteId })
      .eq('id', studentId);

    if (updateError) {
      console.error("Error updating student's requested institute:", updateError);
      throw updateError;
    }

    // Create a change request record
    const { data, error } = await supabase
      .from('institute_change_requests')
      .insert({
        student_id: studentId,
        current_institute_id: currentInstituteId,
        requested_institute_id: requestedInstituteId
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating institute change request:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in requestInstituteChangeInDb:", error);
    throw error;
  }
};

export const approveInstituteChangeInDb = async (requestId: string, studentId: string, newInstituteId: string) => {
  try {
    // Update the change request status
    const { error: requestError } = await supabase
      .from('institute_change_requests')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (requestError) {
      console.error("Error updating change request:", requestError);
      throw requestError;
    }

    // Update the student's institute
    const { error: studentError } = await supabase
      .from('students')
      .update({
        current_institute_id: newInstituteId,
        requested_institute_id: null
      })
      .eq('id', studentId);

    if (studentError) {
      console.error("Error updating student institute:", studentError);
      throw studentError;
    }

    return true;
  } catch (error) {
    console.error("Error in approveInstituteChangeInDb:", error);
    throw error;
  }
};

export const getPendingInstituteChangeRequests = async (instituteId: string) => {
  try {
    const { data, error } = await supabase
      .from('institute_change_requests')
      .select(`
        *,
        student:student_id(id, name, address, email)
      `)
      .eq('requested_institute_id', instituteId)
      .eq('status', 'pending');

    if (error) {
      console.error("Error getting pending institute change requests:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getPendingInstituteChangeRequests:", error);
    throw error;
  }
};

// Real-time subscriptions
export const subscribeToCertificates = (instituteId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('certificate-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'certificates',
        filter: `institute_id=eq.${instituteId}`
      },
      callback
    )
    .subscribe();
};

export const subscribeToInstituteChangeRequests = (instituteId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('institute-change-requests')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'institute_change_requests',
        filter: `requested_institute_id=eq.${instituteId}`
      },
      callback
    )
    .subscribe();
};

export const subscribeToStudentCertificates = (studentId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('student-certificates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'certificates',
        filter: `student_id=eq.${studentId}`
      },
      callback
    )
    .subscribe();
};

// Helpers to convert between blockchain and database
export const getStudentIdFromAddress = async (address: string) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('address', address)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error getting student ID:", error);
      throw error;
    }

    return data?.id;
  } catch (error) {
    console.error("Error in getStudentIdFromAddress:", error);
    throw error;
  }
};

export const getInstituteIdFromAddress = async (address: string) => {
  try {
    const { data, error } = await supabase
      .from('institutes')
      .select('id')
      .eq('address', address)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error getting institute ID:", error);
      throw error;
    }

    return data?.id;
  } catch (error) {
    console.error("Error in getInstituteIdFromAddress:", error);
    throw error;
  }
};
