import { getGridPaneUser } from "@/lib/gridpane/user/getGridpaneUser";
import { UserResponse } from "@/lib/gridpane/user/types";

// Dynamic Rendering declaration
export const dynamic = 'force-dynamic';

export default async function GridPaneUserPage() {
    console.log(`[PAGE.TSX | TOP] Loading GridPane User page`);

    let userData: UserResponse | null = null;
    let fetchError: string | null = null;

    try {
        // server action (no pagination for user endpoint)
        userData = await getGridPaneUser();
    } catch (error) {
        console.error(`Error fetching GridPane User:`, error);
        if (error instanceof Error) {
            fetchError = error.message;
        } else {
            fetchError = "An error occurred while fetching data.";
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">GridPane User API Test</h1>
            
            {fetchError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {fetchError}
                </div>
            )}

            {userData && (
                <div className="space-y-4">
                    {userData._metadata && (
                        <div className="bg-gray-50 p-4 rounded">
                            <h2 className="font-semibold text-lg mb-2">API Response Metadata</h2>
                            <p><strong>Fetched At:</strong> {new Date(userData._metadata.fetched_at).toLocaleString()}</p>
                            <p><strong>Cached Until:</strong> {userData._metadata.cached_until ? new Date(userData._metadata.cached_until).toLocaleString() : 'Not cached'}</p>
                            <p><strong>Request Duration:</strong> {userData._metadata.request_duration_ms}ms</p>
                            <p><strong>API Version:</strong> {userData._metadata.api_version}</p>
                        </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">User Summary</h2>
                        <p><strong>Name:</strong> {userData.name}</p>
                        <p><strong>Email:</strong> {userData.email}</p>
                        <p><strong>User ID:</strong> {userData.id}</p>
                        <p><strong>Plan:</strong> {userData.current_billing_plan}</p>
                        <p><strong>Plan Type:</strong> {userData.plan_type}</p>
                        <p><strong>Account Status:</strong> {userData.is_account_suspended ? 'Suspended' : 'Active'}</p>
                        <p><strong>Created:</strong> {new Date(userData.created_at).toLocaleDateString()}</p>
                        <p><strong>Last Seen:</strong> {new Date(userData.last_seen).toLocaleDateString()}</p>
                    </div>

                    <div className="bg-green-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Team & Access</h2>
                        <p><strong>Current Team:</strong> {userData.currentTeam.name}</p>
                        <p><strong>Team Role:</strong> {userData.currentTeam.pivot.role}</p>
                        <p><strong>Total Teams:</strong> {userData.teams.length}</p>
                        <p><strong>Can Create Server:</strong> {userData.can_create_server ? 'Yes' : 'No'}</p>
                        <p><strong>Git Access:</strong> {userData.has_git_access ? 'Yes' : 'No'}</p>
                        <p><strong>Git MT Access:</strong> {userData.has_git_mt_access ? 'Yes' : 'No'}</p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Security & Settings</h2>
                        <p><strong>Two Factor Auth:</strong> {userData.uses_two_factor_auth ? 'Enabled' : 'Disabled'}</p>
                        <p><strong>Uses Google Auth:</strong> {userData.uses_google ? 'Yes' : 'No'}</p>
                        <p><strong>Uses Authy:</strong> {userData.uses_authy ? 'Yes' : 'No'}</p>
                        <p><strong>OTP Session Duration:</strong> {userData.otp_session_duration} minutes</p>
                        <p><strong>App Timezone:</strong> {userData.app_timezone}</p>
                        <p><strong>Email Verified:</strong> {userData.email_verified_at ? 'Yes' : 'No'}</p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Plan & Billing</h2>
                        <p><strong>Plan Name:</strong> {userData.plan.name}</p>
                        <p><strong>Plan Price:</strong> ${userData.plan.price / 100}/month</p>
                        <p><strong>Max Team Members:</strong> {userData.plan.max_team_members}</p>
                        <p><strong>Trial Days:</strong> {userData.plan.trial_days}</p>
                        <p><strong>Tax Rate:</strong> {userData.tax_rate}%</p>
                        <p><strong>VAT ID:</strong> {userData.vat_id || 'Not set'}</p>
                    </div>

                    <div className="bg-orange-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Permissions & Features</h2>
                        <p><strong>Total Permissions:</strong> {userData.permissions.length}</p>
                        <p><strong>Total Roles:</strong> {userData.roles.length}</p>
                        <p><strong>Fortress Access:</strong> {userData.paid_fortress ? 'Yes' : 'No'}</p>
                        <p><strong>Preemptive Support:</strong> {userData.can_use_preemptive_support ? 'Available' : 'Not Available'}</p>
                        <p><strong>Multisite Preemptive Support:</strong> {userData.can_use_multisite_preemptive_support ? 'Available' : 'Not Available'}</p>
                        <p><strong>Peak Frequency Available:</strong> {userData.peak_freq_available ? 'Yes' : 'No'}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Full User Data</h2>
                        <pre className="bg-white p-4 rounded border overflow-auto max-h-96 text-xs">
                            {JSON.stringify(userData, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
