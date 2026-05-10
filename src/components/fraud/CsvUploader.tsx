import React, { useCallback, useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Transaction } from "@/types/fraud";
import { isSafeIdentifier, sanitizeCsvCell } from "@/lib/privacy";

interface CsvUploaderProps {
  onUpload: (transactions: Transaction[], metadata: { fileName: string; fileHash: string }) => void;
  isLoading: boolean;
}

const REQUIRED_COLUMNS = ["transaction_id", "sender_id", "receiver_id", "amount", "timestamp"];

export const CsvUploader: React.FC<CsvUploaderProps> = ({ onUpload, isLoading }) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);

  const parseCSV = (text: string): Transaction[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) throw new Error("CSV must have at least one data row");

    const headers = lines[0].split(",").map(h => sanitizeCsvCell(h).toLowerCase());
    const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    if (missing.length > 0) {
      throw new Error(`Missing required columns: ${missing.join(", ")}`);
    }

    const transactions: Transaction[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(",").map(sanitizeCsvCell);
      if (values.length !== headers.length) {
        throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
      }

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx]; });

      const amount = parseFloat(row.amount);
      if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000_000) throw new Error(`Row ${i + 1}: amount is outside the accepted range`);

      const ts = new Date(row.timestamp);
      if (isNaN(ts.getTime())) throw new Error(`Row ${i + 1}: timestamp "${row.timestamp}" is not a valid date`);

      for (const field of ["transaction_id", "sender_id", "receiver_id"] as const) {
        if (!isSafeIdentifier(row[field])) throw new Error(`Row ${i + 1}: ${field} contains unsupported characters`);
      }

      transactions.push({
        transaction_id: row.transaction_id,
        sender_id: row.sender_id,
        receiver_id: row.receiver_id,
        amount,
        timestamp: ts.toISOString(),
      });
    }

    if (transactions.length > 10000) {
      throw new Error("Maximum 10,000 transactions allowed per upload");
    }

    return transactions;
  };

  const sha256 = async (text: string): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(hashBuffer)).map(byte => byte.toString(16).padStart(2, "0")).join("");
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    setFileName(null);
    setRowCount(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file (.csv extension required)");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const transactions = parseCSV(text);
        const fileHash = await sha256(text);
        setFileName(file.name);
        setRowCount(transactions.length);
        onUpload(transactions, { fileName: sanitizeCsvCell(file.name), fileHash });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse CSV");
      }
    };
    reader.readAsText(file);
  }, [onUpload]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full">
      <label
        htmlFor="csv-upload"
        className={`
          flex flex-col items-center justify-center w-full min-h-[200px] border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
          ${dragOver
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border bg-card/50 hover:bg-card hover:border-primary/60"}
          ${isLoading ? "opacity-50 pointer-events-none" : ""}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center gap-3 p-8 text-center">
          {isLoading ? (
            <>
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-mono text-muted-foreground">Analyzing transactions...</p>
            </>
          ) : fileName && !error ? (
            <>
              <CheckCircle className="w-10 h-10" style={{ color: "hsl(155 100% 50%)" }} />
              <div>
                <p className="text-sm font-mono" style={{ color: "hsl(155 100% 50%)" }}>{fileName}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">{rowCount?.toLocaleString()} transactions loaded</p>
              </div>
              <p className="text-xs font-mono text-muted-foreground">Drop a new file to replace</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-mono text-foreground">Drop CSV file here or click to browse</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">Max 10,000 transactions</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {REQUIRED_COLUMNS.map(col => (
                  <span key={col} className="text-xs font-mono px-2 py-0.5 rounded border border-border/50 text-muted-foreground bg-muted/30">
                    {col}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </label>

      {error && (
        <div className="flex items-start gap-2 mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/30">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(0 84% 60%)" }} />
          <p className="text-xs font-mono" style={{ color: "hsl(0 84% 60%)" }}>{error}</p>
        </div>
      )}

      {!error && (
        <div className="mt-3 p-3 rounded-md bg-card/50 border border-border/30">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-xs font-mono text-muted-foreground">Expected CSV format:</p>
              <p className="text-xs font-mono text-muted-foreground/70 mt-1">
                transaction_id,sender_id,receiver_id,amount,timestamp
              </p>
              <p className="text-xs font-mono text-muted-foreground/50 mt-0.5">
                TX001,ACC001,ACC002,5000.00,2024-01-15T10:30:00Z
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
