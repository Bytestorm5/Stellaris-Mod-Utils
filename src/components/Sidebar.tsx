import { Tabs, Button, IconButton, Icon, Badge } from "../ds";
import { OBJECT_TYPES } from "../objectTypes";

export type SidebarTab = "types" | "inventory";

export interface SidebarItem {
  id: string;
  name: string;
  iconDataUrl?: string | null;
  sub?: string;
}

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
  tab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  activeType: string;
  onSelectType: (id: string) => void;
  items: SidebarItem[];
  typeLabel: string;
  newLabel: string;
  activeItemId: string;
  onSelectItem: (id: string) => void;
  onAddItem: () => void;
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  tab,
  onTabChange,
  activeType,
  onSelectType,
  items,
  typeLabel,
  newLabel,
  activeItemId,
  onSelectItem,
  onAddItem,
}: Props) {
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
            { value: "inventory", label: "Inventory", count: items.length },
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
          <div className="sidebar__section-label">{typeLabel}</div>
          {items.length === 0 && (
            <div className="empty">
              Nothing here yet. Create your first below.
            </div>
          )}
          {items.map((it) => (
            <div
              key={it.id}
              className={[
                "inv-item",
                it.id === activeItemId && "inv-item--active",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectItem(it.id)}
            >
              <img className="inv-item__ico" src={it.iconDataUrl ?? undefined} alt="" />
              <div style={{ minWidth: 0 }}>
                <div className="inv-item__name">{it.name || "(unnamed)"}</div>
                {it.sub && <div className="inv-item__sub">{it.sub}</div>}
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            block
            leadingIcon={<Icon name="Plus" size={15} />}
            onClick={onAddItem}
            style={{ marginTop: "var(--space-2)" }}
          >
            {newLabel}
          </Button>
        </div>
      )}
    </aside>
  );
}
