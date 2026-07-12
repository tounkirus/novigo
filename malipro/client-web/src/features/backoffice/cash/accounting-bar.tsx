"use client";

import { FileSpreadsheet, FileText, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const DOCUMENTS = [
  { key: "journal", label: "Journal de caisse", icon: BookOpen },
  { key: "daily", label: "Balance quotidienne", icon: FileText },
  { key: "monthly", label: "Balance mensuelle", icon: FileText },
] as const;

export function AccountingBar() {
  const { toast } = useToast();

  const exportDoc = (label: string, format: "Excel" | "PDF") => {
    toast({
      title: `Export ${format} lancé`,
      description: `${label} — le fichier sera généré et téléchargé dans un instant.`,
      tone: "info",
    });
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4 text-brand" />
        <h3 className="text-sm font-bold text-ink">Comptabilité</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {DOCUMENTS.map((doc) => {
          const DocIcon = doc.icon;
          return (
            <div key={doc.key} className="rounded-xl border border-line bg-shell/50 p-3.5">
              <div className="mb-3 flex items-center gap-2">
                <DocIcon className="h-4 w-4 text-muted" />
                <span className="text-[13px] font-semibold text-ink">{doc.label}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => exportDoc(doc.label, "Excel")}>
                  Excel
                </Button>
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => exportDoc(doc.label, "PDF")}>
                  PDF
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
