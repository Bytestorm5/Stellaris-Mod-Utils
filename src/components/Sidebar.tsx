import { Tabs, Button, IconButton, Icon, Badge } from "../ds";
import { OBJECT_TYPES } from "../objectTypes";
import type { Civic } from "../types";

export type SidebarTab = "types" | "inventory";

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
  tab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  activeType: string;
  onSelectType: (id: string) => void;
  civics: Civic[];
  activeCivicId: string;
  onSelectCivic: (id: string) => void;
  onAddCivic: () => void;
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  tab,
  onTabChange,
  activeType,
  onSelectType,
  civics,
  activeCivicId,
  onSelectCivic,
  onAddCivic,
}: Props) {
  const activeTypeDef = OBJECT_TYPES.find((t) => t.id === activeType);

  if (collapsed) {
    return (
      <aside className="sidebar sidebar--collapsed">
        <div className="sidebar__collapsed-rail">
          <IconButton label="Expand sidebar" onClick={onToggleCollapse}>
            <Icon name="PanelLeftOpen" size={18} />
          </IconButton>
          {OBJECT_TYPES.filter((t) => t.available).map((t) => (
            <IconButton
              key={t.id}
              label={t.label}
              variant={t.id === activeType ? "accent" : "ghost"}
              onClick={() => {
                onToggleCollapse();
                onSelectType(t.id);
              }}
            >
              <Icon name={t.icon} size={18} />
            </IconButton>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__head">
        <Tabs<SidebarTab>
          variant="pills"
          value={tab}
          onChange={onTabChange}
          className="spacer"
          items={[
            { value: "types", label: "Types" },
            { value: "inventory", label: "Inventory", count: civics.length },
          ]}
        />
        <IconButton label="Collapse sidebar" onClick={onToggleCollapse}>
          <Icon name="PanelLeftClose" size={18} />
        </IconButton>
      </div>

      {tab === "types" ? (
        <div className="sidebar__scroll">
          <div className="sidebar__section-label">Object types</div>
          {OBJECT_TYPES.map((t) => (
            <div
              key={t.id}
              className={[
                "navrow",
                !t.available && "navrow--disabled",
                t.available && t.id === activeType && "navrow--active",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => t.available && onSelectType(t.id)}
            >
              <span className="navrow__icon">
                <Icon name={t.icon} size={18} />
              </span>
              <span className="navrow__text">
                <div>{t.label}</div>
                <div className="navrow__sub">{t.blurb}</div>
              </span>
              {!t.available && <Badge tone="neutral">Soon</Badge>}
            </div>
          ))}
        </div>
      ) : (
        <div className="sidebar__scroll">
          <div className="sidebar__section-label">
            {activeTypeDef?.label ?? "Inventory"}
          </div>
          {civics.length === 0 && (
            <div className="empty">No civics yet. Create your first below.</div>
          )}
          {civics.map((c) => (
            <div
              key={c.id}
              className={[
                "inv-item",
                c.id === activeCivicId && "inv-item--active",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectCivic(c.id)}
            >
              <img className="inv-item__ico" src={c.iconDataUrl ?? undefined} alt="" />
              <div style={{ minWidth: 0 }}>
                <div className="inv-item__name">{c.name || "(unnamed)"}</div>
                <div className="inv-item__sub">
                  {c.modifiers.length} modifier
                  {c.modifiers.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            block
            leadingIcon={<Icon name="Plus" size={15} />}
            onClick={onAddCivic}
            style={{ marginTop: "var(--space-2)" }}
          >
            New civic
          </Button>
        </div>
      )}
    </aside>
  );
}
