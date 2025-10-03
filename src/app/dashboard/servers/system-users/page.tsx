import { getGridPaneSystemUsersList } from "@/lib/gridpane/system-users/getGridpaneSystemUsersList";
import { SystemUsersResponse } from "@/lib/gridpane/system-users/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Dynamic Rendering declaration
export const dynamic = 'force-dynamic';

// Pass searchParams as a prop
interface GridPaneSystemUsersTestPageProps {
    searchParams: Promise<{
        page?: string;
    }>;
}

export default async function GridPaneSystemUsersPage({ searchParams }: GridPaneSystemUsersTestPageProps) {
    // Await searchParams before using it
    const resolvedSearchParams = await searchParams;

    let systemUsersData: SystemUsersResponse | null = null;
    let fetchError: string | null = null;

    const pageFromParams = resolvedSearchParams?.page;
    const currentPage = Number(pageFromParams) || 1;

    try {
        // server action
        systemUsersData = await getGridPaneSystemUsersList(currentPage);
    } catch (error) {
        console.error(`Error fetching GridPane System Users page ${currentPage}:`, error);
        if (error instanceof Error) {
            fetchError = error.message;
        } else {
            fetchError = "An error occurred while fetching data.";
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">GridPane System Users API Test (Page: {currentPage})</h1>

            {fetchError && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            {systemUsersData && (
                <div className="space-y-4">
                    {systemUsersData._metadata && (
                        <div className="p-4 rounded">
                            <h2 className="font-semibold text-lg mb-2">API Response Metadata</h2>
                            <p><strong>Fetched At:</strong> {new Date(systemUsersData._metadata.fetched_at).toLocaleString()}</p>
                            <p><strong>Cached Until:</strong> {systemUsersData._metadata.cached_until ? new Date(systemUsersData._metadata.cached_until).toLocaleString() : 'Not cached'}</p>
                            <p><strong>Request Duration:</strong> {systemUsersData._metadata.request_duration_ms}ms</p>
                            <p><strong>API Version:</strong> {systemUsersData._metadata.api_version}</p>
                        </div>
                    )}

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">API Response Summary</h2>
                        <p><strong>Total System Users:</strong> {systemUsersData.data.length}</p>
                        <p><strong>Current Page:</strong> {systemUsersData.meta.current_page}</p>
                        <p><strong>Total Pages:</strong> {systemUsersData.meta.last_page}</p>
                        <p><strong>Total Items:</strong> {systemUsersData.meta.total}</p>
                        <p><strong>Per Page:</strong> {systemUsersData.meta.per_page}</p>
                    </div>

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">System Users Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="p-3 rounded border">
                                <p><strong>Primary Users:</strong> {systemUsersData.data.filter(user => user.is_primary).length}</p>
                            </div>
                            <div className="p-3 rounded border">
                                <p><strong>SSH Access Enabled:</strong> {systemUsersData.data.filter(user => user.ssh_access).length}</p>
                            </div>
                            <div className="p-3 rounded border">
                                <p><strong>Users with Sites:</strong> {systemUsersData.data.filter(user => user.sites.length > 0).length}</p>
                            </div>
                            <div className="p-3 rounded border">
                                <p><strong>Total Sites Managed:</strong> {systemUsersData.data.reduce((sum, user) => sum + user.sites.length, 0)}</p>
                            </div>
                            <div className="p-3 rounded border">
                                <p><strong>Sudo Access:</strong> {systemUsersData.data.filter(user => user.sudo).length}</p>
                            </div>
                            <div className="p-3 rounded border">
                                <p><strong>Restricted Users:</strong> {systemUsersData.data.filter(user => user.restricted_site_id !== null).length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">System Users Details</h2>
                        <div className="space-y-3">
                            {systemUsersData.data.map(user => (
                                <div key={user.id} className="p-4 rounded border">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-lg">{user.username}</h3>
                                            <p className="text-sm">ID: {user.id} | Server: {user.server_id}</p>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {user.is_primary && (
                                                <Badge variant="secondary">
                                                    Primary
                                                </Badge>
                                            )}
                                            {user.ssh_access && (
                                                <Badge variant="secondary">
                                                    SSH
                                                </Badge>
                                            )}
                                            {user.sudo && (
                                                <Badge variant="secondary">
                                                    Sudo
                                                </Badge>
                                            )}
                                            <Badge variant={user.status === 'succeed' ? 'default' : 'destructive'}>
                                                {user.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    {user.details && (
                                        <div className="mb-2">
                                            <p className="text-sm"><strong>Details:</strong> {user.details}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <p className="text-sm"><strong>User ID:</strong> {user.user_id}</p>
                                            <p className="text-sm"><strong>SSH Access:</strong> {user.ssh_access ? 'Yes' : 'No'}</p>
                                            <p className="text-sm"><strong>Sudo:</strong> {user.sudo ? 'Yes' : 'No'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm"><strong>Restricted Site:</strong> {user.restricted_site_id || 'None'}</p>
                                            <p className="text-sm"><strong>Restricted Path:</strong> {user.restricted_path || 'None'}</p>
                                            <p className="text-sm"><strong>Public Key:</strong> {user.public_key ? 'Set' : 'Not set'}</p>
                                        </div>
                                    </div>

                                    {user.sites.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold mb-1">Managed Sites ({user.sites.length}):</p>
                                            <div className="flex flex-wrap gap-1">
                                                {user.sites.map(site => (
                                                    <span key={site.id} className="px-2 py-1 rounded text-xs">
                                                        {site.url}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Full System Users Data</h2>
                        <pre className="p-4 rounded border overflow-auto max-h-96 text-xs">
                            {JSON.stringify(systemUsersData, null, 2)}
                        </pre>
                    </div>

                    <div className="flex gap-2 mt-4">
                        {systemUsersData.meta.current_page > 1 && (
                            <a
                                href={`?page=${systemUsersData.meta.current_page - 1}`}
                                className="px-4 py-2 rounded"
                            >
                                Previous Page
                            </a>
                        )}
                        {systemUsersData.meta.current_page < systemUsersData.meta.last_page && (
                            <a
                                href={`?page=${systemUsersData.meta.current_page + 1}`}
                                className="px-4 py-2 rounded"
                            >
                                Next Page
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
