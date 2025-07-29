import { getGridPaneBackupIntegrations } from "@/lib/gridpane/backups/getGridpaneBackupIntegrations";
import { BackupIntegrationsResponse, BACKUP_SERVICE_INFO } from "@/lib/gridpane/backups/types";

// Dynamic Rendering declaration
export const dynamic = 'force-dynamic';

export default async function GridPaneBackupIntegrationsPage() {
    console.log(`[PAGE.TSX | TOP] Loading GridPane Backup Integrations page`);

    let backupData: BackupIntegrationsResponse | null = null;
    let fetchError: string | null = null;

    try {
        // server action (no pagination for backup integrations endpoint)
        backupData = await getGridPaneBackupIntegrations();
    } catch (error) {
        console.error(`Error fetching GridPane Backup Integrations:`, error);
        if (error instanceof Error) {
            fetchError = error.message;
        } else {
            fetchError = "An error occurred while fetching data.";
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">GridPane Backup Integrations API Test</h1>
            
            {fetchError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {fetchError}
                </div>
            )}

            {backupData && (
                <div className="space-y-4">
                    {backupData._metadata && (
                        <div className="p-4 rounded">
                            <h2 className="font-semibold text-lg mb-2">API Response Metadata</h2>
                            <p><strong>Fetched At:</strong> {new Date(backupData._metadata.fetched_at).toLocaleString()}</p>
                            <p><strong>Cached Until:</strong> {backupData._metadata.cached_until ? new Date(backupData._metadata.cached_until).toLocaleString() : 'Not cached'}</p>
                            <p><strong>Request Duration:</strong> {backupData._metadata.request_duration_ms}ms</p>
                            <p><strong>API Version:</strong> {backupData._metadata.api_version}</p>
                        </div>
                    )}
                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Integrations Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 rounded border text-center">
                                <div className="text-2xl font-bold">{backupData.integrations.length}</div>
                                <div className="text-sm">Total Integrations</div>
                            </div>
                            <div className="p-3 rounded border text-center">
                                <div className="text-2xl font-bold">
                                    {new Set(backupData.integrations.map(i => i.integrated_service)).size}
                                </div>
                                <div className="text-sm">Unique Services</div>
                            </div>
                            <div className="p-3 rounded border text-center">
                                <div className="text-2xl font-bold">
                                    {new Set(backupData.integrations.map(i => i.region)).size}
                                </div>
                                <div className="text-sm">Regions</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Backup Integrations</h2>
                        {backupData.integrations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {backupData.integrations.map(integration => {
                                    const serviceInfo = BACKUP_SERVICE_INFO[integration.integrated_service as keyof typeof BACKUP_SERVICE_INFO] || {
                                        name: integration.integrated_service,
                                        color: 'bg-gray-100 text-gray-800',
                                        icon: '💾'
                                    };

                                    return (
                                        <div key={integration.id} className="p-4 rounded border">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <h3 className="font-bold">{integration.integration_name}</h3>
                                                        <p className="text-sm">ID: {integration.id}</p>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-1 rounded text-xs font-medium">
                                                    {serviceInfo.name}
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="grid grid-cols-1 gap-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium">Service:</span>
                                                        <span className="text-sm">{integration.integrated_service}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium">Region:</span>
                                                        <span className="text-sm">{integration.region}</span>
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-t">
                                                    <h4 className="text-sm font-semibold mb-1">Credentials</h4>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs">Token:</span>
                                                            <span className="text-xs font-mono px-2 py-1 rounded">
                                                                {integration.token.substring(0, 8)}...
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs">Secret:</span>
                                                            <span className="text-xs font-mono px-2 py-1 rounded">
                                                                {integration.secret_token.substring(0, 8)}...
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-2">📦</div>
                                <p className="text-gray-500">No backup integrations configured</p>
                                <p className="text-sm text-gray-400 mt-1">Add integrations to enable automated backups</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Service Distribution</h2>
                        <div className="space-y-2">
                            {Object.entries(
                                backupData.integrations.reduce((acc, integration) => {
                                    acc[integration.integrated_service] = (acc[integration.integrated_service] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>)
                            ).map(([service, count]) => {
                                const serviceInfo = BACKUP_SERVICE_INFO[service as keyof typeof BACKUP_SERVICE_INFO] || {
                                    name: service,
                                    color: 'bg-gray-100 text-gray-800',
                                    icon: '💾'
                                };
                                
                                return (
                                    <div key={service} className="flex items-center justify-between p-2 rounded border">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{serviceInfo.name}</span>
                                        </div>
                                        <span className="px-2 py-1 rounded text-sm">
                                            {count} integration{count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Full Backup Integrations Data</h2>
                        <pre className="p-4 rounded border overflow-auto max-h-96 text-xs">
                            {JSON.stringify(backupData, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
