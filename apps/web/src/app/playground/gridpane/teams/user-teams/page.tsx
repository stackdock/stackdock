import { getGridPaneUserTeamsList } from "@/lib/gridpane/teams/getGridpaneUserTeamsList";
import { UserTeamsResponse } from "@/lib/gridpane/teams/types";

// Dynamic Rendering declaration
export const dynamic = 'force-dynamic';

export default async function GridPaneUserTeamsPage() {
    console.log(`[PAGE.TSX | TOP] Loading GridPane User Teams page`);

    let teamsData: UserTeamsResponse | null = null;
    let fetchError: string | null = null;

    try {
        // server action (no pagination for user teams endpoint)
        teamsData = await getGridPaneUserTeamsList();
    } catch (error) {
        console.error(`Error fetching GridPane User Teams:`, error);
        if (error instanceof Error) {
            fetchError = error.message;
        } else {
            fetchError = "An error occurred while fetching data.";
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">GridPane User Teams API Test</h1>
            
            {fetchError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {fetchError}
                </div>
            )}

            {teamsData && (
                <div className="space-y-4">
                    {teamsData._metadata && (
                        <div className="bg-gray-50 p-4 rounded">
                            <h2 className="font-semibold text-lg mb-2">API Response Metadata</h2>
                            <p><strong>Fetched At:</strong> {new Date(teamsData._metadata.fetched_at).toLocaleString()}</p>
                            <p><strong>Cached Until:</strong> {teamsData._metadata.cached_until ? new Date(teamsData._metadata.cached_until).toLocaleString() : 'Not cached'}</p>
                            <p><strong>Request Duration:</strong> {teamsData._metadata.request_duration_ms}ms</p>
                            <p><strong>API Version:</strong> {teamsData._metadata.api_version}</p>
                        </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Teams Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-3 rounded border text-center">
                                <div className="text-2xl font-bold text-blue-600">{teamsData.teams.length}</div>
                                <div className="text-sm text-gray-600">Total Teams</div>
                            </div>
                            <div className="bg-white p-3 rounded border text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {teamsData.teams.filter(team => team.current_billing_plan).length}
                                </div>
                                <div className="text-sm text-gray-600">Active Plans</div>
                            </div>
                            <div className="bg-white p-3 rounded border text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                    {teamsData.teams.filter(team => team.trial_ends_at && new Date(team.trial_ends_at) > new Date()).length}
                                </div>
                                <div className="text-sm text-gray-600">Active Trials</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Teams List</h2>
                        {teamsData.teams.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {teamsData.teams.map(team => (
                                    <div key={team.id} className="bg-white p-4 rounded border">
                                        <div className="flex items-start gap-4 mb-3">
                                            {team.photo_url && (
                                                <img 
                                                    src={team.photo_url} 
                                                    alt={`${team.name} profile`}
                                                    className="w-12 h-12 rounded-full border-2 border-gray-200"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg">{team.name}</h3>
                                                <p className="text-sm text-gray-600">ID: {team.id}</p>
                                                <p className="text-sm text-gray-600">Owner: {team.owner_id}</p>
                                                {team.slug && (
                                                    <p className="text-sm text-gray-600">Slug: {team.slug}</p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {team.current_billing_plan ? (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                        Paid
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                                                        Free
                                                    </span>
                                                )}
                                                {team.trial_ends_at && new Date(team.trial_ends_at) > new Date() && (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                        Trial
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="space-y-1">
                                                <p><strong>Created:</strong> {new Date(team.created_at).toLocaleDateString()}</p>
                                                <p><strong>Updated:</strong> {new Date(team.updated_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p><strong>Tax Rate:</strong> {team.tax_rate}%</p>
                                                <p><strong>Members:</strong> {team.teams_additional_members ?? 'Not set'}</p>
                                            </div>
                                        </div>

                                        {team.trial_ends_at && (
                                            <div className="mt-3 pt-3 border-t">
                                                <p className="text-sm">
                                                    <strong>Trial Status:</strong> 
                                                    <span className={`ml-1 font-semibold ${
                                                        new Date(team.trial_ends_at) > new Date() 
                                                            ? 'text-green-600' 
                                                            : 'text-red-600'
                                                    }`}>
                                                        {new Date(team.trial_ends_at) > new Date() 
                                                            ? `Expires ${new Date(team.trial_ends_at).toLocaleDateString()}` 
                                                            : 'Expired'
                                                        }
                                                    </span>
                                                </p>
                                            </div>
                                        )}

                                        {(team.stripe_id || team.vat_id || team.current_billing_plan) && (
                                            <div className="mt-3 pt-3 border-t">
                                                <h4 className="font-semibold text-sm mb-1">Billing Details</h4>
                                                <div className="text-xs text-gray-600 space-y-1">
                                                    {team.current_billing_plan && <p>Plan: {team.current_billing_plan}</p>}
                                                    {team.stripe_id && <p>Stripe: {team.stripe_id}</p>}
                                                    {team.vat_id && <p>VAT: {team.vat_id}</p>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No teams found for this user</p>
                        )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Full Teams Data</h2>
                        <pre className="bg-white p-4 rounded border overflow-auto max-h-96 text-xs">
                            {JSON.stringify(teamsData, null, 2)}
                        </pre>
                    </div>

                    <div className="mt-4">
                        <a 
                            href="/playground/gridpane/teams/current"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
                        >
                            View Current Team
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
