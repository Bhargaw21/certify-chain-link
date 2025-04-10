
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// CORS headers to allow requests from any origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface BlockchainRequest {
  action: string;
  params: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  // Create a Supabase client with the Auth context of the logged in user
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  )

  try {
    if (req.method === 'POST') {
      const { action, params } = await req.json() as BlockchainRequest

      // Simulate blockchain operations
      if (action === 'verify-signature') {
        const { message, signature, address } = params

        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Mock verification - in a real scenario, we would use ethers.js to verify
        const isValid = message && signature && address

        return new Response(
          JSON.stringify({
            success: true,
            isValid,
            timestamp: new Date().toISOString(),
          }),
          {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 200,
          }
        )
      } else if (action === 'get-transaction') {
        const { txHash } = params

        // Simulate blockchain query
        await new Promise(resolve => setTimeout(resolve, 800))

        // Mock transaction data
        const mockTx = {
          hash: txHash || '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          blockNumber: Math.floor(Math.random() * 1000000),
          from: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          to: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          timestamp: new Date().toISOString(),
          status: 'confirmed',
        }

        return new Response(
          JSON.stringify({
            success: true,
            transaction: mockTx,
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
