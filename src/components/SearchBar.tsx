import React, { useState, useEffect, useCallback } from 'react';
import { ActionIcon, Loader, Tooltip } from '@mantine/core';
import { IconSearch, IconX, IconTextSize, IconRegex } from '@tabler/icons-react';
import { SearchMode } from '../types';

export interface SearchBarProps {
  // Search query value
  value: string;
  // Search mode
  mode: SearchMode;
  // Loading state
  loading?: boolean;
  // Callback when search is triggered
  onSearch: (query: string, mode: SearchMode) => void;
  // Callback when search is cleared
  onClear: () => void;
  // Callback when ESC key is pressed (optional)
  onEscape?: () => void;
  // Placeholder text
  placeholder?: string;
  // Stretch to the full width of its container (mobile search row)
  fullWidth?: boolean;
  // Hint shown at the right edge while the field is empty, e.g. "⌘+F"
  shortcutHint?: string;
  // Ref to the underlying input, used by the focus hotkey
  inputRef?: React.Ref<HTMLInputElement>;
}

/**
 * SearchBar component for filtering S3 objects
 * Supports fuzzy matching and regex search
 * Press Enter to search, auto-reset when cleared
 */
const SearchBarComponent: React.FC<SearchBarProps> = ({
  value,
  mode,
  loading = false,
  onSearch,
  onClear,
  onEscape,
  placeholder = 'Search files ↵',
  fullWidth = false,
  shortcutHint,
  inputRef,
}) => {
  const [localQuery, setLocalQuery] = useState(value);
  const [localMode, setLocalMode] = useState<SearchMode>(mode);

  // Sync with external value
  useEffect(() => {
    setLocalQuery(value);
  }, [value]);

  useEffect(() => {
    setLocalMode(mode);
  }, [mode]);

  // Handle input change
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newQuery = event.currentTarget.value;
      setLocalQuery(newQuery);

      // Auto-clear when input is empty
      if (!newQuery.trim()) {
        onClear();
      }
    },
    [onClear]
  );

  // Handle mode change
  const handleModeChange = useCallback(
    (newMode: SearchMode) => {
      setLocalMode(newMode);

      // Re-trigger search with new mode if query exists and already searched
      if (localQuery.trim() && value) {
        onSearch(localQuery, newMode);
      }
    },
    [localQuery, value, onSearch]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    setLocalQuery('');
    onClear();
  }, [onClear]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        // Prevent default behavior to keep focus
        event.preventDefault();
        // Trigger search on Enter
        if (localQuery.trim()) {
          onSearch(localQuery, localMode);
        }
      } else if (event.key === 'Escape') {
        // Clear on Escape, blur input, and trigger onEscape callback
        handleClear();
        event.currentTarget.blur();
        if (onEscape) {
          onEscape();
        }
      }
    },
    [localQuery, localMode, onSearch, handleClear, onEscape]
  );

  const isRegex = localMode === 'regex';

  return (
    <div className={`sv-search${fullWidth ? ' is-full' : ''}`}>
      {loading ? <Loader size={12} /> : <IconSearch size={14} />}
      <input
        ref={inputRef}
        value={localQuery}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={loading}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
      {localQuery && (
        <ActionIcon
          size="xs"
          variant="subtle"
          color="gray"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <IconX size={12} />
        </ActionIcon>
      )}
      <Tooltip
        label={
          isRegex
            ? 'Regular expression (click for fuzzy)'
            : 'Fuzzy search, case-insensitive (click for regex)'
        }
        withArrow
      >
        <ActionIcon
          size="xs"
          variant={isRegex ? 'light' : 'subtle'}
          color={isRegex ? undefined : 'gray'}
          onClick={() => handleModeChange(isRegex ? 'fuzzy' : 'regex')}
          disabled={loading}
          aria-label={isRegex ? 'Regex mode' : 'Fuzzy mode'}
        >
          {isRegex ? <IconRegex size={13} /> : <IconTextSize size={13} />}
        </ActionIcon>
      </Tooltip>
      {!localQuery && shortcutHint && (
        <span className="sv-kbd">{shortcutHint}</span>
      )}
    </div>
  );
};

// Default shallow compare: onSearch changes with bucket/prefix, and a stale
// copy would search the previous location
export const SearchBar = React.memo(SearchBarComponent);

SearchBar.displayName = 'SearchBar';
