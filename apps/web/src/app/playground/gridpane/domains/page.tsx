import { getGridPaneDomainsList } from "@/lib/gridpane/domains/getGridpaneDomainsList";
import { DomainsResponse } from "@/lib/gridpane/domains/types";

// Dynamic Rendering declaration
export const dynamic = 'force-dynamic';

// Pass searchParams as a prop
interface GridPaneDomainsTestPageProps {
    searchParams: Promise<{
        page?: string;
    }>;
}

export default async function GridPaneDomainsListPage({ searchParams }: GridPaneDomainsTestPageProps) {
    // Await searchParams before using it
    const resolvedSearchParams = await searchParams;
    console.log(`[PAGE.TSX | TOP] searchParams received:`, JSON.stringify(resolvedSearchParams, null, 2));

    let domainData: DomainsResponse | null = null;
    let fetchError: string | null = null;

    const pageFromParams = resolvedSearchParams?.page;
    console.log(`[PAGE.TSX | PARAMS] searchParams?.page value: ${pageFromParams} (type: ${typeof pageFromParams})`);

    const currentPage = Number(pageFromParams) || 1;
    console.log(`[PAGE.TSX | LOGIC] currentPage determined: ${currentPage}`);

    try {
        // server action
        domainData = await getGridPaneDomainsList(currentPage);
    } catch (error) {
        console.error(`Error fetching GridPane Domains page ${currentPage}:`, error);
        if (error instanceof Error) {
            fetchError = error.message;
        } else {
            fetchError = "An error occurred while fetching data.";
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">GridPane Domains API Test (Page: {currentPage})</h1>
            
            {fetchError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {fetchError}
                </div>
            )}

            {domainData && (
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">API Response Summary</h2>
                        <p><strong>Total Domains:</strong> {domainData.data.domains.length}</p>
                        <p><strong>Current Page:</strong> {domainData.meta.current_page}</p>
                        <p><strong>Total Pages:</strong> {domainData.meta.last_page}</p>
                        <p><strong>Total Items:</strong> {domainData.meta.total}</p>
                        <p><strong>Per Page:</strong> {domainData.meta.per_page}</p>
                    </div>

                    <div className="bg-green-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Constants Available</h2>
                        <p><strong>Types:</strong> {domainData.data.constants.type.length} options</p>
                        <p><strong>Routing:</strong> {domainData.data.constants.routing.length} options</p>
                        <p><strong>DNS Providers:</strong> {domainData.data.constants.dns.length} providers</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded">
                        <h2 className="font-semibold text-lg mb-2">Domains Data</h2>
                        <pre className="bg-white p-4 rounded border overflow-auto max-h-96 text-xs">
                            {JSON.stringify(domainData, null, 2)}
                        </pre>
                    </div>

                    <div className="flex gap-2 mt-4">
                        {domainData.meta.current_page > 1 && (
                            <a 
                                href={`?page=${domainData.meta.current_page - 1}`}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Previous Page
                            </a>
                        )}
                        {domainData.meta.current_page < domainData.meta.last_page && (
                            <a 
                                href={`?page=${domainData.meta.current_page + 1}`}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
