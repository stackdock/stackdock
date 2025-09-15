"use client";

import { useState, useTransition } from 'react';
import { updateSitePhpVersion, AVAILABLE_PHP_VERSIONS, PhpVersion } from '@/lib/gridpane/sites/updateSitePhpVersion';

interface PhpVersionSelectorProps {
  siteId: number;
  siteName: string;
  currentPhpVersion: string;
}

export default function PhpVersionSelector({ 
  siteId, 
  siteName, 
  currentPhpVersion 
}: PhpVersionSelectorProps) {
  const [selectedVersion, setSelectedVersion] = useState<PhpVersion | ''>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [optimisticVersion, setOptimisticVersion] = useState<string>(currentPhpVersion);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVersion) {
      setMessage({ type: 'error', text: 'Please select a PHP version' });
      return;
    }

    if (selectedVersion === currentPhpVersion) {
      setMessage({ type: 'error', text: 'Selected version is the same as current version' });
      return;
    }

    // Clear previous messages
    setMessage(null);

    // Optimistic update
    setOptimisticVersion(selectedVersion);

    startTransition(async () => {
      try {
        const result = await updateSitePhpVersion(siteId, selectedVersion);
        
        if (result.success) {
          setMessage({ 
            type: 'success', 
            text: result.message 
          });
          setSelectedVersion(''); // Reset form
        } else {
          // Revert optimistic update on failure
          setOptimisticVersion(currentPhpVersion);
          setMessage({ 
            type: 'error', 
            text: result.message 
          });
        }
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticVersion(currentPhpVersion);
        setMessage({ 
          type: 'error', 
          text: error instanceof Error ? error.message : 'An unexpected error occurred' 
        });
      }
    });
  };

  const isVersionChanged = optimisticVersion !== currentPhpVersion;

  return (
    <div className="bg-purple-50 p-4 rounded border">
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <span>🐘</span>
        PHP Version Management
      </h3>
      
      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-1">
          <strong>Site:</strong> {siteName}
        </p>
        <p className="text-sm mb-2">
          <strong>Current PHP Version:</strong> 
          <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
            isVersionChanged 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {optimisticVersion}
            {isVersionChanged && (
              <span className="ml-1 text-xs">(updating...)</span>
            )}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="php-version" className="block text-sm font-medium text-gray-700 mb-2">
            Select New PHP Version:
          </label>
          <select
            id="php-version"
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value as PhpVersion)}
            disabled={isPending}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Choose PHP version...</option>
            {AVAILABLE_PHP_VERSIONS.map(version => (
              <option 
                key={version} 
                value={version}
                disabled={version === currentPhpVersion}
              >
                PHP {version}
                {version === currentPhpVersion && ' (current)'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending || !selectedVersion || selectedVersion === currentPhpVersion}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              <>
                <span>🔄</span>
                Update PHP Version
              </>
            )}
          </button>

          {selectedVersion && selectedVersion !== currentPhpVersion && (
            <span className="text-sm text-gray-600">
              Will change from PHP {currentPhpVersion} → {selectedVersion}
            </span>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <span>{message.type === 'success' ? '✅' : '❌'}</span>
              {message.text}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
