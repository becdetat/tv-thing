'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleReset = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/db/reset', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset database');
      }
      
      setMessage('Database reset successfully');
    } catch (error) {
      setMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin</h1>
          <Link 
            href="/"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Home
          </Link>
        </div>
        
        <div className="mb-8">
          <button
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Reset Database
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
      </div>
    </main>
  );
} 