import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// CORS headers to allow requests from any origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface IpfsUploadRequest {
  file: string; // base64 encoded file
  fileName: string;
  fileType: string;
}

interface IpfsVerifyRequest {
  ipfsHash: string;
}

// Keep track of IPFS uploads for the session (mock database)
const ipfsUploads = new Map();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.split('/')
    const action = path[path.length - 1]

    if (req.method === 'POST') {
      const body = await req.json()

      if (action === 'upload') {
        const { file, fileName, fileType } = body as IpfsUploadRequest

        if (!file || !fileName) {
          return new Response(
            JSON.stringify({
              error: 'Missing required fields: file and fileName are required',
            }),
            {
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
              status: 400,
            }
          )
        }

        // Simulate IPFS upload with delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Generate a mock IPFS hash (CID)
        const mockCID = 'Qm' + Array(44).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')

        // Store the file info in our mock database
        ipfsUploads.set(mockCID, {
          fileName,
          fileType: fileType || 'application/pdf',
          uploadedAt: new Date().toISOString(),
        })

        return new Response(
          JSON.stringify({
            success: true,
            ipfsHash: mockCID,
            fileName,
          }),
          {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 200,
          }
        )
      } else if (action === 'verify') {
        const { ipfsHash } = body as IpfsVerifyRequest

        if (!ipfsHash) {
          return new Response(
            JSON.stringify({
              error: 'Missing required field: ipfsHash',
            }),
            {
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
              status: 400,
            }
          )
        }

        // Simulate verification with delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Check if the hash is in our mock database or if it starts with Qm and has the right length
        const isStored = ipfsUploads.has(ipfsHash)
        const isValidFormat = ipfsHash.startsWith('Qm') && ipfsHash.length === 46

        return new Response(
          JSON.stringify({
            success: true,
            isValid: isStored || isValidFormat,
            timestamp: new Date().toISOString(),
            fileInfo: isStored ? ipfsUploads.get(ipfsHash) : null,
          }),
          {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 200,
          }
        )
      }
    } else if (req.method === 'GET') {
      if (action === 'list') {
        // Return list of mock uploads
        const uploads = Array.from(ipfsUploads.entries()).map(([hash, info]) => ({
          ipfsHash: hash,
          ...info,
        }))

        return new Response(
          JSON.stringify({
            success: true,
            uploads,
          }),
          {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 200,
          }
        )
      }
    }

    return new Response(
      JSON.stringify({
        error: 'Invalid endpoint or method',
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 400,
      }
    )
  } catch (error) {
    console.error('Error processing request:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred processing your request',
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      }
    )
  }
})
