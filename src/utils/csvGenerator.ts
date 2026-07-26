import { Transaction } from "@/types/fraud";

export const exportTransactionsToCSV = (transactions: Transaction[], filename = "transaction_dataset.csv"): void => {
  if (!transactions || transactions.length === 0) return;

  const header = "transaction_id,sender_id,receiver_id,amount,timestamp\n";
  const rows = transactions.map(t => {
    // Ensure timestamps format matches standard format strictly: YYYY-MM-DD HH:mm:ss
    const cleanTs = t.timestamp.replace("T", " ").replace(/\.\d+Z$/, "");
    return `${t.transaction_id},${t.sender_id},${t.receiver_id},${t.amount.toFixed(2)},${cleanTs}`;
  }).join("\n");

  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
