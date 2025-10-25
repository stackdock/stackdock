import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function Backups() {
    return (
        <div>
        <h1>Integrations</h1>
        <Button>
            <Link href="/playground/gridpane/backups/integrations">Integrations</Link>
        </Button>
        <h1>Schedules</h1>
        <Button>
            <Link href="/playground/gridpane/backups/schedules">Schedules</Link>
        </Button>
        </div>
    );
}
