import React, { useEffect, useState } from "react";
import { Sliders, Save, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Config {
  id: string;
  cycle_depth: number;
  fan_in_threshold: number;
  shell_chain_length: number;
  updated_at: string;
  updated_by: string | null;
}

const AdminConfigTab: React.FC = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("detection_config")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setConfig(data);
      setLoading(false);
    })();
  }, []);

  const update = (patch: Partial<Config>) => setConfig((c) => (c ? { ...c, ...patch } : c));

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("detection_config")
      .update({
        cycle_depth: config.cycle_depth,
        fan_in_threshold: config.fan_in_threshold,
        shell_chain_length: config.shell_chain_length,
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      })
      .eq("id", config.id);
    setSaving(false);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
    } else {
      toast.success("Detection configuration updated");
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-16 text-amber-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="border-amber-500/20 bg-card/50 p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Sliders className="w-4 h-4 text-amber-400" />
        <h2 className="font-mono text-sm font-semibold text-amber-400 tracking-wider">DETECTION ENGINE TUNING</h2>
      </div>

      <div className="space-y-7">
        <SliderField
          label="Cycle Depth"
          help="Max length of suspicious circular routing chains"
          min={3}
          max={5}
          step={1}
          value={config.cycle_depth}
          onChange={(v) => update({ cycle_depth: v })}
        />
        <SliderField
          label="Fan-in Threshold"
          help="Minimum unique senders → 1 receiver to flag smurfing"
          min={2}
          max={50}
          step={1}
          value={config.fan_in_threshold}
          onChange={(v) => update({ fan_in_threshold: v })}
        />
        <SliderField
          label="Shell Chain Length"
          help="Minimum hops in shell-account chain"
          min={2}
          max={10}
          step={1}
          value={config.shell_chain_length}
          onChange={(v) => update({ shell_chain_length: v })}
        />
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-amber-500/20 pt-4">
        <div className="font-mono text-[11px] text-muted-foreground">
          Last updated: {new Date(config.updated_at).toLocaleString()}
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-black font-mono font-bold">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Configuration
        </Button>
      </div>
    </Card>
  );
};

const SliderField: React.FC<{
  label: string;
  help: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}> = ({ label, help, min, max, step, value, onChange }) => (
  <div>
    <div className="flex items-baseline justify-between mb-2">
      <div>
        <div className="font-mono text-sm font-semibold text-foreground">{label}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{help}</div>
      </div>
      <div className="font-mono text-2xl font-bold text-amber-400">{value}</div>
    </div>
    <Slider min={min} max={max} step={step} value={[value]} onValueChange={(v) => onChange(v[0])} />
    <div className="flex justify-between font-mono text-[10px] text-muted-foreground mt-1">
      <span>{min}</span>
      <span>{max}</span>
    </div>
  </div>
);

export default AdminConfigTab;
