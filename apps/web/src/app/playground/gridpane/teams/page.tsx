import { getGridPaneCurrentTeam } from "@/lib/gridpane/teams/getGridpaneCurrentTeam";
import { CurrentTeamResponse } from "@/lib/gridpane/teams/types";

// Dynamic Rendering declaration
export const dynamic = 'force-dynamic';

export default async function GridPaneCurrentTeamPage() {
    console.log(`[PAGE.TSX | TOP] Loading GridPane Current Team page`);

    let teamData: CurrentTeamResponse | null = null;
    let fetchError: string | null = null;

    try {
        // server action (no pagination for current team endpoint)
        teamData = await getGridPaneCurrentTeam();
    } catch (error) {
        console.error(`Error fetching GridPane Current Team:`, error);
        if (error instanceof Error) {
            fetchError = error.message;
        } else {
            fetchError = "An error occurred while fetching data.";
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">GridPane Current Team API Test</h1>
            
            {fetchError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {fetchError}
                </div>
            )}

            {teamData && (
                <div className="space-y-4">
                    {teamData._metadata && (
                        <div className="bg-gray-50 p-4 rounded">
                            <h2 className="font-semibold text-lg mb-2">API Response Metadata</h2>
                            <p><strong>Fetched At:</strong> {new Date(teamData._metadata.fetched_at).toLocaleString()}</p>
                            <p><strong>Cached Until:</strong> {teamData._metadata.cached_until ? new Date(teamData._metadata.cached_until).toLocaleString() : 'Not cached'}</p>
                            <p><strong>Request Duration:</strong> {teamData._metadata.request_duration_ms}ms</p>
                            <p><strong>API Version:</strong> {teamData._metadata.api_version}</p>
                        </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Team Overview</h2>
                        <div className="flex items-start gap-4">
                            {teamData.photo_url && (
                                <img 
                                    src={teamData.photo_url} 
                                    alt={`${teamData.name} profile`}
                                    className="w-16 h-16 rounded-full border-2 border-gray-200"
                                />
                            )}
                            <div>
                                <h3 className="text-xl font-bold">{teamData.name}</h3>
                                <p className="text-gray-600">Team ID: {teamData.id}</p>
                                <p className="text-gray-600">Owner ID: {teamData.owner_id}</p>
                                {teamData.slug && (
                                    <p className="text-gray-600">Slug: {teamData.slug}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Billing & Subscription</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p><strong>Current Billing Plan:</strong> {teamData.current_billing_plan || 'Not set'}</p>
                                <p><strong>Stripe ID:</strong> {teamData.stripe_id || 'Not connected'}</p>
                                <p><strong>VAT ID:</strong> {teamData.vat_id || 'Not set'}</p>
                            </div>
                            <div>
                                <p><strong>Tax Rate:</strong> {teamData.tax_rate}%</p>
                                <p><strong>Additional Members:</strong> {teamData.teams_additional_members ?? 'Not set'}</p>
                                <p><strong>Trial Ends:</strong> {teamData.trial_ends_at ? new Date(teamData.trial_ends_at).toLocaleDateString() : 'No trial'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Team Status</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-3 rounded border text-center">
                                <div className="text-2xl font-bold text-blue-600">{teamData.id}</div>
                                <div className="text-sm text-gray-600">Team ID</div>
                            </div>
                            <div className="bg-white p-3 rounded border text-center">
                                <div className="text-2xl font-bold text-green-600">{teamData.tax_rate}%</div>
                                <div className="text-sm text-gray-600">Tax Rate</div>
                            </div>
                            <div className="bg-white p-3 rounded border text-center">
                                <div className={`text-2xl font-bold ${teamData.current_billing_plan ? 'text-green-600' : 'text-orange-600'}`}>
                                    {teamData.current_billing_plan ? 'Active' : 'Free'}
                                </div>
                                <div className="text-sm text-gray-600">Plan Status</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Timeline</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-white rounded border">
                                <span className="font-semibold">Team Created</span>
                                <span className="text-gray-600">{new Date(teamData.created_at).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white rounded border">
                                <span className="font-semibold">Last Updated</span>
                                <span className="text-gray-600">{new Date(teamData.updated_at).toLocaleString()}</span>
                            </div>
                            {teamData.trial_ends_at && (
                                <div className="flex justify-between items-center p-2 bg-white rounded border">
                                    <span className="font-semibold">Trial Ends</span>
                                    <span className={`font-semibold ${new Date(teamData.trial_ends_at) > new Date() ? 'text-green-600' : 'text-red-600'}`}>
                                        {new Date(teamData.trial_ends_at).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Full Team Data</h2>
                        <pre className="bg-white p-4 rounded border overflow-auto max-h-96 text-xs">
                            {JSON.stringify(teamData, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
