"use client";

import { useEffect, useRef, useState, useTransition } from 'react';
import { updateSitePhpVersion } from '@/lib/gridpane/sites/updateSitePhpVersion';
import { AVAILABLE_PHP_VERSIONS, PhpVersion } from '@/lib/gridpane/sites/types';

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
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [optimisticVersion, setOptimisticVersion] = useState<string>(currentPhpVersion);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((previous) => (previous > 1 ? previous - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmittingRef.current || isPending) {
      console.log('[PHP VERSION SELECTOR] Submission already in progress, ignoring...');
      return;
    }

    if (cooldownSeconds > 0) {
      setMessage({
        type: 'warning',
        text: `GridPane rate limit in effect. Please wait ${cooldownSeconds}s before updating again.`
      });
      return;
    }

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

    // Set submission flag
    isSubmittingRef.current = true;

    // Optimistic update
    setOptimisticVersion(selectedVersion);

    console.log(`[PHP VERSION SELECTOR] Starting update for site ${siteId} to PHP ${selectedVersion}`);

    startTransition(async () => {
      try {
        const result = await updateSitePhpVersion(siteId, selectedVersion);

        if (result.success) {
          setMessage({
            type: 'success',
            text: result.message
          });
          setSelectedVersion(''); // Reset form
          setCooldownSeconds(0);
        } else {
          // Revert optimistic update on failure
          setOptimisticVersion(currentPhpVersion);

          // Special handling for rate limits
          if (result.error === 'RATE_LIMITED') {
            if (typeof result.waitSeconds === 'number') {
              setCooldownSeconds(result.waitSeconds);
            }
            setMessage({
              type: 'warning',
              text: `⏳ ${result.message}`
            });
          } else {
            setMessage({
              type: 'error',
              text: result.message
            });
          }
        }
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticVersion(currentPhpVersion);
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
      } finally {
        // Reset submission flag
        isSubmittingRef.current = false;
      }
    });
  };

  const isVersionChanged = optimisticVersion !== currentPhpVersion;
  const isSubmitDisabled =
    isPending ||
    isSubmittingRef.current ||
    !selectedVersion ||
    selectedVersion === currentPhpVersion ||
    cooldownSeconds > 0;

  return (
    <div className="bg-card border border-border p-4 rounded-lg">
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-card-foreground">
        <span>🐘</span>
        PHP Version Management
      </h3>

      <div className="mb-3 space-y-2">
        <p className="text-sm text-muted-foreground">
          <strong>Site:</strong> {siteName}
        </p>
        <p className="text-sm text-card-foreground">
          <strong>Current PHP Version:</strong>
          <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
            isVersionChanged
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}>
            {optimisticVersion}
            {isVersionChanged && (
              <span className="ml-1 text-xs">(updating...)</span>
            )}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          ⚠️ Note: GridPane allows only 2 PHP version changes per minute across your account. You may need to wait for the cooldown to expire before updating another site.
        </p>
        {cooldownSeconds > 0 && (
          <p className="text-xs text-orange-600 dark:text-orange-300">
            ⏳ GridPane cooldown active — {cooldownSeconds}s remaining.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="php-version" className="block text-sm font-medium text-card-foreground mb-2">
            Select New PHP Version:
          </label>
          <select
            id="php-version"
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value as PhpVersion)}
            disabled={isPending || isSubmittingRef.current || cooldownSeconds > 0}
            className="block w-full px-3 py-2 border border-border bg-background text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted disabled:cursor-not-allowed"
          >
            <option value="">Choose PHP version...</option>
            {AVAILABLE_PHP_VERSIONS.map((version: PhpVersion) => (
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
            disabled={isSubmitDisabled}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {(isPending || isSubmittingRef.current) ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
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
            <span className="text-sm text-muted-foreground">
              Will change from PHP {currentPhpVersion} → {selectedVersion}
            </span>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-md text-sm border ${
            message.type === 'success'
              ? 'bg-card text-card-foreground border-border'
              : message.type === 'warning'
              ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0">
                {message.type === 'success' ? '✅' : message.type === 'warning' ? '⚠️' : '❌'}
              </span>
              <div className="flex-1">{message.text}</div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
