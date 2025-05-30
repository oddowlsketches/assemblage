import { useState, useCallback, useMemo } from 'react';
import { getSupabase } from '../supabaseClient';

interface SelectedItem {
  id: string;
  [key: string]: any;
}

interface UseImageMultiSelectOptions {
  onError?: (error: Error) => void;
}

export function useImageMultiSelect<T extends SelectedItem>(
  items: T[],
  options?: UseImageMultiSelectOptions
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const supabase = getSupabase();

  // Computed values
  const selectedItems = useMemo(
    () => items.filter(item => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const isAllSelected = useMemo(
    () => items.length > 0 && selectedIds.size === items.length,
    [items.length, selectedIds.size]
  );

  const isSomeSelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < items.length,
    [items.length, selectedIds.size]
  );

  // Selection actions
  const selectItem = useCallback((id: string) => {
    setSelectedIds(prev => new Set([...prev, id]));
    setLastSelectedId(id);
  }, []);

  const deselectItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    setLastSelectedId(id);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [isAllSelected, selectAll, deselectAll]);

  // Range selection (shift+click)
  const selectRange = useCallback((toId: string) => {
    if (!lastSelectedId) {
      selectItem(toId);
      return;
    }

    const fromIndex = items.findIndex(item => item.id === lastSelectedId);
    const toIndex = items.findIndex(item => item.id === toId);

    if (fromIndex === -1 || toIndex === -1) {
      selectItem(toId);
      return;
    }

    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);

    const rangeIds = items
      .slice(start, end + 1)
      .map(item => item.id);

    setSelectedIds(prev => new Set([...prev, ...rangeIds]));
    setLastSelectedId(toId);
  }, [items, lastSelectedId, selectItem]);

  // Bulk operations
  const deleteSelected = useCallback(async (tableName: string) => {
    if (selectedIds.size === 0) return { success: [], errors: [] };

    const results = { success: [] as string[], errors: [] as { id: string; error: string }[] };

    try {
      const idsToDelete = Array.from(selectedIds);
      
      // Delete in batches of 100
      const batchSize = 100;
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from(tableName)
          .delete()
          .in('id', batch);

        if (error) {
          batch.forEach(id => {
            results.errors.push({ id, error: error.message });
          });
          if (options?.onError) {
            options.onError(error);
          }
        } else {
          results.success.push(...batch);
        }
      }

      // Clear selection for successfully deleted items
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        results.success.forEach(id => newSet.delete(id));
        return newSet;
      });

    } catch (error) {
      if (options?.onError && error instanceof Error) {
        options.onError(error);
      }
    }

    return results;
  }, [selectedIds, supabase, options]);

  const moveSelected = useCallback(async (
    tableName: string,
    targetCollectionId: string,
    collectionField: string = 'user_collection_id'
  ) => {
    if (selectedIds.size === 0) return { success: [], errors: [] };

    const results = { success: [] as string[], errors: [] as { id: string; error: string }[] };

    try {
      const idsToMove = Array.from(selectedIds);
      
      // Update in batches of 100
      const batchSize = 100;
      for (let i = 0; i < idsToMove.length; i += batchSize) {
        const batch = idsToMove.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from(tableName)
          .update({ [collectionField]: targetCollectionId })
          .in('id', batch);

        if (error) {
          batch.forEach(id => {
            results.errors.push({ id, error: error.message });
          });
          if (options?.onError) {
            options.onError(error);
          }
        } else {
          results.success.push(...batch);
        }
      }

      // Clear selection for successfully moved items
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        results.success.forEach(id => newSet.delete(id));
        return newSet;
      });

    } catch (error) {
      if (options?.onError && error instanceof Error) {
        options.onError(error);
      }
    }

    return results;
  }, [selectedIds, supabase, options]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Cmd/Ctrl + A to select all
    if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
      event.preventDefault();
      selectAll();
    }
    // Escape to deselect all
    else if (event.key === 'Escape') {
      deselectAll();
    }
  }, [selectAll, deselectAll]);

  return {
    selectedIds,
    selectedItems,
    isAllSelected,
    isSomeSelected,
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    deselectAll,
    toggleAll,
    selectRange,
    deleteSelected,
    moveSelected,
    handleKeyDown
  };
}
