"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, User, Users, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(url);
  };

  const hasResults =
    results &&
    (results.companies?.length > 0 || results.contacts?.length > 0 || results.leads?.length > 0);

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search companies, contacts, leads... (Ctrl+K)"
          className="pl-9 bg-gray-50 border-gray-200 text-xs h-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (hasResults) setIsOpen(true);
          }}
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-11 z-50 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
          {loading && (
            <p className="p-3 text-center text-xs text-gray-400">Searching...</p>
          )}

          {!loading && !hasResults && query.length >= 2 && (
            <p className="p-3 text-center text-xs text-gray-400">No records found matching "{query}"</p>
          )}

          {!loading && hasResults && (
            <div className="max-h-80 overflow-y-auto divide-y text-xs">
              {/* Companies */}
              {results.companies?.length > 0 && (
                <div className="py-1">
                  <p className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase">Companies</p>
                  {results.companies.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(`/companies/${c.id}`)}
                      className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 rounded text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium text-gray-800">{c.name}</span>
                        {c.country && <Badge variant="outline" className="text-[9px] py-0">{c.country}</Badge>}
                      </div>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}

              {/* Contacts */}
              {results.contacts?.length > 0 && (
                <div className="py-1">
                  <p className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase">Contacts</p>
                  {results.contacts.map((ct: any) => (
                    <button
                      key={ct.id}
                      onClick={() => handleSelect(`/contacts/${ct.id}`)}
                      className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 rounded text-left"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        <div>
                          <span className="font-medium text-gray-800">{ct.fullName}</span>
                          <span className="text-gray-400 ml-1.5">@ {ct.company.name}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}

              {/* Leads */}
              {results.leads?.length > 0 && (
                <div className="py-1">
                  <p className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase">Leads & Relationships</p>
                  {results.leads.map((l: any) => (
                    <button
                      key={l.id}
                      onClick={() => handleSelect(`/leads/${l.id}`)}
                      className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 rounded text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium text-gray-800">{l.company.name}</span>
                        <Badge variant="secondary" className="text-[9px] py-0">{l.stage}</Badge>
                      </div>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
