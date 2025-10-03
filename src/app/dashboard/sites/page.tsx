import { getGridPaneSitesList } from "@/lib/gridpane/sites/getGridpaneSitesList";
import { SitesResponse } from "@/lib/gridpane/sites/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Dynamic Rendering declaration
export const dynamic = 'force-dynamic';

// Pass searchParams as a prop
interface GridPaneSitesPageProps {
    searchParams: Promise<{
        page?: string;
    }>;
}

export default async function GridPaneSitesListPage({ searchParams }: GridPaneSitesPageProps) {
    // Await searchParams before using it
    const resolvedSearchParams = await searchParams;

    let siteData: SitesResponse | null = null;
    let fetchError: string | null = null;

    const pageFromParams = resolvedSearchParams?.page;
    const currentPage = Number(pageFromParams) || 1;

    try {
        // server action
        siteData = await getGridPaneSitesList(currentPage);
    } catch (error) {
        console.error(`Error fetching GridPane Sites page ${currentPage}:`, error);
        if (error instanceof Error) {
            fetchError = error.message;
        } else {
            fetchError = "An error occurred while fetching data.";
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">GridPane Sites API Test (Page: {currentPage})</h1>

            {fetchError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {fetchError}
                </div>
            )}

            {siteData && (
                <div className="space-y-4">
                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">API Response Summary</h2>
                        <p><strong>Total Sites:</strong> {siteData.data.length}</p>
                        <p><strong>Current Page:</strong> {siteData.meta.current_page}</p>
                        <p><strong>Total Pages:</strong> {siteData.meta.last_page}</p>
                        <p><strong>Total Items:</strong> {siteData.meta.total}</p>
                        <p><strong>Per Page:</strong> {siteData.meta.per_page}</p>
                    </div>

                    <div className="p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Sites Data</h2>
                        <pre className="p-4 rounded border overflow-auto max-h-96 text-xs">
                            {JSON.stringify(siteData, null, 2)}
                        </pre>
                    </div>

                    <div className="flex gap-2 mt-4">
                        {siteData.meta.current_page > 1 && (
                            <Button>
                                <Link href={`?page=${siteData.meta.current_page - 1}`}>Previous</Link>
                            </Button>
                        )}
                        {siteData.meta.current_page < siteData.meta.last_page && (
                            <Button>
                                <Link href={`?page=${siteData.meta.current_page + 1}`}>Next</Link>
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
