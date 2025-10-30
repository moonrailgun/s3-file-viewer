import React, { useState, useEffect, useCallback } from 'react';
import {
  TextInput,
  ActionIcon,
  Group,
  Box,
  SegmentedControl,
  Tooltip,
} from '@mantine/core';
import {
  IconSearch,
  IconX,
  IconTextSize,
  IconRegex,
} from '@tabler/icons-react';
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
  // Compact mode (for mobile)
  compact?: boolean;
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
  placeholder = 'Search files... (Press Enter)',
  compact = false,
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
    (newMode: string) => {
      const searchMode = newMode as SearchMode;
      setLocalMode(searchMode);

      // Re-trigger search with new mode if query exists and already searched
      if (localQuery.trim() && value) {
        onSearch(localQuery, searchMode);
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

  return (
    <Group gap="xs" wrap="nowrap">
      <Box style={{ flex: 1, minWidth: compact ? 120 : 200 }}>
        <TextInput
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          size={compact ? 'xs' : 'sm'}
          leftSection={<IconSearch size={14} />}
          rightSection={
            localQuery && (
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={handleClear}
                title="Clear search"
              >
                <IconX size={14} />
              </ActionIcon>
            )
          }
          disabled={loading}
        />
      </Box>

      {!compact && (
        <Tooltip.Group>
          <SegmentedControl
            size="xs"
            value={localMode}
            onChange={handleModeChange}
            data={[
              {
                value: 'fuzzy',
                label: (
                  <Tooltip label="Fuzzy search (case-insensitive)" withArrow>
                    <Box style={{ display: 'flex', alignItems: 'center' }}>
                      <IconTextSize size={14} />
                    </Box>
                  </Tooltip>
                ),
              },
              {
                value: 'regex',
                label: (
                  <Tooltip label="Regular expression" withArrow>
                    <Box style={{ display: 'flex', alignItems: 'center' }}>
                      <IconRegex size={14} />
                    </Box>
                  </Tooltip>
                ),
              },
            ]}
          />
        </Tooltip.Group>
      )}
    </Group>
  );
};

// Memoized version with custom comparison to prevent unnecessary re-renders
export const SearchBar = React.memo(
  SearchBarComponent,
  (prevProps, nextProps) => {
    // Only re-render if these props actually change
    return (
      prevProps.value === nextProps.value &&
      prevProps.mode === nextProps.mode &&
      prevProps.loading === nextProps.loading &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.compact === nextProps.compact
      // onSearch and onClear are not compared (should be stable from useCallback)
    );
  }
);

SearchBar.displayName = 'SearchBar';
