import { getGridPaneServersList } from "@/lib/gridpane/servers/getGridpaneServersList";
import { ServersResponse } from "@/lib/gridpane/servers/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Dynamic Rendering declaration
export const dynamic = 'force-dynamic';

// Pass searchParams as a prop
interface GridPaneServersPageProps {
    searchParams: Promise<{
        page?: string;
    }>;
}

export default async function GridPaneServersPage({ searchParams }: GridPaneServersPageProps) {
    // Await searchParams before using it
    const resolvedSearchParams = await searchParams;
    console.log(`[PAGE.TSX | TOP] searchParams received:`, JSON.stringify(resolvedSearchParams, null, 2));

    let serverData: ServersResponse | null = null;
    let fetchError: string | null = null;

    const pageFromParams = resolvedSearchParams?.page;
    console.log(`[PAGE.TSX | PARAMS] searchParams?.page value: ${pageFromParams} (type: ${typeof pageFromParams})`);

    const currentPage = Number(pageFromParams) || 1;
    console.log(`[PAGE.TSX | LOGIC] currentPage determined: ${currentPage}`);

    try {
        // server action
        serverData = await getGridPaneServersList(currentPage);
    } catch (error) {
        console.error(`Error fetching GridPane Servers page ${currentPage}:`, error);
        if (error instanceof Error) {
            fetchError = error.message;
        } else {
            fetchError = "An error occurred while fetching data.";
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">GridPane Servers API Test (Page: {currentPage})</h1>
            
            {fetchError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {fetchError}
                </div>
            )}

            {serverData && (
                <div className="space-y-4">
                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">API Response Summary</h2>
                        <p><strong>Total Servers:</strong> {serverData.data.length}</p>
                        <p><strong>Current Page:</strong> {serverData.meta.current_page}</p>
                        <p><strong>Total Pages:</strong> {serverData.meta.last_page}</p>
                        <p><strong>Total Items:</strong> {serverData.meta.total}</p>
                        <p><strong>Per Page:</strong> {serverData.meta.per_page}</p>
                    </div>
                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Servers Data</h2>
                        <pre className="p-4 rounded border overflow-auto max-h-96 text-xs">
                            {JSON.stringify(serverData, null, 2)}
                        </pre>
                    </div>
                    <div className="flex gap-2 mt-4">
                        {serverData.meta.current_page > 1 && (
                            <Button>
                                <Link href={`?page=${serverData.meta.current_page - 1}`}>Previous</Link>
                            </Button>                            
                        )}
                        {serverData.meta.current_page < serverData.meta.last_page && (
                            <Button>
                                <Link href={`?page=${serverData.meta.current_page + 1}`}>Next</Link>
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
