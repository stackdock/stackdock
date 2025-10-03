import { getGridPaneBundlesList } from "@/lib/gridpane/bundles/getGridpaneBundlesList";
import { BundlesResponse } from "@/lib/gridpane/bundles/types";

// Dynamic Rendering declaration
export const dynamic = 'force-dynamic';

export default async function GridPaneBundlesPage() {
    let bundlesData: BundlesResponse | null = null;
    let fetchError: string | null = null;

    try {
        // server action (no pagination for bundles endpoint)
        bundlesData = await getGridPaneBundlesList();
    } catch (error) {
        console.error(`Error fetching GridPane Bundles:`, error);
        if (error instanceof Error) {
            fetchError = error.message;
        } else {
            fetchError = "An error occurred while fetching data.";
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">GridPane Bundles API Test</h1>

            {fetchError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {fetchError}
                </div>
            )}

            {bundlesData && (
                <div className="space-y-4">
                    {bundlesData._metadata && (
                        <div className="p-4 rounded">
                            <h2 className="font-semibold text-lg mb-2">API Response Metadata</h2>
                            <p><strong>Fetched At:</strong> {new Date(bundlesData._metadata.fetched_at).toLocaleString()}</p>
                            <p><strong>Cached Until:</strong> {bundlesData._metadata.cached_until ? new Date(bundlesData._metadata.cached_until).toLocaleString() : 'Not cached'}</p>
                            <p><strong>Request Duration:</strong> {bundlesData._metadata.request_duration_ms}ms</p>
                            <p><strong>API Version:</strong> {bundlesData._metadata.api_version}</p>
                        </div>
                    )}

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Bundles Summary</h2>
                        <p><strong>Total Bundles:</strong> {bundlesData.bundles.length}</p>
                        <p><strong>Available Bundle Types:</strong> {bundlesData.bundles.map(bundle => bundle.name).join(', ')}</p>
                    </div>

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Bundle Details</h2>
                        {bundlesData.bundles.length > 0 ? (
                            <div className="space-y-2">
                                {bundlesData.bundles.map(bundle => (
                                    <div key={bundle.id} className="p-3 rounded border">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p><strong>Name:</strong> {bundle.name}</p>
                                                <p className="text-sm"><strong>ID:</strong> {bundle.id}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="px-2 py-1 rounded text-sm">
                                                    Bundle
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No bundles available</p>
                        )}
                    </div>

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Full Bundles Data</h2>
                        <pre className="p-4 rounded border overflow-auto max-h-96 text-xs">
                            {JSON.stringify(bundlesData, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
