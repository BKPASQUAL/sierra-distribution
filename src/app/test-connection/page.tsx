'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function TestConnection() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [message, setMessage] = useState('')
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient()
        
        // Test connection by fetching products
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(5)

        if (error) {
          setStatus('error')
          setMessage(`Error: ${error.message}`)
        } else {
          setStatus('connected')
          setMessage('✅ Successfully connected to Supabase!')
          setProducts(data || [])
        }
      } catch (error) {
        setStatus('error')
        setMessage(`Connection failed: ${error}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Supabase Connection Test
        </h1>
        
        <div className={`p-6 rounded-lg mb-8 ${
          status === 'checking' ? 'bg-blue-100 border border-blue-300' :
          status === 'connected' ? 'bg-green-100 border border-green-300' :
          'bg-red-100 border border-red-300'
        }`}>
          <h2 className="text-xl font-semibold mb-2">
            {status === 'checking' ? '🔄 Checking connection...' :
             status === 'connected' ? '✅ Connected' :
             '❌ Connection Error'}
          </h2>
          <p className="text-gray-700">{message}</p>
        </div>

        {status === 'connected' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              Products in Database
            </h2>
            {products.length === 0 ? (
              <p className="text-gray-500">
                No products found. Add some products to your database!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${product.unit_price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.stock_quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              Troubleshooting
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Check if your .env.local file exists with correct values</li>
              <li>Verify NEXT_PUBLIC_SUPABASE_URL is set correctly</li>
              <li>Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is set correctly</li>
              <li>Make sure you created the products table in Supabase</li>
              <li>Restart your Next.js dev server after adding env variables</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}