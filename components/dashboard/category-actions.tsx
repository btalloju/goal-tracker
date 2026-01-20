"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditCategoryDialog } from "@/components/forms/edit-category-dialog";
import { DeleteCategoryButton } from "@/components/dashboard/delete-category-button";

interface CategoryActionsProps {
  category: {
    id: string;
    name: string;
    color: string;
  };
}

export function CategoryActions({ category }: CategoryActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditCategoryDialog category={category}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        </EditCategoryDialog>
        <DeleteCategoryButton categoryId={category.id} categoryName={category.name}>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DeleteCategoryButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
