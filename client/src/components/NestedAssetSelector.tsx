import { useState } from "react";
import { ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  type: string;
  imageUrl?: string;
  color?: string;
  category: string;
}

interface NestedAssetSelectorProps {
  assets: Asset[];
  value: string | null;
  onChange: (assetId: string) => void;
  placeholder?: string;
  className?: string;
  showColorSwatch?: boolean;
}

export function NestedAssetSelector({
  assets,
  value,
  onChange,
  placeholder = "Choose option",
  className,
  showColorSwatch = false,
}: NestedAssetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [clickedGroup, setClickedGroup] = useState<string | null>(null);

  // Group assets by name
  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.name]) {
      acc[asset.name] = [];
    }
    acc[asset.name].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  const selectedAsset = assets.find(a => a.id === value);
  const activeGroup = clickedGroup || hoveredGroup;

  const handleGroupClick = (groupName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickedGroup === groupName) {
      setClickedGroup(null);
    } else {
      setClickedGroup(groupName);
    }
  };

  const handleAssetSelect = (assetId: string) => {
    onChange(assetId);
    setIsOpen(false);
    setClickedGroup(null);
    setHoveredGroup(null);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-gray-400 transition-colors"
        data-testid="nested-selector-trigger"
      >
        <span className={selectedAsset ? "text-gray-900 font-medium" : "text-gray-500"}>
          {selectedAsset ? `${selectedAsset.name} - ${selectedAsset.type}` : placeholder}
        </span>
        <ChevronRight className={cn(
          "h-5 w-5 text-gray-400 transition-transform",
          isOpen && "rotate-90"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-hidden">
          <div className="flex">
            {/* Main Groups Column */}
            <div className="w-1/2 border-r border-gray-200 overflow-y-auto max-h-96">
              {Object.entries(groupedAssets).map(([groupName, groupAssets]) => {
                const isGroupActive = activeGroup === groupName;
                const hasSelectedAsset = groupAssets.some(a => a.id === value);
                
                return (
                  <div
                    key={groupName}
                    className={cn(
                      "px-4 py-3 cursor-pointer flex items-center justify-between transition-colors",
                      isGroupActive && "bg-gray-100",
                      !isGroupActive && "hover:bg-gray-50"
                    )}
                    onMouseEnter={() => !clickedGroup && setHoveredGroup(groupName)}
                    onMouseLeave={() => !clickedGroup && setHoveredGroup(null)}
                    onClick={(e) => handleGroupClick(groupName, e)}
                    data-testid={`group-${groupName}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Group preview (first asset's image) */}
                      {groupAssets[0].imageUrl && (
                        <img
                          src={groupAssets[0].imageUrl}
                          alt={groupName}
                          className="w-10 h-10 object-cover rounded border border-gray-300"
                        />
                      )}
                      {showColorSwatch && groupAssets[0].color && !groupAssets[0].imageUrl && (
                        <div
                          className="w-10 h-10 rounded border border-gray-300"
                          style={{ backgroundColor: groupAssets[0].color }}
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{groupName}</div>
                        <div className="text-xs text-gray-500">{groupAssets.length} options</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasSelectedAsset && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtypes Column */}
            <div className="w-1/2 overflow-y-auto max-h-96 bg-gray-50">
              {activeGroup && groupedAssets[activeGroup] ? (
                <div className="p-2">
                  <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {activeGroup} Types
                  </div>
                  {groupedAssets[activeGroup].map((asset) => {
                    const isSelected = asset.id === value;
                    
                    return (
                      <div
                        key={asset.id}
                        className={cn(
                          "px-3 py-2 rounded-md cursor-pointer transition-colors mb-1",
                          isSelected && "bg-green-100 border border-green-300",
                          !isSelected && "hover:bg-white"
                        )}
                        onClick={() => handleAssetSelect(asset.id)}
                        data-testid={`asset-${asset.id}`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Asset image or color swatch */}
                          {asset.imageUrl && (
                            <img
                              src={asset.imageUrl}
                              alt={asset.type}
                              className="w-12 h-12 object-cover rounded border border-gray-300"
                            />
                          )}
                          {showColorSwatch && asset.color && !asset.imageUrl && (
                            <div
                              className="w-12 h-12 rounded border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: asset.color }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "text-sm font-medium truncate",
                              isSelected ? "text-green-900" : "text-gray-900"
                            )}>
                              {asset.type}
                            </div>
                            {asset.color && showColorSwatch && (
                              <div className="text-xs text-gray-500">{asset.color}</div>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400 p-4 text-center">
                  Hover or click on a group to see options
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setClickedGroup(null);
            setHoveredGroup(null);
          }}
        />
      )}
    </div>
  );
}
