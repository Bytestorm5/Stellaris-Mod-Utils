import { Button, IconButton, Icon, LogoMark } from "../ds";

interface Props {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onExport: () => void;
  exporting: boolean;
  summary: string;
}

export default function TopBar({
  theme,
  onToggleTheme,
  onOpenSettings,
  onExport,
  exporting,
  summary,
}: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <LogoMark size={30} />
        <div className="brand__word">
          <strong>STELLARIS</strong>
          <span>MODDING UTILITIES</span>
        </div>
      </div>

      <div className="spacer" />
      <span className="topbar__meta">{summary}</span>

      <Button
        variant="secondary"
        size="sm"
        leadingIcon={<Icon name="Settings" size={15} />}
        onClick={onOpenSettings}
      >
        Mod settings
      </Button>

      <IconButton
        variant="ghost"
        label={theme === "dark" ? "Switch to light" : "Switch to dark"}
        onClick={onToggleTheme}
      >
        <Icon name={theme === "dark" ? "Sun" : "Moon"} size={18} />
      </IconButton>

      <Button
        variant="flare"
        size="sm"
        loading={exporting}
        leadingIcon={!exporting && <Icon name="Download" size={15} />}
        onClick={onExport}
      >
        {exporting ? "Building…" : "Export mod"}
      </Button>
    </header>
  );
}
