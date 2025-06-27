import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>Servers</h1>
      <Button>
        <Link href="/playground/gridpane/servers">Servers</Link>
      </Button>
      <h1>Sites</h1>
      <Button>
        <Link href="/playground/gridpane/sites">Sites</Link>
      </Button>
      <h1>Domains</h1>
      <Button>
        <Link href="/playground/gridpane/domains">Domains</Link>
      </Button>
      <h1>User</h1>
      <Button>
        <Link href="/playground/gridpane/user">User</Link>
      </Button>
      <h1>System Users</h1>
      <Button>
        <Link href="/playground/gridpane/system-users">System Users</Link>
      </Button>
      <h1>Teams</h1>
      <div className="flex gap-2">
        <Button>
          <Link href="/playground/gridpane/teams">Teams</Link>
        </Button>
          <Button>
          <Link href="/playground/gridpane/teams/user-teams">User Teams</Link>
        </Button>
      </div>
    </div>
  );
}
