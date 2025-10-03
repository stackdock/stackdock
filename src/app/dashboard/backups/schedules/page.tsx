import { getGridPaneBackupSchedules } from "@/lib/gridpane/backups/getGridpaneBackupSchedules";
import { BackupSchedulesResponse, SCHEDULE_FREQUENCY_INFO, BACKUP_TYPE_INFO, DAY_OF_WEEK } from "@/lib/gridpane/backups/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Dynamic Rendering declaration
export const dynamic = 'force-dynamic';

export default async function GridPaneBackupSchedulesPage() {
    let schedulesData: BackupSchedulesResponse | null = null;
    let fetchError: string | null = null;

    try {
        // server action (no pagination for backup schedules endpoint)
        schedulesData = await getGridPaneBackupSchedules();
    } catch (error) {
        console.error(`Error fetching GridPane Backup Schedules:`, error);
        if (error instanceof Error) {
            fetchError = error.message;
        } else {
            fetchError = "An error occurred while fetching data.";
        }
    }

    // Helper function to format schedule time
    const formatScheduleTime = (hour: string, minute: string, day: string, schedule: string) => {
        const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
        if (schedule === 'weekly') {
            const dayName = DAY_OF_WEEK[day as keyof typeof DAY_OF_WEEK] || `Day ${day}`;
            return `${dayName}s at ${time}`;
        }
        return `${time}`;
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">GridPane Backup Schedules API Test</h1>

            {fetchError && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            {schedulesData && (
                <div className="space-y-4">
                    {schedulesData._metadata && (
                        <div className="p-4 rounded">
                            <h2 className="font-semibold text-lg mb-2">API Response Metadata</h2>
                            <p><strong>Fetched At:</strong> {new Date(schedulesData._metadata.fetched_at).toLocaleString()}</p>
                            <p><strong>Cached Until:</strong> {schedulesData._metadata.cached_until ? new Date(schedulesData._metadata.cached_until).toLocaleString() : 'Not cached'}</p>
                            <p><strong>Request Duration:</strong> {schedulesData._metadata.request_duration_ms}ms</p>
                            <p><strong>API Version:</strong> {schedulesData._metadata.api_version}</p>
                        </div>
                    )}

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Backup Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-3 rounded border text-center">
                                <div className="text-2xl font-bold">{schedulesData.data.length}</div>
                                <div className="text-sm">Sites with Backups</div>
                            </div>
                            <div className="p-3 rounded border text-center">
                                <div className="text-2xl font-bold">
                                    {schedulesData.data.reduce((sum, site) => sum + site.schedule_backups.length, 0)}
                                </div>
                                <div className="text-sm">Total Schedules</div>
                            </div>
                            <div className="p-3 rounded border text-center">
                                <div className="text-2xl font-bold">
                                    {schedulesData.data.reduce((sum, site) => sum + site.schedule_backups.filter(s => s.type === 'remote').length, 0)}
                                </div>
                                <div className="text-sm">Remote Backups</div>
                            </div>
                            <div className="p-3 rounded border text-center">
                                <div className="text-2xl font-bold">
                                    {schedulesData.data.reduce((sum, site) => sum + site.schedule_backups.filter(s => s.type === 'local').length, 0)}
                                </div>
                                <div className="text-sm">Local Backups</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Backup Schedules by Site</h2>
                        {schedulesData.data.length > 0 ? (
                            <div className="space-y-4">
                                {schedulesData.data.map(siteSchedule => (
                                    <div key={siteSchedule.site_id} className="p-4 rounded border">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-lg">{siteSchedule.url}</h3>
                                                <p className="text-sm">
                                                    Site ID: {siteSchedule.site_id} | Server ID: {siteSchedule.server_id}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="px-3 py-1 rounded text-sm font-medium">
                                                    {siteSchedule.schedule_backups.length} schedule{siteSchedule.schedule_backups.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {siteSchedule.schedule_backups.map(schedule => {
                                                const frequencyInfo = SCHEDULE_FREQUENCY_INFO[schedule.bup_schedule as keyof typeof SCHEDULE_FREQUENCY_INFO] || {
                                                    name: schedule.bup_schedule,
                                                    icon: '📋'
                                                };

                                                const typeInfo = BACKUP_TYPE_INFO[schedule.type];

                                                return (
                                                    <div key={schedule.id} className="border rounded p-3">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg">{typeInfo.icon}</span>
                                                                <div>
                                                                    <h4 className="font-semibold">{typeInfo.name}</h4>
                                                                    <p className="text-xs">ID: {schedule.id}</p>
                                                                </div>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded text-xs font-medium`}>
                                                                {frequencyInfo.icon} {frequencyInfo.name}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-1 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="">Schedule:</span>
                                                                <span className="font-medium">
                                                                    {formatScheduleTime(schedule.hour, schedule.minute, schedule.day, schedule.bup_schedule)}
                                                                </span>
                                                            </div>

                                                            {schedule.service_name && (
                                                                <div className="flex justify-between">
                                                                    <span>Service:</span>
                                                                    <span className="font-medium">{schedule.service_name}</span>
                                                                </div>
                                                            )}

                                                            {schedule.service_id && (
                                                                <div className="flex justify-between">
                                                                    <span>Service ID:</span>
                                                                    <span className="font-medium">{schedule.service_id}</span>
                                                                </div>
                                                            )}

                                                            {schedule.service_user_id && (
                                                                <div className="flex justify-between">
                                                                    <span>User ID:</span>
                                                                    <span className="font-medium">{schedule.service_user_id}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-2">📅</div>
                                <p>No backup schedules configured</p>
                                <p className="text-sm mt-1">Add backup schedules to protect your sites</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Schedule Distribution</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-medium mb-2">By Frequency</h3>
                                {Object.entries(
                                    schedulesData.data.reduce((acc, site) => {
                                        site.schedule_backups.forEach(schedule => {
                                            acc[schedule.bup_schedule] = (acc[schedule.bup_schedule] || 0) + 1;
                                        });
                                        return acc;
                                    }, {} as Record<string, number>)
                                ).map(([frequency, count]) => {
                                    const info = SCHEDULE_FREQUENCY_INFO[frequency as keyof typeof SCHEDULE_FREQUENCY_INFO] || {
                                        name: frequency,
                                        icon: '📋'
                                    };

                                    return (
                                        <div key={frequency} className="flex items-center justify-between p-2 rounded border">
                                            <span className="flex items-center gap-2">
                                                <span>{info.icon}</span>
                                                <span>{info.name}</span>
                                            </span>
                                            <span className={`px-2 py-1 rounded text-sm`}>
                                                {count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div>
                                <h3 className="font-medium mb-2">By Type</h3>
                                {Object.entries(
                                    schedulesData.data.reduce((acc, site) => {
                                        site.schedule_backups.forEach(schedule => {
                                            acc[schedule.type] = (acc[schedule.type] || 0) + 1;
                                        });
                                        return acc;
                                    }, {} as Record<string, number>)
                                ).map(([type, count]) => {
                                    const info = BACKUP_TYPE_INFO[type as keyof typeof BACKUP_TYPE_INFO];

                                    return (
                                        <div key={type} className="flex items-center justify-between p-2 rounded border">
                                            <span className="flex items-center gap-2">
                                                <span>{info.icon}</span>
                                                <span>{info.name}</span>
                                            </span>
                                            <span className={`px-2 py-1 rounded text-sm`}>
                                                {count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Full Backup Schedules Data</h2>
                        <pre className="p-4 rounded border overflow-auto max-h-96 text-xs">
                            {JSON.stringify(schedulesData, null, 2)}
                        </pre>
                    </div>

                    <div className="mt-4">
                        <a
                            href="/playground/gridpane/backups/integrations"
                            className="px-4 py-2 rounded mr-2"
                        >
                            View Backup Integrations
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
