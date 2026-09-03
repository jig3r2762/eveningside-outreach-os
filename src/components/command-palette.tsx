"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({ companies: [], contacts: [], leads: [], opportunities: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      setLoading(true);
      const delay = setTimeout(() => {
        fetch(`/api/search?q=${encodeURIComponent(query)}`)
          .then(res => res.json())
          .then(data => {
            setResults(data);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setResults({ companies: [], contacts: [], leads: [], opportunities: [] });
    }
  }, [query]);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-xl bg-background overflow-hidden border">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Type a command or search companies, contacts, leads..."
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-0 focus-visible:ring-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {query.length < 2 && (
            <>
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Quick Actions</div>
              <button onClick={() => handleSelect('/leads/new')} className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted">Create Lead</button>
              <button onClick={() => handleSelect('/meetings')} className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted">Schedule Meeting</button>
              <button onClick={() => handleSelect('/pipeline/opportunities')} className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted">View Pipeline</button>
              <button onClick={() => handleSelect('/settings/users')} className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted">Open Settings</button>
            </>
          )}

          {results.companies?.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Companies</div>
              {results.companies.map((c: any) => (
                <button key={c.id} onClick={() => handleSelect(`/companies/${c.id}`)} className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted truncate">
                  {c.name} {c.industry && `• ${c.industry}`}
                </button>
              ))}
            </div>
          )}

          {results.contacts?.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Contacts</div>
              {results.contacts.map((c: any) => (
                <button key={c.id} onClick={() => handleSelect(`/contacts/${c.id}`)} className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted truncate">
                  {c.fullName} • {c.company?.name}
                </button>
              ))}
            </div>
          )}

          {results.leads?.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Leads</div>
              {results.leads.map((l: any) => (
                <button key={l.id} onClick={() => handleSelect(`/leads/${l.id}`)} className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted truncate">
                  {l.company?.name} • {l.stage}
                </button>
              ))}
            </div>
          )}
          
          {results.opportunities?.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Opportunities</div>
              {results.opportunities.map((o: any) => (
                <button key={o.id} onClick={() => handleSelect(`/opportunities/${o.id}`)} className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted truncate">
                  {o.name} • {o.company?.name} • {o.stage}
                </button>
              ))}
            </div>
          )}
          
          {query.length >= 2 && !loading && !results.companies?.length && !results.contacts?.length && !results.leads?.length && !results.opportunities?.length && (
            <div className="text-center py-6 text-sm text-muted-foreground">No results found.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
