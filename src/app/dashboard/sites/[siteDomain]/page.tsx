import { getGridPaneSiteByDomain } from "@/lib/gridpane/sites/getGridpaneSite";
import { SingleSiteResponse } from "@/lib/gridpane/sites/types";
import PhpVersionSelector from "@/components/sites/php-version-selector";
import Link from "next/link";

// Dynamic Rendering declaration
export const dynamic = 'force-dynamic';

interface GridPaneSingleSitePageProps {
    params: Promise<{
        siteDomain: string;
    }>;
}

export default async function GridPaneSingleSitePage({ params }: GridPaneSingleSitePageProps) {
    const resolvedParams = await params;
    const siteDomainParam = resolvedParams.siteDomain;
    
    console.log(`[PAGE.TSX | TOP] Loading GridPane Single Site page for domain: ${siteDomainParam}`);

    let siteData: SingleSiteResponse | null = null;
    let fetchError: string | null = null;

    // Decode URL parameter (in case domain has special characters)
    const siteDomain = decodeURIComponent(siteDomainParam);

    try {
        siteData = await getGridPaneSiteByDomain(siteDomain);
    } catch (error) {
        console.error(`Error fetching GridPane Site ${siteDomain}:`, error);
        if (error instanceof Error) {
            fetchError = error.message;
        } else {
            fetchError = "An error occurred while fetching data.";
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">GridPane Single Site API Test (Domain: {siteDomain})</h1>
            
            {fetchError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {fetchError}
                </div>
            )}

            {siteData && (
                <div className="space-y-4">
                    {siteData._metadata && (
                        <div className="bg-gray-50 p-4 rounded">
                            <h2 className="font-semibold text-lg mb-2">API Response Metadata</h2>
                            <p><strong>Fetched At:</strong> {new Date(siteData._metadata.fetched_at).toLocaleString()}</p>
                            <p><strong>Cached Until:</strong> {siteData._metadata.cached_until ? new Date(siteData._metadata.cached_until).toLocaleString() : 'Not cached'}</p>
                            <p><strong>Request Duration:</strong> {siteData._metadata.request_duration_ms}ms</p>
                            <p><strong>API Version:</strong> {siteData._metadata.api_version}</p>
                        </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Site Summary</h2>
                        <p><strong>URL:</strong> {siteData.url}</p>
                        <p><strong>Site ID:</strong> {siteData.id}</p>
                        <p><strong>Type:</strong> {siteData.type}</p>
                        <p><strong>PHP Version:</strong> {siteData.php_version}</p>
                        <p><strong>SSL Enabled:</strong> {siteData.is_ssl ? 'Yes' : 'No'}</p>
                        <p><strong>SSL Status:</strong> {siteData.ssl_status || 'N/A'}</p>
                        <p><strong>Built At:</strong> {new Date(siteData.built_at).toLocaleString()}</p>
                        <p><strong>Last Resolved:</strong> {new Date(siteData.resolved_at).toLocaleString()}</p>
                    </div>

                    <div className="bg-green-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Server Information</h2>
                        <p><strong>Server Label:</strong> {siteData.server.label}</p>
                        <p><strong>Server IP:</strong> {siteData.server.ip}</p>
                        <p><strong>Region:</strong> {siteData.server.region}</p>
                        <p><strong>Status:</strong> {siteData.server.status}</p>
                        <p><strong>OS:</strong> {siteData.server.os}</p>
                        <p><strong>Web Server:</strong> {siteData.server.webserver}</p>
                        <p><strong>Timezone:</strong> {siteData.server.server_timezone}</p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Performance & Caching</h2>
                        <p><strong>Nginx Caching:</strong> {siteData.nginx_caching || 'Disabled'}</p>
                        <p><strong>Object Caching:</strong> {siteData.site_customizer.object_caching ? 'Enabled' : 'Disabled'}</p>
                        <p><strong>Brotli:</strong> {siteData.site_customizer.brotli ? 'Enabled' : 'Disabled'}</p>
                        <p><strong>HTTP/2 Push:</strong> {siteData.site_customizer.http2_push ? 'Enabled' : 'Disabled'}</p>
                        <p><strong>Memory Limit:</strong> {siteData.memory_limit}MB</p>
                        <p><strong>Max Execution Time:</strong> {siteData.max_execution_time}s</p>
                        <p><strong>Upload Max Size:</strong> {siteData.upload_max_filesize}MB</p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Security Settings</h2>
                        <p><strong>WAF:</strong> {siteData.waf || 'Not configured'}</p>
                        <p><strong>7G Protection:</strong> {siteData.site_security_settings.seven_g_bad_bots ? 'Enabled' : 'Disabled'}</p>
                        <p><strong>WP Fail2Ban:</strong> {siteData.site_security_settings.wp_f2b ? 'Enabled' : 'Disabled'}</p>
                        <p><strong>XML-RPC Disabled:</strong> {siteData.site_security_settings.disable_xmlrpc ? 'Yes' : 'No'}</p>
                        <p><strong>Clickjacking Protection:</strong> {siteData.clickjacking_protection ? 'Enabled' : 'Disabled'}</p>
                        <p><strong>HTTP Auth:</strong> {siteData.http_auth ? 'Enabled' : 'Disabled'}</p>
                    </div>

                    <div className="bg-orange-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Backups & Services</h2>
                        <p><strong>Local Backups:</strong> {siteData.local_bup ? 'Enabled' : 'Disabled'}</p>
                        <p><strong>Remote Backups:</strong> {siteData.remote_bup ? 'Enabled' : 'Disabled'}</p>
                        <p><strong>VPS Services:</strong> {siteData.vpsServices.length} configured</p>
                        <p><strong>Scheduled Backups:</strong> {siteData.schedule_backups.length} scheduled</p>
                        {siteData.vpsServices.length > 0 && (
                            <div className="mt-2">
                                <strong>Services:</strong>
                                <ul className="list-disc list-inside ml-4">
                                    {siteData.vpsServices.map(service => (
                                        <li key={service.id}>{service.name} (Status: {service.pivot.status})</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <PhpVersionSelector
                        siteId={siteData.id}
                        siteName={siteData.url}
                        currentPhpVersion={siteData.php_version || '8.0'}
                    />

                    <div className="bg-pink-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">WordPress Settings</h2>
                        <p><strong>Automatic Updates:</strong> {siteData.automatic_updates ? 'Enabled' : 'Disabled'}</p>
                        <p><strong>Debug Mode:</strong> {siteData.is_debug ? 'Enabled' : 'Disabled'}</p>
                        <p><strong>Multisites:</strong> {siteData.multisites}</p>
                        <p><strong>Vulnerability Check:</strong> {siteData.wp_vulns_found ? 'Issues Found' : 'Clean'}</p>
                        <p><strong>Monitoring:</strong> {siteData.is_monitored ? 'Enabled' : 'Disabled'}</p>
                        <p><strong>Git Configured:</strong> {siteData.is_git_configured ? 'Yes' : 'No'}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Full Site Data</h2>
                        <pre className="bg-white p-4 rounded border overflow-auto max-h-96 text-xs">
                            {JSON.stringify(siteData, null, 2)}
                        </pre>
                    </div>

                        <Link
                            href="/playground/gridpane/sites"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            ← Back to Sites List
                        </Link>
                    </div>
            )}
        </div>
    );
}
