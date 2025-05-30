import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageMultiSelect } from '../useImageMultiSelect';

// Mock Supabase client
vi.mock('../../supabaseClient', () => ({
  getSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ error: null }))
      })),
      update: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }))
}));

describe('useImageMultiSelect', () => {
  const mockItems = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
    { id: '4', name: 'Item 4' },
    { id: '5', name: 'Item 5' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useImageMultiSelect(mockItems));
    
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.selectedItems).toEqual([]);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.isSomeSelected).toBe(false);
  });

  it('should select and deselect items', () => {
    const { result } = renderHook(() => useImageMultiSelect(mockItems));

    // Select an item
    act(() => {
      result.current.selectItem('1');
    });

    expect(result.current.selectedIds.has('1')).toBe(true);
    expect(result.current.selectedItems).toEqual([mockItems[0]]);
    expect(result.current.isSomeSelected).toBe(true);

    // Deselect the item
    act(() => {
      result.current.deselectItem('1');
    });

    expect(result.current.selectedIds.has('1')).toBe(false);
    expect(result.current.selectedItems).toEqual([]);
    expect(result.current.isSomeSelected).toBe(false);
  });

  it('should toggle items', () => {
    const { result } = renderHook(() => useImageMultiSelect(mockItems));

    // Toggle on
    act(() => {
      result.current.toggleItem('2');
    });

    expect(result.current.selectedIds.has('2')).toBe(true);

    // Toggle off
    act(() => {
      result.current.toggleItem('2');
    });

    expect(result.current.selectedIds.has('2')).toBe(false);
  });

  it('should select all and deselect all', () => {
    const { result } = renderHook(() => useImageMultiSelect(mockItems));

    // Select all
    act(() => {
      result.current.selectAll();
    });

    expect(result.current.selectedIds.size).toBe(5);
    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.selectedItems.length).toBe(5);

    // Deselect all
    act(() => {
      result.current.deselectAll();
    });

    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.selectedItems.length).toBe(0);
  });

  it('should toggle all items', () => {
    const { result } = renderHook(() => useImageMultiSelect(mockItems));

    // Toggle all (should select all)
    act(() => {
      result.current.toggleAll();
    });

    expect(result.current.isAllSelected).toBe(true);

    // Toggle all again (should deselect all)
    act(() => {
      result.current.toggleAll();
    });

    expect(result.current.isAllSelected).toBe(false);
  });

  it('should select range of items', () => {
    const { result } = renderHook(() => useImageMultiSelect(mockItems));

    // Select first item
    act(() => {
      result.current.selectItem('1');
    });

    // Select range from first to third
    act(() => {
      result.current.selectRange('3');
    });

    expect(result.current.selectedIds.size).toBe(3);
    expect(result.current.selectedIds.has('1')).toBe(true);
    expect(result.current.selectedIds.has('2')).toBe(true);
    expect(result.current.selectedIds.has('3')).toBe(true);
  });

  it('should handle keyboard shortcuts', () => {
    const { result } = renderHook(() => useImageMultiSelect(mockItems));

    // Test Cmd/Ctrl + A
    const selectAllEvent = new KeyboardEvent('keydown', {
      key: 'a',
      metaKey: true
    });

    act(() => {
      result.current.handleKeyDown(selectAllEvent);
    });

    expect(result.current.isAllSelected).toBe(true);

    // Test Escape
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape'
    });

    act(() => {
      result.current.handleKeyDown(escapeEvent);
    });

    expect(result.current.selectedIds.size).toBe(0);
  });

  it('should delete selected items', async () => {
    const { result } = renderHook(() => useImageMultiSelect(mockItems));

    // Select some items
    act(() => {
      result.current.selectItem('1');
      result.current.selectItem('2');
    });

    // Delete selected
    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.deleteSelected('test_table');
    });

    expect(deleteResult.success).toEqual(['1', '2']);
    expect(deleteResult.errors).toEqual([]);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('should move selected items', async () => {
    const { result } = renderHook(() => useImageMultiSelect(mockItems));

    // Select some items
    act(() => {
      result.current.selectItem('3');
      result.current.selectItem('4');
    });

    // Move selected
    let moveResult;
    await act(async () => {
      moveResult = await result.current.moveSelected('test_table', 'new_collection_id');
    });

    expect(moveResult.success).toEqual(['3', '4']);
    expect(moveResult.errors).toEqual([]);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('should handle errors in bulk operations', async () => {
    const mockError = new Error('Database error');
    const onError = vi.fn();

    // Mock Supabase to return an error
    const { getSupabase } = await import('../../supabaseClient');
    getSupabase.mockReturnValue({
      from: vi.fn(() => ({
        delete: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ error: mockError }))
        }))
      }))
    });

    const { result } = renderHook(() => 
      useImageMultiSelect(mockItems, { onError })
    );

    // Select and try to delete
    act(() => {
      result.current.selectItem('1');
    });

    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.deleteSelected('test_table');
    });

    expect(deleteResult.success).toEqual([]);
    expect(deleteResult.errors).toHaveLength(1);
    expect(onError).toHaveBeenCalledWith(mockError);
  });
});
