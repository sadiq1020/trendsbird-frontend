"use client";

import { useState } from "react";
import { CategoryTreeNode } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/shared/can";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  Package,
} from "lucide-react";

interface CategoryTreeProps {
  nodes: CategoryTreeNode[];
  onAddSubcategory: (parent: CategoryTreeNode) => void;
  onEdit: (category: CategoryTreeNode) => void;
  onDelete: (category: CategoryTreeNode) => void;
}

interface TreeNodeItemProps {
  node: CategoryTreeNode;
  level: number;
  onAddSubcategory: (parent: CategoryTreeNode) => void;
  onEdit: (category: CategoryTreeNode) => void;
  onDelete: (category: CategoryTreeNode) => void;
}

function TreeNodeItem({
  node,
  level,
  onAddSubcategory,
  onEdit,
  onDelete,
}: TreeNodeItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="space-y-1">
      <div
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
          node.active
            ? "bg-slate-900/80 border-slate-800 hover:border-slate-700"
            : "bg-slate-950/40 border-slate-900 opacity-75"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded"
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-blue-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          ) : (
            <span className="w-6" />
          )}

          {node.image ? (
            <img
              src={node.image}
              alt={node.name}
              className="w-7 h-7 rounded-md object-cover border border-slate-800 shrink-0"
            />
          ) : isOpen && hasChildren ? (
            <FolderOpen className="w-5 h-5 text-blue-400 shrink-0" />
          ) : (
            <Folder className="w-5 h-5 text-slate-400 shrink-0" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 text-xs sm:text-sm truncate">
                {node.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                /{node.slug}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-[10px] ${
              node.active
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {node.active ? "ACTIVE" : "INACTIVE"}
          </Badge>

          {node.productCount !== undefined && node.productCount > 0 && (
            <Badge
              variant="outline"
              className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px] gap-1"
            >
              <Package className="w-3 h-3" />
              <span>{node.productCount}</span>
            </Badge>
          )}

          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <Can I="category:create">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onAddSubcategory(node)}
                title="Add Subcategory"
                className="text-blue-400 hover:bg-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </Can>

            <Can I="category:update">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(node)}
                title="Edit Category"
                className="text-slate-300 hover:bg-slate-800"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            </Can>

            <Can I="category:delete">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(node)}
                title="Delete Category"
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </Can>
          </div>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="space-y-1">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              onAddSubcategory={onAddSubcategory}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({
  nodes,
  onAddSubcategory,
  onEdit,
  onDelete,
}: CategoryTreeProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs border border-slate-800 rounded-xl bg-slate-900/50">
        No category tree nodes found. Create a root category to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2 bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
      {nodes.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          level={0}
          onAddSubcategory={onAddSubcategory}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
